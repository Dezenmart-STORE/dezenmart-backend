import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { UserService } from '../services/userService';
import { LogisticsService } from '../services/logisticsService';
dotenv.config();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_BASE_URL}/api/v1/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { user, token } = await UserService.findOrCreateUser(profile);
          done(null, { user, token });
        } catch (error) {
          done(error);
        }
      },
    ),
  );

  passport.use(
    'google-logistics',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_BASE_URL}/api/v1/logistics/auth/google/callback`,
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (req: any, accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await LogisticsService.findOrCreateGoogleProvider(profile);
          done(null, authResult);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
} else {
  console.warn('[passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled.');
}

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
