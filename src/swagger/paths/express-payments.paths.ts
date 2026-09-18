/**
 * @swagger
 * /express/payments/initiate:
 *   post:
 *     tags: [Express Payments]
 *     summary: Initiate a Korapay charge for a booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingRef]
 *             properties:
 *               bookingRef: { type: string }
 *     responses:
 *       '201':
 *         description: Charge initiated, includes checkout URL
 *       '409':
 *         description: Booking already paid for
 *
 * /express/payments/{reference}/verify:
 *   get:
 *     tags: [Express Payments]
 *     summary: Verify a Korapay charge by reference
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Current payment status
 *       '404':
 *         description: Payment transaction not found
 *
 * /express/payments/webhook:
 *   post:
 *     tags: [Express Payments]
 *     summary: Korapay webhook (called by Korapay, not the client)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Webhook processed
 *       '401':
 *         description: Invalid webhook signature
 */

export {};
