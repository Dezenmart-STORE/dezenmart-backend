/**
 * @swagger
 * /ramp/on-ramp/initiate:
 *   post:
 *     tags: [Ramp]
 *     summary: Initiate an on-ramp transaction (NGN → crypto)
 *     description: Starts a fiat-to-crypto conversion via Quidax. Returns a merchant reference used for subsequent steps.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_amount, customer, wallet_address]
 *             properties:
 *               from_currency:
 *                 type: string
 *                 default: ngn
 *                 example: ngn
 *               to_currency:
 *                 type: string
 *                 default: usdt
 *                 example: usdt
 *               from_amount:
 *                 type: string
 *                 example: "5000"
 *               customer:
 *                 type: object
 *                 required: [email, name]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   name:
 *                     type: string
 *               wallet_address:
 *                 type: object
 *                 description: Target wallet address(es) keyed by network
 *                 example: { "usdt": "0xabc..." }
 *     responses:
 *       '201':
 *         description: On-ramp transaction initiated
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
 *                     merchantReference:
 *                       type: string
 *                     quidaxData:
 *                       type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/on-ramp/{merchantRef}/confirm:
 *   post:
 *     tags: [Ramp]
 *     summary: Confirm on-ramp transaction
 *     description: Confirms the on-ramp and returns a bank account the user should deposit NGN into.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRef
 *         required: true
 *         schema:
 *           type: string
 *         description: The merchant reference returned from initiate
 *     responses:
 *       '200':
 *         description: Bank account details for NGN deposit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/on-ramp/{merchantRef}/refresh:
 *   put:
 *     tags: [Ramp]
 *     summary: Refresh an on-ramp transaction
 *     description: Updates the amount on an existing on-ramp transaction before confirmation.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRef
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_amount]
 *             properties:
 *               from_currency:
 *                 type: string
 *                 default: ngn
 *               to_currency:
 *                 type: string
 *                 default: usdt
 *               from_amount:
 *                 type: string
 *                 example: "8000"
 *     responses:
 *       '200':
 *         description: On-ramp transaction refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/on-ramp/{merchantRef}:
 *   get:
 *     tags: [Ramp]
 *     summary: Fetch on-ramp transaction status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRef
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: On-ramp transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/off-ramp/initiate:
 *   post:
 *     tags: [Ramp]
 *     summary: Initiate an off-ramp transaction (crypto → NGN)
 *     description: Starts a crypto-to-fiat conversion via Quidax. Returns a merchant reference for subsequent steps.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_amount, network, customer]
 *             properties:
 *               from_currency:
 *                 type: string
 *                 default: usdt
 *                 example: usdt
 *               to_currency:
 *                 type: string
 *                 default: ngn
 *                 example: ngn
 *               from_amount:
 *                 type: string
 *                 example: "10"
 *               network:
 *                 type: string
 *                 example: BEP20
 *               customer:
 *                 type: object
 *                 required: [email, name]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   name:
 *                     type: string
 *     responses:
 *       '201':
 *         description: Off-ramp transaction initiated
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
 *                     merchantReference:
 *                       type: string
 *                     quidaxData:
 *                       type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/off-ramp/{merchantRef}/confirm:
 *   post:
 *     tags: [Ramp]
 *     summary: Confirm off-ramp transaction
 *     description: Confirms the off-ramp and returns a crypto deposit address the user should send funds to.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRef
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crypto deposit address for the off-ramp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/off-ramp/{merchantRef}/bank-account:
 *   post:
 *     tags: [Ramp]
 *     summary: Add bank account to off-ramp transaction
 *     description: Links a bank account for NGN disbursement once the crypto deposit is confirmed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRef
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bank_code, account_number]
 *             properties:
 *               bank_code:
 *                 type: string
 *                 description: Bank code from GET /ramp/banks
 *                 example: "011"
 *               account_number:
 *                 type: string
 *                 description: Account number — name must match the customer name used at initiation
 *                 example: "0123456789"
 *     responses:
 *       '200':
 *         description: Bank account linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/off-ramp/{merchantRef}:
 *   get:
 *     tags: [Ramp]
 *     summary: Fetch off-ramp transaction status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRef
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Off-ramp transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/banks:
 *   get:
 *     tags: [Ramp]
 *     summary: Get list of supported banks for off-ramp
 *     description: Returns banks supported by Quidax for NGN disbursement. Use bank_code when adding a bank account.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of supported banks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /ramp/webhook:
 *   post:
 *     tags: [Ramp]
 *     summary: Quidax webhook receiver
 *     description: >
 *       Public endpoint called by Quidax to notify transaction status changes.
 *       Verifies HMAC-SHA256 signature via the `x-quidax-signature` header
 *       (when QUIDAX_WEBHOOK_SECRET is set) and updates the local transaction record.
 *       Register this URL in your Quidax merchant dashboard.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchant_reference:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [initiated, confirmed, completed, failed]
 *     responses:
 *       '200':
 *         description: Webhook processed
 *       '401':
 *         description: Invalid webhook signature
 */
