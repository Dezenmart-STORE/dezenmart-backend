/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders
 *     description: Public list, or authenticated with type filter for buyer/seller orders.
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [buyer, seller]
 *         description: Filter by buyer or seller (requires authentication)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, completed, disputed, refunded, shipped, delivered, delivery_confirmed]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       '200':
 *         description: List of orders
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - quantity
 *               - quoteId
 *               - deliveryAddress
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product MongoDB ObjectId
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *               quoteId:
 *                 type: string
 *                 description: Logistics quote MongoDB ObjectId returned by the quote endpoint
 *               deliveryAddress:
 *                 type: object
 *                 description: Delivery address details to save for the buyer and use for this order
 *                 required:
 *                   - label
 *                   - fullName
 *                   - phone
 *                   - state
 *                   - lga
 *                   - street
 *                 properties:
 *                   label:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   lga:
 *                     type: string
 *                   street:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   isDefault:
 *                     type: boolean
 *     responses:
 *       '201':
 *         description: Order created with populated logistics provider details
 *
 * /orders/logistics/me:
 *   get:
 *     tags: [Orders]
 *     summary: Logistics provider dashboard — list assigned orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: logisticsStatus
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, shipped, delivered]
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Paginated orders assigned to the authenticated logistics provider
 *
 * /orders/logistics/me/{orderId}/accept:
 *   patch:
 *     tags: [Orders]
 *     summary: Accept a pending order (logistics provider)
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
 *         description: Order accepted
 *
 * /orders/logistics/me/{orderId}/reject:
 *   patch:
 *     tags: [Orders]
 *     summary: Decline a pending order (logistics provider)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Order declined
 *
 * /orders/logistics/me/{orderId}/ship:
 *   patch:
 *     tags: [Orders]
 *     summary: Mark an accepted order as shipped
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               expectedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Order shipped with shippedAt and expectedDeliveryDate metadata
 *
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Order details including logistics provider profile
 *   put:
 *     tags: [Orders]
 *     summary: Update an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Order updated
 *
 * /orders/{id}/dispute:
 *   post:
 *     tags: [Orders]
 *     summary: Raise a dispute on an order
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       '200':
 *         description: Dispute raised
 *
 * /orders/{id}/pay:
 *   post:
 *     tags: [Orders]
 *     summary: Initialize fiat payment for an order
 *     description: Only valid for orders with paymentMethod "fiat" that are still "pending". Fails if a payment is already in progress for the order.
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
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [paystack, flutterwave]
 *     responses:
 *       '200':
 *         description: Payment initialized — redirect the buyer to authorizationUrl to complete payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorizationUrl:
 *                       type: string
 *                     reference:
 *                       type: string
 *       '400':
 *         description: Order is not a fiat-payment order, or not in a payable status
 *       '401':
 *         description: Authentication token required
 *       '403':
 *         description: Not the order's buyer
 *       '404':
 *         description: Order not found
 *       '409':
 *         description: A payment is already in progress for this order
 *
 * /orders/{id}/payout:
 *   get:
 *     tags: [Orders]
 *     summary: Get the fiat payout status for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Payout status and individual payout legs (seller / logistics)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     payoutStatus:
 *                       type: string
 *                       enum: [none, processing, completed, partially_completed, failed]
 *                     payoutCompletedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     legs:
 *                       type: array
 *                       description: One entry per payout leg (seller, logistics)
 *                       items:
 *                         type: object
 *                         properties:
 *                           legType:
 *                             type: string
 *                             enum: [seller, logistics]
 *                           recipientType:
 *                             type: string
 *                             enum: [user, logistics]
 *                           provider:
 *                             type: string
 *                             enum: [paystack, flutterwave]
 *                           grossAmount:
 *                             type: number
 *                           feeAmount:
 *                             type: number
 *                           netAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [pending, processing, success, failed, blocked]
 *                           failureReason:
 *                             type: string
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *       '401':
 *         description: Authentication token required
 *       '404':
 *         description: Order not found
 *
 * /orders/{id}/payout/retry:
 *   post:
 *     tags: [Orders]
 *     summary: Retry a failed or stuck fiat payout for an order (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Payout retried; current payout status is returned (same shape as GET /orders/{id}/payout)
 *       '401':
 *         description: Authentication token required
 *       '403':
 *         description: Requires the admin role
 *       '404':
 *         description: Order not found
 */

export {};
