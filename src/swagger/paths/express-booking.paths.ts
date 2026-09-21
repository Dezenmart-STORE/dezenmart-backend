/**
 * @swagger
 * /express/rides/book:
 *   post:
 *     tags: [Express Booking]
 *     summary: Book a ride
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, customerEmail, customerPhone, pickupAddress, dropoffAddress, fareAmount]
 *             properties:
 *               customerName: { type: string }
 *               customerEmail: { type: string, format: email }
 *               customerPhone: { type: string }
 *               pickupAddress:
 *                 type: object
 *                 required: [address]
 *                 properties:
 *                   label: { type: string }
 *                   address: { type: string }
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               dropoffAddress:
 *                 type: object
 *                 required: [address]
 *                 properties:
 *                   label: { type: string }
 *                   address: { type: string }
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               rideType: { type: string, enum: [standard, premium] }
 *               passengerCount: { type: integer, minimum: 1 }
 *               distanceKm: { type: number }
 *               fareAmount: { type: number }
 *               currency: { type: string, example: NGN }
 *               notes: { type: string }
 *     responses:
 *       '201':
 *         description: Ride booking created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *       '422':
 *         $ref: '#/components/responses/BadRequest'
 *
 * /express/deliveries/book:
 *   post:
 *     tags: [Express Booking]
 *     summary: Book a delivery
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, customerEmail, customerPhone, pickupAddress, dropoffAddress, fareAmount, package, recipientName, recipientPhone]
 *             properties:
 *               customerName: { type: string }
 *               customerEmail: { type: string, format: email }
 *               customerPhone: { type: string }
 *               pickupAddress: { type: object }
 *               dropoffAddress: { type: object }
 *               package:
 *                 type: object
 *                 required: [description]
 *                 properties:
 *                   description: { type: string }
 *                   sizeCategory: { type: string, enum: [small, medium, large] }
 *                   weightKg: { type: number }
 *                   value: { type: number }
 *               recipientName: { type: string }
 *               recipientPhone: { type: string }
 *               distanceKm: { type: number }
 *               fareAmount: { type: number }
 *               currency: { type: string, example: NGN }
 *               notes: { type: string }
 *     responses:
 *       '201':
 *         description: Delivery booking created
 *       '422':
 *         $ref: '#/components/responses/BadRequest'
 *
 * /express/orders:
 *   get:
 *     tags: [Express Booking]
 *     summary: Look up a customer's bookings by email or phone
 *     parameters:
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *       - in: query
 *         name: phone
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Matching bookings
 *       '422':
 *         $ref: '#/components/responses/BadRequest'
 *
 * /express/orders/{bookingRef}:
 *   get:
 *     tags: [Express Booking]
 *     summary: Get a booking by its reference
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Booking detail
 *       '404':
 *         description: Booking not found
 *
 * /express/orders/{bookingRef}/status:
 *   get:
 *     tags: [Express Booking]
 *     summary: Poll the current status of a booking
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Booking status
 *       '404':
 *         description: Booking not found
 *
 * /express/orders/{bookingRef}/cancel:
 *   patch:
 *     tags: [Express Booking]
 *     summary: Cancel a booking (only while it is still pending)
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       '200':
 *         description: Booking cancelled
 *       '400':
 *         description: Booking can no longer be cancelled
 *       '404':
 *         description: Booking not found
 */

export {};
