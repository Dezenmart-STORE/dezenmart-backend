/**
 * @swagger
 * /exchange-rate:
 *   get:
 *     tags: [Exchange Rate]
 *     summary: Get current exchange rate
 *     responses:
 *       '200':
 *         description: Current USD to token exchange rate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     rate:
 *                       type: object
 *   post:
 *     tags: [Exchange Rate]
 *     summary: Set exchange rate (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usdAmount
 *               - tokenAmount
 *             properties:
 *               usdAmount:
 *                 type: number
 *               tokenAmount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Exchange rate updated
 *
 * /exchange-rate/users/{userId}/tokens:
 *   patch:
 *     tags: [Exchange Rate]
 *     summary: Update user token balance (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: Positive to add, negative to subtract
 *     responses:
 *       '200':
 *         description: Token balance updated
 *
 * /exchange-rate/purchase:
 *   post:
 *     tags: [Exchange Rate]
 *     summary: Purchase tokens with USD
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usdAmount
 *             properties:
 *               usdAmount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Tokens purchased
 *
 * /exchange-rate/spend:
 *   post:
 *     tags: [Exchange Rate]
 *     summary: Spend tokens
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenAmount
 *             properties:
 *               tokenAmount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Tokens spent
 */

export {};
