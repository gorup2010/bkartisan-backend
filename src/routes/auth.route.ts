import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import {
  register,
  logout,
  loginSuccess,
  loginFail,
} from "../controllers/user.js";

import { sendPassword } from "../controllers/email.js";

import "dotenv/config";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";

// Extends the definition of the Request object
interface CustomRequest extends Request {
  user?: any;
}

const handleAuth = (loginType: "local" | "google" | "facebook") => {
  return (req, res, next) => {
    passport.authenticate(loginType, (err, user, info) => {
      console.log(user);
      // Handle when failure
      if (info?.lockResponse) {
        if (loginType === "local") {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .send({ lockResponse: info.lockResponse });
        } else {
          const lockResponse = info.lockResponse;
          const lockResponseString = encodeURIComponent(
            JSON.stringify(lockResponse)
          );
          const redirectURL =
            process.env.CLIENT_URL + `error?lockResponse=${lockResponseString}`;
          return res.redirect(redirectURL);
        }
      }

      if (err || !user) {
        if (loginType === "local") {
          return res.status(StatusCodes.UNAUTHORIZED).send({
            msg: "failure",
          });
        } else {
          return res.redirect(process.env.CLIENT_URL + "error");
        }
      }

      // Handle when success
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        if (loginType === "local") {
          return res.redirect("/login/success");
        } else {
          return res.redirect(process.env.CLIENT_URL);
        }
      });
    })(req, res, next);
  };
};

const authRouter = Router();

authRouter.post("/login", passport.authenticate("local"), loginSuccess);

authRouter.post("/register", register);

authRouter.post("/logout", logout);

// Call google auth
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// authRouter.get(
//   "/auth/google/callback",
//   passport.authenticate("google", {
//     successRedirect: process.env.CLIENT_URL,
//     failureRedirect: "/login/fail",
//   })
// );

authRouter.get("/auth/google/callback", handleAuth("google"));

authRouter.get(
  "/facebook",
  passport.authenticate("facebook", { scope: "email" })
);

authRouter.get("/auth/facebook/callback", handleAuth("facebook"));
// authRouter.get(
//   "/auth/facebook/callback",
//   passport.authenticate("facebook", {
//     successRedirect: process.env.CLIENT_URL,
//     failureRedirect: "/login/fail",
//   })
// );

authRouter.get("/login/fail", loginFail);

authRouter.get("/login/success", loginSuccess);

authRouter.post("/password", sendPassword);

export default authRouter;
