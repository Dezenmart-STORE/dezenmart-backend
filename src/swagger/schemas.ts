/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from Google OAuth callback
 *
 *   parameters:
 *     page:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *     limit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *     mongoId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         message:
 *           type: string
 *
 *     CoverageArea:
 *       type: object
 *       required:
 *         - state
 *       properties:
 *         state:
 *           type: string
 *           example: Lagos
 *         lgas:
 *           type: array
 *           items:
 *             type: string
 *           example: [Ikeja, Eti-Osa]
 *         isStatewide:
 *           type: boolean
 *           default: false
 *
 *     WeightTier:
 *       type: object
 *       required:
 *         - minWeight
 *         - maxWeight
 *         - price
 *       properties:
 *         minWeight:
 *           type: number
 *           minimum: 0
 *         maxWeight:
 *           type: number
 *           minimum: 0
 *         price:
 *           type: number
 *           minimum: 0
 *
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             transactionHash:
 *               type: string
 *             receipt:
 *               type: object
 */

export {};
