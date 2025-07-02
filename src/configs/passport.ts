import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { UserService } from '../services/userService';
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.APP_BASE_URL}/api/v1/auth/google/callback`,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const termsAccepted =
          req.session?.termsAccepted || req.query?.terms === 'accepted';

        if (!termsAccepted) {
          // Store the profile temporarily and redirect to terms page
          req.session!.pendingProfile = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            displayName: profile.displayName,
            photos: profile.photos,
          };

          return done(null, false, {
            message: 'terms_required',
            redirectTo: `/terms-and-conditions?returnUrl=${encodeURIComponent(req.originalUrl)}`,
          });
        }

        // Check if user already exists
        let existingUser = await UserService.getUserByEmail(
          profile.emails?.[0]?.value || '',
        );

        if (existingUser && !existingUser.hasAcceptedTerms) {
          // Existing user hasn't accepted terms yet
          return done(null, false, {
            message: 'existing_user_terms_required',
            redirectTo: `/terms-and-conditions?email=${encodeURIComponent(existingUser.email)}`,
          });
        }

        const { user, token } = await UserService.findOrCreateUser(profile);

        // Clear the pending profile from session
        if (req.session?.pendingProfile) {
          delete req.session.pendingProfile;
        }

        // Clear terms accepted flag
        if (req.session?.termsAccepted) {
          delete req.session.termsAccepted;
        }

        done(null, { user, token });
      } catch (error) {
        done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

export default passport;
