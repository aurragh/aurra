import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { pool } from "./db";
import { storage } from "./storage";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);
  const sessionStore = new PgSession({
    pool,
    tableName: "sessions",
    createTableIfMissing: true,
  });

  app.set("trust proxy", 1);

  app.use(
    session({
      secret: requireEnv("SESSION_SECRET"),
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_MS,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const publicUrl = requireEnv("PUBLIC_URL").replace(/\/$/, "");

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: `${publicUrl}/api/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: unknown, user?: Express.User | false) => void,
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const photo = profile.photos?.[0]?.value;
          const sub = `google:${profile.id}`;

          await storage.upsertUser({
            id: sub,
            email: email ?? null,
            firstName: profile.name?.givenName ?? null,
            lastName: profile.name?.familyName ?? null,
            profileImageUrl: photo ?? null,
          });

          // Preserve the legacy "claims.sub" shape so existing routes keep working.
          const user = {
            claims: {
              sub,
              email,
              first_name: profile.name?.givenName,
              last_name: profile.name?.familyName,
              profile_image_url: photo,
              exp: Math.floor(Date.now() / 1000) + SESSION_TTL_MS / 1000,
            },
            expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MS / 1000,
          };

          done(null, user);
        } catch (err) {
          done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user as Express.User));

  app.get(
    "/api/login",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/?auth=failed",
      successRedirect: "/dashboard",
    }),
  );

  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as any)?.claims?.sub) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
