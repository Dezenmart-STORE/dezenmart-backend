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
 *               - logisticsProvider
 *               - deliveryAddress
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product MongoDB ObjectId
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *               logisticsProvider:
 *                 type: string
 *                 description: Selected logistics provider MongoDB ObjectId
 *               deliveryAddress:
 *                 type: string
 *                 description: Buyer's saved delivery address ID
 *               deliveryFee:
 *                 type: number
 *                 description: Quoted delivery fee from provider search
 *               expectedDeliveryDate:
 *                 type: string
 *                 format: date-time
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
 */

export {};
