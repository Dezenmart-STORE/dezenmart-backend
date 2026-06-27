/**
 * @swagger
 * /watchlist:
 *   get:
 *     tags: [Watchlist]
 *     summary: Get user watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Watchlist items
 *
 * /watchlist/{productId}:
 *   post:
 *     tags: [Watchlist]
 *     summary: Add product to watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Product added to watchlist
 *   delete:
 *     tags: [Watchlist]
 *     summary: Remove product from watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Product removed from watchlist
 *
 * /watchlist/{productId}/check:
 *   get:
 *     tags: [Watchlist]
 *     summary: Check if product is in watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Watchlist check result
 */

export {};
