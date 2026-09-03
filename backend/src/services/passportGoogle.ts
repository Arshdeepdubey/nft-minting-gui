import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "../config";
import { User } from "../models/User";

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google profile has no email"));
          }

          const user = await User.findOneAndUpdate(
            { ssoProvider: "google", ssoId: profile.id },
            {
              $setOnInsert: {
                ssoProvider: "google",
                ssoId: profile.id,
                role: "user",
              },
              $set: {
                email,
                name: profile.displayName ?? email,
              },
            },
            { upsert: true, new: true }
          );

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

export { passport };
