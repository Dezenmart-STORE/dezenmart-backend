# Dezenmart Backend — Continuity & Technical Overview PRD

**Purpose of this document:** enable any engineer with no prior context to understand the system, keep it running, and continue development if the primary maintainer is unreachable for 24+ hours or longer. This is not a feature spec — it's an operational map of what exists, how it fits together, where the risk is, and what to do first in an emergency.

**Last updated:** 2026-07-15 (reflects `main` at commit `e671048`, including uncommitted local changes to the Quidax ramp feature — see [In-Flight Work](#in-flight-work)).

---

## 1. What Dezenmart Is

Dezenmart is a crypto-native marketplace backend. Buyers and sellers trade goods with payment settled on-chain (Celo network, stablecoins), with logistics/delivery tracking, an off-chain reward/referral points economy, and fiat on/off-ramp support so users can move between local currency and stablecoins without leaving the app.

Four frontends consume this single backend (see `DEZENMART_FRONTEND_URL`, `DEZENTRA_FRONTEND_URL`, `DEZENEXPRESS_FRONTEND_URL`, `LOGISTICS_FRONTEND_URL` in env) — a buyer/seller marketplace app, a companion app, an express variant, and a logistics-provider portal.

Public API reference: https://documenter.getpostman.com/view/43942900/2sB2j1hCDp
Live-generated docs: `<API_BASE_URL>/api-docs` (Swagger UI, served directly by this backend from source annotations in `src/swagger/paths/`).

## 2. High-Level Architecture

```
                        ┌─────────────────────────────┐
  4 frontend apps  ───► │   Express API (src/server.ts) │
  (marketplace,         │   REST @ /api/v1/*            │
  companion, express,   │   WebSocket (real-time chat/  │
  logistics)             │   notifications)              │
                        └───────────┬─────────────────┘
                                    │
        ┌───────────────┬──────────┼───────────┬───────────────┐
        ▼               ▼          ▼           ▼               ▼
   MongoDB (Atlas)   Celo chain  Quidax API  Cloudinary   Google OAuth
   (all app data)    (escrow     (fiat        (image       (login for
                      contract,  on/off-ramp) uploads)     logistics
                      Mento FX)                            providers)
```

- **Runtime:** Node.js ≥20, TypeScript, Express 5.
- **Entry point:** [src/server.ts](../src/server.ts) — boots the HTTP server, attaches the WebSocket service, and initializes singleton services (`NotificationService`, `RewardService`, `DezenMartContractService`).
- **App wiring:** [src/configs/app.ts](../src/configs/app.ts) — middleware order: session → passport → CORS → helmet (CSP configured) → morgan logging → body parsing → static files → Swagger UI at `/api-docs` → all API routes under `/api/v1` → global error handler (`src/middlewares/errorHandler.ts`) last.
- **No test suite and no CI pipeline exist in this repo today** (`find . -iname "*.test.ts"` returns nothing; no `.github/workflows`). Manual verification via Swagger UI and Postman is the current practice. This is the single biggest continuity risk — see [Section 8](#8-known-risks--gaps).

## 3. Domain Modules

Each module is a route → controller → service → model slice. All live under `src/`.

| Module | Route prefix | Purpose |
|---|---|---|
| Auth | `/auth` | Google OAuth (Passport) login, primarily for logistics provider onboarding. JWT issued for session auth on all other routes. |
| Users | `/users` | Profiles, roles (`user`, `buyer`, `seller`, `logistic agent`, `admin` — see `src/models/userModel.ts`), identity verification (Self.xyz — `SELF_APP_SCOPE`/`SELF_BACKEND_URL` config). |
| Products | `/products` | Seller product catalog, image uploads via Cloudinary. |
| Orders | `/orders` | Order lifecycle: `pending → accepted/rejected → shipped → delivered → delivery_confirmed → completed`, plus `disputed`/`refunded` branches. Ties into on-chain escrow release. |
| Contracts | `/contracts` | On-chain trade/purchase/escrow management on Celo via `DezenMartContractService` ([src/services/contractService.ts](../src/services/contractService.ts)), using `viem` + the deployed contract ABI (`src/abi/dezenmartAbi.json`). Handles multi-token payments (USDT, cUSD, and a long list of other Mento stablecoins). |
| Mento (FX) | `/mento` | Stablecoin-to-stablecoin swaps via `@mento-protocol/mento-sdk` ([src/services/mentoService.ts](../src/services/mentoService.ts)). |
| Exchange Rate | `/exchange-rate` | Internal exchange rate management feeding the token purchase/spend system. |
| Ramp (Quidax) | `/ramp` | **Newest feature, added this session.** Fiat on-ramp (buy crypto with local currency) and off-ramp (cash out crypto to bank/mobile money) via Quidax's ramp API. See [Section 7](#7-quidax-integration-newest-feature). |
| Logistics | `/logistics` | Logistics provider accounts and assignment to orders. Providers onboard via Google OAuth. |
| Deliveries / Delivery Addresses | `/deliveries`, `/delivery-addresses` | Delivery tracking and saved addresses (most recent completed feature before Quidax). |
| Rewards | `/rewards` | Points economy — awards points for events like `PRODUCT_SOLD` (100pts), `FIRST_PURCHASE` (50pts), `FIVE_STAR_REVIEW` (10pts), etc. Point values are hardcoded in [src/services/rewardService.ts](../src/services/rewardService.ts). Pushes live updates over WebSocket. |
| Referral | `/referral` | Referral code generation and referral-bonus rewards, built on top of the Rewards system. |
| Reviews | `/reviews` | Order/seller reviews; five-star reviews trigger reward points. |
| Watchlist | `/watchlist` | Buyer product watchlists. |
| Notifications | `/notifications` | Persisted notifications, pushed live via WebSocket (`WebSocketService`). |
| Messages | `/messages` | Direct messaging between users (buyer↔seller, likely buyer↔logistics), also real-time via WebSocket. Has an `antiSpamService.ts` guard. |

## 4. Data Layer

MongoDB (`MONGODB_URI`), accessed via Mongoose. Collections roughly mirror `src/models/`: `userModel`, `productModel`, `orderModel`, `reviewModel`, `rewardModel`, `watchlistModel`, `notificationModel`, `messageModel`, `logisticsModel`, `deliveryModel`, `deliveryAddressModel`, `exchangeRateModel`, `pricingRuleModel`, `quidaxTransactionModel`. No migration framework — schema changes are just Mongoose schema edits; there is no versioned migration history, so schema evolution needs care on any field rename/removal (check for existing documents with the old shape).

## 5. External Dependencies & Where Their Credentials Live

All secrets are environment variables (see [.env.example](../.env.example) — annotated with actual keys below). None are committed; whoever picks up this project **must independently obtain access to each of these accounts**, since a `.env` file alone won't be handed down through git.

| Dependency | Env vars | What breaks without it |
|---|---|---|
| MongoDB Atlas (or equivalent) | `MONGODB_URI` | Entire app — server refuses to serve without a DB connection (`process.exit(1)` on failure, see [src/configs/database.ts](../src/configs/database.ts)). |
| Celo blockchain | `CELO_NODE_URL`, `CONTRACT_ADDRESS`, `USDT_ADDRESS`, `PRIVATE_KEY`, `IS_TESTNET` | On-chain escrow, trades, and FX swaps. **`PRIVATE_KEY` is a live wallet private key that signs on-chain transactions on behalf of the platform — this is the highest-value credential in the system and must be treated like a bank account key.** |
| Quidax | `QUIDAX_API_KEY`, `QUIDAX_BASE_URL`, `QUIDAX_WEBHOOK_SECRET` | Fiat on/off-ramp. Webhook secret validates inbound Quidax callbacks — if wrong/missing, ramp status updates silently fail or (if verification is skipped) could accept forged callbacks. |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Product image and profile image uploads. |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Logistics provider login/onboarding. |
| Self.xyz | `SELF_APP_SCOPE`, `SELF_BACKEND_URL` | User identity verification. |
| Session/JWT | `SESSION_SECRET`, `JWT_SECRET` | Auth. **Both currently fall back to insecure hardcoded defaults (`'secret'` for JWT) if unset in some environments — verify these are set to strong random values in every deployed environment, not just locally.** |

**Action item for whoever takes over:** get added as an owner/admin (not just a viewer) on MongoDB Atlas, the hosting platform, Quidax merchant dashboard, Cloudinary, Google Cloud Console (OAuth app), and — critically — know who controls the `PRIVATE_KEY` wallet and how to rotate it if compromised.

## 6. Deployment & Environments

- Hosting is Heroku-style (`Procfile`: `web: npm start`), commonly Render/Railway/Heroku. **Confirm which platform is currently live** — this isn't recorded in the repo itself, and is exactly the kind of tribal knowledge that needs to be handed off explicitly (dashboard login, deploy branch, auto-deploy vs. manual).
- Build: `npm run build` (`tsc` → `dist/`). Run: `npm start` (`node dist/server.js`). Local dev: `npm run dev` (nodemon + ts-node, watches `src/`).
- Swagger server list is generated dynamically from `API_BASE_URL` at [src/swagger/index.ts](../src/swagger/index.ts) — production vs. local docs switch automatically based on that env var.
- No containerization (no Dockerfile) and no CI. Deploys are presumably git-push-triggered on whichever PaaS is in use, or manual.

## 7. Quidax Integration (Newest Feature)

This is the most recently built feature (commit `e671048`, plus uncommitted local edits to `src/routes/quidaxRoute.ts`, `src/services/quidaxService.ts`, `src/swagger/paths/quidax.paths.ts`, `src/utils/validations/quidaxValidation.ts` — **not yet committed as of this writing**). Whoever continues this work should run `git status`/`git diff` first to see the exact uncommitted state before assuming main reflects reality.

- **On-ramp:** user pays local currency → receives stablecoin/crypto in their wallet.
- **Off-ramp:** user sends crypto → receives local currency/mobile money payout.
- Transaction state is tracked in `quidaxTransactionModel.ts` with a `RampStatus` enum.
- `quidaxService.ts` wraps Quidax's REST API (`x-private-key` header auth) and generates merchant references as `dezenmrt-<suffix>-<timestamp>`.
- Webhook handling validates `QUIDAX_WEBHOOK_SECRET` to trust inbound status callbacks — verify this is enforced end-to-end (not just present in config) before treating ramp status updates as production-ready.

## 8. Known Risks & Gaps

1. **No automated tests, no CI.** Any change is verified manually. First priority for a new maintainer: at minimum smoke-test the critical paths (auth, order creation, contract escrow calls, Quidax ramp) before making changes.
2. **Wallet private key custody.** `PRIVATE_KEY` signs real on-chain transactions. Confirm today whether this is a testnet or mainnet key (`IS_TESTNET` flag) and who else has access/backup.
3. **Hardcoded secret fallbacks.** `JWT_SECRET` defaults to the literal string `'secret'` in [src/configs/config.ts](../src/configs/config.ts) if the env var is unset — audit all deployed environments to confirm this default is never actually in use.
4. **No schema migration tooling.** Mongoose schema changes need manual backward-compatibility review against existing documents.
5. **Contract event listener is currently disabled** — `contractService.listenForEvents()` is commented out in [src/server.ts](../src/server.ts). Confirm whether this is intentional (e.g., handled by a separate worker/process) or an oversight, since it affects whether on-chain events (trade completion, disputes) sync back into the app automatically.
6. **Hosting platform ownership is tribal knowledge**, not documented in-repo (see Section 6). This is the fastest thing to lose if the primary maintainer disappears.

## 9. First 24 Hours — If the Primary Maintainer Is Unreachable

1. Confirm access to: GitHub org (`Dezenmart-STORE`), hosting dashboard, MongoDB Atlas, Quidax merchant dashboard, Cloudinary, Google Cloud Console, and the Celo wallet controlling `PRIVATE_KEY`.
2. Run `git status` and `git log` on `main` to see exactly what's committed vs. in-flight (as of this doc, the Quidax ramp changes were uncommitted locally).
3. Check the live deployment is up (`GET <API_BASE_URL>/api-docs` should load Swagger UI) and check recent server logs on the hosting platform for errors.
4. Verify `.env` values in the deployed environment match [.env.example](../.env.example)'s key list — a missing var (especially `MONGODB_URI`, `JWT_SECRET`, `PRIVATE_KEY`) will hard-fail the app or silently degrade a feature.
5. If a code change is urgently needed, read [Section 3](#3-domain-modules) to locate the right route → controller → service → model chain, and cross-reference `src/swagger/paths/` for the documented request/response shape before changing an endpoint's contract.
