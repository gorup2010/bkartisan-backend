import passport from "passport";
import passportLocal from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import UserModel, { User } from "../models/user.model.js";
import { comparePassword } from "../utils/helpers.js";

const LocalStrategy = passportLocal.Strategy;

function passportConfig() {
  passport.serializeUser((user: any, done) => {
    // console.log("Serializing User...");
    // console.log(`seriallizing user = `, user);

    if (user.id) done(null, user.id);
    else done(null, user.username);
  });

  passport.deserializeUser(async (id: string, done) => {
    // console.log("Deserializing User");
    // console.log(id);
    try {
      const user = await UserModel.findOne(id);
      if (!user) throw new Error("User not found");
      done(null, user);
    } catch (err) {
      console.log(err);
      done(err, null);
    }
  });

  // Username & Password
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        if (!username || !password) {
          return done(null, false);
        }
        const userDB = await UserModel.findOne(username);
        // if (!userDB) throw new Error('User not found');
        if (!userDB) {
          return done(null, false);
        }
        const isValid = comparePassword(password, userDB.password);
        if (isValid) {
          const isUserLock = userDB.lockUntil && userDB.lockUntil > Date.now();
          if (isUserLock) {
            const lockResponse = await UserModel.getLockResponse(
              userDB.username
            );
            return done(null, false, { lockResponse });
          } else {
            return done(null, userDB);
          }
        } else {
          return done(null, undefined, { message: "Mật khẩu không đúng" });
        }
      } catch (err) {
        return done(err, undefined, { message: "Lỗi hệ thống" });
      }
    })
  );

  // Google
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID as string,
        clientSecret: process.env.CLIENT_SECRET as string,
        callbackURL: "/auth/google/callback",
      },
      async function (accessToken, refreshToken, profile: any, done) {
        // Add user to db
        try {
          if (profile?.id) {
            const userDB = await UserModel.findOne(profile.id);
            if (!userDB) {
              console.log("create new");
              const newUser: User = {
                username: profile.id,
                password: profile.id,
                name: profile.displayName,
                email: profile.emails[0]?.value,
                loginType: "google",
                role: "buyer",
                // status: 'N',
              };
              await UserModel.create(newUser);
            } else {
              const isUserLock =
                userDB.lockUntil && userDB.lockUntil > Date.now();
                if (isUserLock) {
                const lockResponse = await UserModel.getLockResponse(
                  userDB.username
                );
                return done(null, false, { lockResponse });
              }
            }
          }

          return done(null, profile);
        } catch (err) {
          console.log(err);
          return done(err, false, { message: "Lỗi hệ thống" })
        }
      }
    )
  );

  // Facebook
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/auth/facebook/callback",
        profileFields: [
          "id",
          "about",
          "displayName",
          "name",
          "emails",
          "gender",
          "profileUrl",
          "photos",
        ],
      },
      async function (
        accessToken: any,
        refreshToken: any,
        profile: any,
        done: any
      ) {
        console.log(`profile = `, profile);
        try {
          const userDB = await UserModel.findOne(profile.id);
          if (!userDB) {
            const newUser: User = {
              username: profile.id,
              password: profile.id,
              name: profile.displayName,
              email: profile.emails[0]?.value,
              loginType: "facebook",
              role: "buyer",
              // status: 'N',
            };
            await UserModel.create(newUser);
          } else {
            const isUserLock =
              userDB.lockUntil && userDB.lockUntil > Date.now();
            if (isUserLock) {
              const lockResponse = await UserModel.getLockResponse(
                userDB.username
              );
              return done(null, false, { lockResponse });
            }
          }

          return done(null, userDB);
        } catch (err) {
          console.log(err);
          return done(err, false, { message: "Lỗi hệ thống" })
        }
      }
    )
  );
}

export default passportConfig;
