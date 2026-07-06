/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     responses:
 *       '200':
 *         description: List of products
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - type
 *               - category
 *               - sellerWalletAddress
 *               - stock
 *               - weight
 *               - state
 *               - lga
 *               - useUSDT
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               price:
 *                 type: number
 *                 format: float
 *               type:
 *                 type: string
 *                 description: JSON string of product type attributes
 *               category:
 *                 type: string
 *               sellerWalletAddress:
 *                 type: string
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 description: Product weight in kg or the unit your logistics logic expects
 *               state:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               lga:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               useUSDT:
 *                 type: boolean
 *               isSponsored:
 *                 type: boolean
 *                 default: false
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       '201':
 *         description: Product created
 *
 * /products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       '200':
 *         description: Search results
 *
 * /products/sponsored:
 *   get:
 *     tags: [Products]
 *     summary: Get sponsored products
 *     responses:
 *       '200':
 *         description: List of sponsored products
 *
 * /products/seller/{sellerId}:
 *   get:
 *     tags: [Products]
 *     summary: Get products by seller
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Seller products
 *
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product details
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Product details
 *       '404':
 *         description: Product not found
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               isSponsored:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       '200':
 *         description: Product updated
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Product deleted
 */

export {};
