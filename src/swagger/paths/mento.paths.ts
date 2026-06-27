/**
 * @swagger
 * /mento/quote:
 *   post:
 *     tags: [Mento]
 *     summary: Get a token swap quote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenIn
 *               - tokenOut
 *               - amountIn
 *             properties:
 *               tokenIn:
 *                 type: string
 *                 description: Token symbol (CELO, CUSD, cREAL, cGBP, cEUR)
 *                 example: CELO
 *               tokenOut:
 *                 type: string
 *                 example: CUSD
 *               amountIn:
 *                 type: string
 *                 description: Amount to swap in wei/smallest unit
 *     responses:
 *       '200':
 *         description: Swap quote
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fromToken:
 *                   type: string
 *                 toToken:
 *                   type: string
 *                 amountIn:
 *                   type: string
 *                 estimatedAmountOut:
 *                   type: string
 *
 * /mento/swap:
 *   post:
 *     tags: [Mento]
 *     summary: Execute a token swap
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenIn
 *               - tokenOut
 *               - amountIn
 *             properties:
 *               tokenIn:
 *                 type: string
 *                 example: CELO
 *               tokenOut:
 *                 type: string
 *                 example: CUSD
 *               amountIn:
 *                 type: string
 *               slippage:
 *                 type: number
 *                 description: Slippage tolerance percentage
 *     responses:
 *       '200':
 *         description: Swap executed successfully
 */

export {};
