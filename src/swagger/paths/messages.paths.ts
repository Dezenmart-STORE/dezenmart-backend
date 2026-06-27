/**
 * @swagger
 * /messages:
 *   get:
 *     tags: [Messages]
 *     summary: Get all conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of conversations
 *   post:
 *     tags: [Messages]
 *     summary: Send a message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: Recipient user ID
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *               order:
 *                 type: string
 *                 description: Related order ID
 *               messageFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Message sent
 *
 * /messages/{userId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get conversation with a user
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
 *         description: Conversation messages
 *
 * /messages/mark-read:
 *   post:
 *     tags: [Messages]
 *     summary: Mark messages as read
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageIds
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *     responses:
 *       '200':
 *         description: Messages marked as read
 */

export {};
