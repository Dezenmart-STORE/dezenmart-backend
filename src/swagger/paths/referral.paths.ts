/**
 * @swagger
 * /referral/apply:
 *   post:
 *     tags: [Referral]
 *     summary: Apply a referral code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralCode
 *             properties:
 *               referralCode:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Referral code applied
 *
 * /referral/info:
 *   get:
 *     tags: [Referral]
 *     summary: Get referral information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Referral info including code and stats
 */

export {};
