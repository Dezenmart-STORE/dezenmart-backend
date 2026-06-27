/**
 * @swagger
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewed
 *               - order
 *               - rating
 *             properties:
 *               reviewed:
 *                 type: string
 *                 description: User ID being reviewed
 *               order:
 *                 type: string
 *                 description: Order ID
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       '201':
 *         description: Review created
 *
 * /reviews/user-rating/{userId}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update user rating aggregate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Rating updated
 *
 * /reviews/user/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: User reviews
 *
 * /reviews/order/{orderId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get review for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Order review
 */

export {};
