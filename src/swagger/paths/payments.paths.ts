/**
 * @swagger
 * /payments/banks:
 *   get:
 *     tags: [Payments]
 *     summary: List supported banks for a provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [paystack, flutterwave]
 *     responses:
 *       '200':
 *         description: List of banks supported by the given provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     banks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *       '401':
 *         description: Authentication token required
 *
 * /payments/resolve-account:
 *   post:
 *     tags: [Payments]
 *     summary: Resolve an account number to an account name
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *               - provider
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: '0123456789'
 *               bankCode:
 *                 type: string
 *                 example: '058'
 *               provider:
 *                 type: string
 *                 enum: [paystack, flutterwave]
 *     responses:
 *       '200':
 *         description: Resolved account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountName:
 *                       type: string
 *                       example: John Doe
 *       '401':
 *         description: Authentication token required
 *       '422':
 *         description: Validation error
 *
 * /payments/fiat-account:
 *   get:
 *     tags: [Payments]
 *     summary: Get the authenticated user's saved fiat payout account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The user's fiat account, or null if none is set up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     fiatAccount:
 *                       nullable: true
 *                       $ref: '#/components/schemas/FiatAccount'
 *       '401':
 *         description: Authentication token required
 *   post:
 *     tags: [Payments]
 *     summary: Set or update the authenticated user's fiat payout account
 *     description: Resolves the account number against the provider before saving; the account is marked verified on success.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - bankCode
 *               - accountNumber
 *               - provider
 *             properties:
 *               bankName:
 *                 type: string
 *                 example: Guaranty Trust Bank
 *               bankCode:
 *                 type: string
 *                 example: '058'
 *               accountNumber:
 *                 type: string
 *                 example: '0123456789'
 *               provider:
 *                 type: string
 *                 enum: [paystack, flutterwave]
 *     responses:
 *       '200':
 *         description: Fiat account saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     fiatAccount:
 *                       $ref: '#/components/schemas/FiatAccount'
 *       '401':
 *         description: Authentication token required
 *       '422':
 *         description: Validation error
 *
 * /payments/webhook/paystack:
 *   post:
 *     tags: [Payments]
 *     summary: Paystack webhook (called by Paystack, not by clients)
 *     description: Verifies the `x-paystack-signature` header against the raw request body. Handles `charge.success`, `transfer.success`, `transfer.failed`, and `transfer.reversed` events.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Event processed (or ignored if not a handled event type)
 *       '401':
 *         description: Invalid webhook signature
 *
 * /payments/webhook/flutterwave:
 *   post:
 *     tags: [Payments]
 *     summary: Flutterwave webhook (called by Flutterwave, not by clients)
 *     description: Verifies the webhook signature header against the raw request body. Handles `charge.completed` and `transfer.completed` events.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Event processed (or ignored if not a handled event type)
 *       '401':
 *         description: Invalid webhook signature
 */

export {};
