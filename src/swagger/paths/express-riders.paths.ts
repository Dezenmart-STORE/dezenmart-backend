/**
 * @swagger
 * /express/riders/available:
 *   get:
 *     tags: [Express Riders]
 *     summary: List currently available (online, verified) riders
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: List of available riders
 *
 * /express/riders/{riderId}:
 *   get:
 *     tags: [Express Riders]
 *     summary: Get a rider's public profile
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Rider public profile
 *       '404':
 *         description: Rider not found
 *
 * /express/rider/register:
 *   post:
 *     tags: [Express Riders]
 *     summary: Register a new rider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, vehicleType, vehiclePlateNumber]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, minLength: 8 }
 *               vehicleType: { type: string, enum: [bike, car, van, truck, bicycle] }
 *               vehiclePlateNumber: { type: string }
 *               driverLicenseNumber: { type: string }
 *               bankName: { type: string }
 *               bankAccountNumber: { type: string }
 *               bankAccountName: { type: string }
 *     responses:
 *       '201':
 *         description: Rider registered, pending verification
 *       '409':
 *         description: Rider with this email or phone already exists
 *
 * /express/rider/auth/login:
 *   post:
 *     tags: [Express Riders]
 *     summary: Start rider login (sends an OTP to the rider's email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       '200':
 *         description: OTP sent
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /express/rider/auth/verify-otp:
 *   post:
 *     tags: [Express Riders]
 *     summary: Verify rider login OTP and receive a rider JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, example: '123456' }
 *     responses:
 *       '200':
 *         description: Rider JWT and profile
 *       '401':
 *         description: Invalid OTP
 *
 * /express/rider/requests:
 *   get:
 *     tags: [Express Riders]
 *     summary: List pending, paid bookings available for this rider to accept
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Pending booking requests
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /express/rider/requests/{id}/accept:
 *   patch:
 *     tags: [Express Riders]
 *     summary: Accept a pending booking request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Booking accepted
 *       '409':
 *         description: Booking no longer available
 *
 * /express/rider/requests/{id}/reject:
 *   patch:
 *     tags: [Express Riders]
 *     summary: Reject a pending booking request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Booking rejected for this rider
 *       '404':
 *         description: Booking not found
 *
 * /express/rider/bookings/{id}/status:
 *   patch:
 *     tags: [Express Riders]
 *     summary: Start an accepted booking (moves it to in_progress and emails the completion OTP)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [in_progress] }
 *     responses:
 *       '200':
 *         description: Booking status updated
 *       '400':
 *         description: Invalid status transition
 *
 * /express/rider/bookings/{id}/verify-otp:
 *   patch:
 *     tags: [Express Riders]
 *     summary: Verify the customer's completion OTP and complete the booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: '123456' }
 *     responses:
 *       '200':
 *         description: Booking completed and rider wallet credited
 *       '401':
 *         description: Invalid OTP
 *
 * /express/rider/wallet:
 *   get:
 *     tags: [Express Riders]
 *     summary: Get the rider's wallet balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Wallet balance
 *
 * /express/rider/transactions:
 *   get:
 *     tags: [Express Riders]
 *     summary: List the rider's wallet ledger transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Paginated ledger transactions
 *
 * /express/rider/withdraw:
 *   post:
 *     tags: [Express Riders]
 *     summary: Request a withdrawal from the rider wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       '201':
 *         description: Withdrawal request created (pending manual processing)
 *       '400':
 *         description: Insufficient balance or missing bank details
 */

export {};
