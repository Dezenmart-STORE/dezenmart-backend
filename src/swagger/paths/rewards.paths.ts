/**
 * @swagger
 * /rewards:
 *   get:
 *     tags: [Rewards]
 *     summary: Get user rewards
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User rewards list
 *
 * /rewards/summary:
 *   get:
 *     tags: [Rewards]
 *     summary: Get user reward points summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Points summary
 */

export {};
