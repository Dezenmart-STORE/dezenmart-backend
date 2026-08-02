/**
 * @swagger
 * /wallet/status:
 *   get:
 *     tags: [Wallet]
 *     summary: Get the authenticated user's wallet status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Wallet status for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WalletStatus'
 *             examples:
 *               hasWallet:
 *                 summary: Wallet on file
 *                 value:
 *                   status: success
 *                   data:
 *                     hasWallet: true
 *                     walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
 *                     chainId: 42220
 *                     provider: dynamic
 *               noWallet:
 *                 summary: No wallet set up yet
 *                 value:
 *                   status: success
 *                   data:
 *                     hasWallet: false
 *                     walletAddress: null
 *       '401':
 *         description: Authentication token required
 *
 * /wallet/setup:
 *   post:
 *     tags: [Wallet]
 *     summary: Attach or update a wallet on the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - chainId
 *               - provider
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 example: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
 *               chainId:
 *                 type: integer
 *                 example: 42220
 *               provider:
 *                 type: string
 *                 example: dynamic
 *               dynamicUserId:
 *                 type: string
 *                 description: Optional Dynamic.xyz user id
 *                 example: b9f1c2a0-1234-4a5b-8c9d-0e1f2a3b4c5d
 *     responses:
 *       '200':
 *         description: Resulting wallet status after setup, same shape as GET /wallet/status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WalletStatus'
 *       '401':
 *         description: Authentication token required
 *       '422':
 *         description: Validation error
 */

export {};
