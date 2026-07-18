/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate Google OAuth login
 *     description: Redirects to Google OAuth. Requires a valid frontend origin.
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: Allowed frontend URL (e.g. http://localhost:5173)
 *     responses:
 *       '302':
 *         description: Redirect to Google OAuth
 *
 * /auth/google/one-tap:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in with Google One Tap / GIS ID token
 *     description: >
 *       Verifies the Google ID token (`credential`) from Google Identity Services
 *       One Tap, upserts the user, and returns an app JWT plus full user profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google ID token JWT from One Tap
 *     responses:
 *       '200':
 *         description: Authenticated successfully
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
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       '401':
 *         description: Invalid or unverified Google credential
 *       '422':
 *         description: Validation error
 *
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth callback
 *     description: Handles Google OAuth callback and redirects to frontend with JWT token.
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Base64-encoded state containing origin
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       '302':
 *         description: Redirect to frontend with token or error
 *
 * /auth/logout:
 *   get:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Ends the session and redirects to the frontend.
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *           format: uri
 *         description: Allowed frontend URL to redirect to
 *     responses:
 *       '302':
 *         description: Redirect to frontend
 */

export {};
