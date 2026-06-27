/**
 * @swagger
 * /delivery-addresses:
 *   get:
 *     tags: [Delivery Addresses]
 *     summary: List saved delivery addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Paginated delivery addresses
 *   post:
 *     tags: [Delivery Addresses]
 *     summary: Create a delivery address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - fullName
 *               - phone
 *               - state
 *               - lga
 *               - street
 *             properties:
 *               label:
 *                 type: string
 *                 example: Home
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: '08012345678'
 *               country:
 *                 type: string
 *                 default: Nigeria
 *               state:
 *                 type: string
 *                 example: Lagos
 *               lga:
 *                 type: string
 *                 example: Ikeja
 *               street:
 *                 type: string
 *                 example: 12 Allen Avenue
 *               zipCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       '201':
 *         description: Address created
 *
 * /delivery-addresses/{id}:
 *   get:
 *     tags: [Delivery Addresses]
 *     summary: Get a delivery address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Delivery address details
 *       '404':
 *         description: Address not found
 *   put:
 *     tags: [Delivery Addresses]
 *     summary: Update a delivery address
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
 *               label:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *               lga:
 *                 type: string
 *               street:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Address updated
 *   delete:
 *     tags: [Delivery Addresses]
 *     summary: Delete a delivery address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Address deleted
 */

export {};
