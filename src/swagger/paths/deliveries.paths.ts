/**
 * @swagger
 * /deliveries:
 *   get:
 *     tags: [Deliveries]
 *     summary: List deliveries
 *     description: Buyers see their deliveries, logistics agents see assigned deliveries, admins see all.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, picked_up, in_transit, delivered, cancelled, failed]
 *     responses:
 *       '200':
 *         description: Paginated deliveries
 *   post:
 *     tags: [Deliveries]
 *     summary: Create a delivery for an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *               - deliveryAddress
 *             properties:
 *               order:
 *                 type: string
 *                 description: Order MongoDB ObjectId
 *               deliveryAddress:
 *                 type: string
 *                 description: Saved delivery address ID
 *               logisticsProvider:
 *                 type: string
 *                 description: Optional logistics provider ID
 *               weight:
 *                 type: number
 *               deliveryFee:
 *                 type: number
 *               notes:
 *                 type: string
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '201':
 *         description: Delivery created
 *       '409':
 *         description: Delivery already exists for this order
 *
 * /deliveries/{id}:
 *   get:
 *     tags: [Deliveries]
 *     summary: Get delivery details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Delivery details
 *       '403':
 *         description: Not authorized to view this delivery
 *   put:
 *     tags: [Deliveries]
 *     summary: Update a delivery
 *     description: Logistics agents and admins can update status, tracking, and provider assignment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logisticsProvider:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, assigned, picked_up, in_transit, delivered, cancelled, failed]
 *               trackingNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *               weight:
 *                 type: number
 *               deliveryFee:
 *                 type: number
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Delivery updated
 *   delete:
 *     tags: [Deliveries]
 *     summary: Cancel a delivery
 *     description: Buyers can cancel pending/assigned deliveries. Admins can cancel any.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Delivery cancelled
 */

export {};
