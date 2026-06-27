/**
 * @swagger
 * /logistics/auth/google:
 *   get:
 *     tags: [Logistics]
 *     summary: Initiate Google OAuth for logistics providers
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *     responses:
 *       '302':
 *         description: Redirect to Google OAuth
 *
 * /logistics/auth/google/callback:
 *   get:
 *     tags: [Logistics]
 *     summary: Google OAuth callback for logistics
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       '302':
 *         description: Redirect to logistics frontend with token
 *
 * /logistics/me/onboarding:
 *   post:
 *     tags: [Logistics]
 *     summary: Complete logistics provider onboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - walletAddress
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *               coverageAreas:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CoverageArea'
 *     responses:
 *       '200':
 *         description: Onboarding complete
 *
 * /logistics/locations/states:
 *   get:
 *     tags: [Logistics]
 *     summary: Get all Nigerian states
 *     responses:
 *       '200':
 *         description: List of states
 *
 * /logistics/locations/states/{state}/lgas:
 *   get:
 *     tags: [Logistics]
 *     summary: Get LGAs for a state
 *     parameters:
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List of LGAs
 *
 * /logistics/available:
 *   get:
 *     tags: [Logistics]
 *     summary: Search available logistics providers for a route
 *     parameters:
 *       - in: query
 *         name: fromState
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromLga
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: toState
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: toLga
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: weight
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, days, rating]
 *           default: price
 *     responses:
 *       '200':
 *         description: Available providers with pricing
 *
 * /logistics/me:
 *   get:
 *     tags: [Logistics]
 *     summary: Get authenticated provider profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Provider profile
 *   put:
 *     tags: [Logistics]
 *     summary: Update authenticated provider profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               coverageAreas:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CoverageArea'
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Profile updated
 *
 * /logistics/providers/me/pricing-rules:
 *   get:
 *     tags: [Logistics]
 *     summary: Get pricing rules for current provider
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Pricing rules list
 *   post:
 *     tags: [Logistics]
 *     summary: Create a pricing rule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryType
 *               - fromState
 *               - toState
 *               - weightTiers
 *               - estimatedDaysMin
 *               - estimatedDaysMax
 *             properties:
 *               deliveryType:
 *                 type: string
 *                 enum: [intra_lga, inter_lga_same_state, inter_state]
 *               fromState:
 *                 type: string
 *               fromLga:
 *                 type: string
 *               toState:
 *                 type: string
 *               toLga:
 *                 type: string
 *               weightTiers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/WeightTier'
 *               insuranceFee:
 *                 type: number
 *                 default: 0
 *               packagingFee:
 *                 type: number
 *                 default: 0
 *               estimatedDaysMin:
 *                 type: integer
 *               estimatedDaysMax:
 *                 type: integer
 *     responses:
 *       '201':
 *         description: Pricing rule created
 *
 * /logistics/providers/me/pricing-rules/{ruleId}:
 *   put:
 *     tags: [Logistics]
 *     summary: Update a pricing rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weightTiers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/WeightTier'
 *               insuranceFee:
 *                 type: number
 *               packagingFee:
 *                 type: number
 *               estimatedDaysMin:
 *                 type: integer
 *               estimatedDaysMax:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Pricing rule updated
 *   delete:
 *     tags: [Logistics]
 *     summary: Delete a pricing rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Pricing rule deleted
 *
 * /logistics/providers/me/pricing-rules/{ruleId}/toggle:
 *   patch:
 *     tags: [Logistics]
 *     summary: Toggle pricing rule active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Pricing rule toggled
 *
 * /logistics/providers:
 *   get:
 *     tags: [Logistics]
 *     summary: Get all logistics providers
 *     responses:
 *       '200':
 *         description: Providers list
 *
 * /logistics/providers/{id}:
 *   get:
 *     tags: [Logistics]
 *     summary: Get provider by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Provider details
 *
 * /logistics/providers/{id}/verify:
 *   patch:
 *     tags: [Logistics]
 *     summary: Verify a logistics provider (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Provider verified
 *
 * /logistics:
 *   get:
 *     tags: [Logistics]
 *     summary: Get all logistics records (legacy)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logistics records
 *   post:
 *     tags: [Logistics]
 *     summary: Create logistics record (legacy)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '201':
 *         description: Logistics record created
 *
 * /logistics/{id}:
 *   get:
 *     tags: [Logistics]
 *     summary: Get logistics record by ID (legacy)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Logistics record
 *   put:
 *     tags: [Logistics]
 *     summary: Update logistics record (legacy)
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
 *         description: Logistics record updated
 *   delete:
 *     tags: [Logistics]
 *     summary: Delete logistics record (legacy)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoId'
 *     responses:
 *       '200':
 *         description: Logistics record deleted
 */

export {};
