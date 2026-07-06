/**
 * @swagger
 * /terms/current:
 *   get:
 *     tags: [Terms]
 *     summary: Get the active terms and conditions
 *     responses:
 *       '200':
 *         description: Active terms and conditions
 *       '404':
 *         description: No active terms found
 *
 * /terms:
 *   get:
 *     tags: [Terms]
 *     summary: List terms and conditions
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       '200':
 *         description: Paginated list of terms and conditions
 *   post:
 *     tags: [Terms]
 *     summary: Create terms and conditions (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Terms and Conditions
 *               content:
 *                 type: string
 *                 example: By using Dezenmart, you agree to...
 *               version:
 *                 type: string
 *                 example: '1.0.0'
 *               isActive:
 *                 type: boolean
 *                 description: Set as the active terms (deactivates others)
 *     responses:
 *       '201':
 *         description: Terms created
 *
 * /terms/{id}:
 *   get:
 *     tags: [Terms]
 *     summary: Get terms and conditions by ID
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Terms and conditions details
 *       '404':
 *         description: Terms not found
 *   put:
 *     tags: [Terms]
 *     summary: Update terms and conditions (Admin)
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               version:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Terms updated
 *   delete:
 *     tags: [Terms]
 *     summary: Delete terms and conditions (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Terms deleted
 */

export {};
