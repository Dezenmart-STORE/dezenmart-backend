/**
 * @swagger
 * /contracts/admin/register-logistics:
 *   post:
 *     tags: [Contracts]
 *     summary: Register logistics provider on-chain (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerAddress
 *             properties:
 *               providerAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *     responses:
 *       '200':
 *         description: Registration transaction sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *
 * /contracts/admin/resolve-dispute/{purchaseId}:
 *   post:
 *     tags: [Contracts]
 *     summary: Resolve a purchase dispute (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winner
 *             properties:
 *               winner:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *     responses:
 *       '200':
 *         description: Dispute resolution transaction sent
 *
 * /contracts/admin/withdraw-fees:
 *   post:
 *     tags: [Contracts]
 *     summary: Withdraw escrow fees (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Withdrawal transaction sent
 *
 * /contracts/register/buyer:
 *   post:
 *     tags: [Contracts]
 *     summary: Register as buyer on-chain
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Buyer registration transaction sent
 *
 * /contracts/register/seller:
 *   post:
 *     tags: [Contracts]
 *     summary: Register as seller on-chain
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Seller registration transaction sent
 *
 * /contracts/trades:
 *   post:
 *     tags: [Contracts]
 *     summary: Create a new trade on-chain
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productCost
 *               - logisticsProviders
 *               - logisticsCosts
 *               - totalQuantity
 *               - tokenAddress
 *               - sellerWalletAddress
 *             properties:
 *               productCost:
 *                 type: number
 *               logisticsProviders:
 *                 type: array
 *                 items:
 *                   type: string
 *               logisticsCosts:
 *                 type: array
 *                 items:
 *                   type: number
 *               totalQuantity:
 *                 type: number
 *               tokenAddress:
 *                 type: string
 *               sellerWalletAddress:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Trade created
 *
 * /contracts/trades/{tradeId}:
 *   get:
 *     tags: [Contracts]
 *     summary: Get trade details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tradeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Trade details
 *
 * /contracts/trades/{tradeId}/buy:
 *   post:
 *     tags: [Contracts]
 *     summary: Buy from a trade
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tradeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - logisticsProvider
 *               - tokenAddress
 *             properties:
 *               quantity:
 *                 type: number
 *               logisticsProvider:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Trade purchase successful
 *
 * /contracts/trades/seller/list:
 *   get:
 *     tags: [Contracts]
 *     summary: Get trades created by current seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Seller trades list
 *
 * /contracts/purchases/{purchaseId}:
 *   get:
 *     tags: [Contracts]
 *     summary: Get purchase details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Purchase details
 *
 * /contracts/purchases/{purchaseId}/confirm-delivery:
 *   post:
 *     tags: [Contracts]
 *     summary: Confirm delivery for a purchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Delivery confirmation transaction sent
 *
 * /contracts/purchases/{purchaseId}/confirm-purchase:
 *   post:
 *     tags: [Contracts]
 *     summary: Confirm a purchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Purchase confirmation transaction sent
 *
 * /contracts/purchases/{purchaseId}/cancel:
 *   post:
 *     tags: [Contracts]
 *     summary: Cancel a purchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Purchase cancellation transaction sent
 *
 * /contracts/purchases/{purchaseId}/dispute:
 *   post:
 *     tags: [Contracts]
 *     summary: Raise a dispute on a purchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Dispute transaction sent
 *
 * /contracts/purchases/buyer/list:
 *   get:
 *     tags: [Contracts]
 *     summary: Get purchases made by current buyer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Buyer purchases list
 *
 * /contracts/purchases/provider/list:
 *   get:
 *     tags: [Contracts]
 *     summary: Get purchases assigned to current logistics provider
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Provider purchases list
 *
 * /contracts/logistics:
 *   get:
 *     tags: [Contracts]
 *     summary: Get on-chain logistics providers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logistics providers list
 *
 * /contracts/usdt/balance/{address}:
 *   get:
 *     tags: [Contracts]
 *     summary: Get USDT balance for an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *     responses:
 *       '200':
 *         description: USDT balance
 *
 * /contracts/usdt/approve:
 *   post:
 *     tags: [Contracts]
 *     summary: Approve USDT spending
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: USDT approval transaction sent
 */

export {};
