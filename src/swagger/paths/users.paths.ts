/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Users]
 *     summary: Update authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               isMerchant:
 *                 type: boolean
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Updated user profile
 *       '401':
 *         description: Unauthorized
 *
 * /users/accept-terms:
 *   post:
 *     tags: [Users]
 *     summary: Accept terms and conditions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Terms accepted
 *
 * /users/terms-status:
 *   get:
 *     tags: [Users]
 *     summary: Get terms acceptance status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Terms status
 *
 * /users/verify-self:
 *   post:
 *     tags: [Users]
 *     summary: Submit Self identity verification proof
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proof
 *               - publicSignals
 *             properties:
 *               proof:
 *                 type: object
 *               publicSignals:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: Verification submitted
 *
 * /users/self/status:
 *   get:
 *     tags: [Users]
 *     summary: Get Self verification status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Verification status
 *
 * /users/self/revoke:
 *   delete:
 *     tags: [Users]
 *     summary: Revoke Self verification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Verification revoked
 *
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       '200':
 *         description: Paginated list of users
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: User details
 *       '404':
 *         description: User not found
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: User deleted
 *
 * /users/email/{email}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       '200':
 *         description: User details
 */

export {};
