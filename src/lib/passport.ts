import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "dotenv/config";
import { prisma } from "./prisma";

passport.serializeUser(function (user: Express.User, done) {
  done(null, user);
});

passport.deserializeUser(function (user: Express.User, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      prisma.user
        .upsert({
          where: {
            id: profile.id,
          },
          create: {
            id: profile.id,
            name: profile.displayName,
          },
          update: {},
        })
        .then((user) => {
          return cb(null, user);
        })
        .catch((err) => cb(err));
    }
  )
);

export { passport };
