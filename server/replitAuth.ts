import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, Request, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "none" as const,
    },
  });
}

export function isSafeReturnTo(url: string) {
  if (url.startsWith("golfai://")) {
    return true;
  }

  if (!url.startsWith("/")) {
    return false;
  }

  // Prevent network-path references (e.g. //example.com)
  if (url.startsWith("//")) {
    return false;
  }

  return true;
}

export function parseReturnToParam(rawReturnTo: unknown): string | undefined {
  if (Array.isArray(rawReturnTo)) {
    return typeof rawReturnTo[0] === "string" ? rawReturnTo[0] : undefined;
  }

  return typeof rawReturnTo === "string" ? rawReturnTo : undefined;
}

export function sanitizeReturnTo(rawReturnTo: unknown): string | undefined {
  const parsedReturnTo = parseReturnToParam(rawReturnTo);

  if (!parsedReturnTo) {
    return undefined;
  }

  return isSafeReturnTo(parsedReturnTo) ? parsedReturnTo : undefined;
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

const MAX_RETURN_TO_LENGTH = 2048;
const ALLOWED_RETURN_TO_SCHEMES = new Set(["golfai"]);

function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > MAX_RETURN_TO_LENGTH) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    const scheme = parsed.protocol.replace(":", "");
    if (ALLOWED_RETURN_TO_SCHEMES.has(scheme)) {
      return parsed.toString();
    }
    return undefined;
  } catch {
    if (value.startsWith("/") && !value.startsWith("//")) {
      return value;
    }
    return undefined;
  }
}

type SessionWithReturnTo = session.Session & { returnTo?: string };

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const loginSession = req.session as SessionWithReturnTo;
    const requestedReturnTo = sanitizeReturnTo(req.query.returnTo);

    let sessionChanged = false;

    if (requestedReturnTo) {
      if (loginSession.returnTo !== requestedReturnTo) {
        loginSession.returnTo = requestedReturnTo;
        sessionChanged = true;
      }
    } else if (loginSession.returnTo) {
      delete loginSession.returnTo;
      sessionChanged = true;
    }

    const triggerLogin = () =>
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);

    if (sessionChanged) {
      req.session.save((error) => {
        if (error) {
          next(error);
          return;
        }
        triggerLogin();
      });
      return;
    }

    triggerLogin();
=======
    if (requestedReturnTo) {
      loginSession.returnTo = requestedReturnTo;
    } else if (loginSession.returnTo) {
      delete loginSession.returnTo;
=======
    const requestedReturnTo = parseReturnToParam(req.query.returnTo);
    const safeReturnTo = sanitizeReturnTo(req.query.returnTo);

    const sessionWithReturnTo = req.session as session.Session & {
      returnTo?: string;
    };

    if (safeReturnTo) {
      sessionWithReturnTo.returnTo = safeReturnTo;
      console.info("Stored returnTo for login redirect", safeReturnTo);
    } else {
      if (requestedReturnTo) {
        console.warn(
          "Ignoring unsafe returnTo parameter",
          requestedReturnTo
        );
      }

      delete sessionWithReturnTo.returnTo;
    }

    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);

  });

  app.get("/api/callback", (req, res, next) => {
    const loginSession = req.session as SessionWithReturnTo;
    const storedReturnTo = sanitizeReturnTo(loginSession.returnTo);

    let sessionChanged = false;

    if (loginSession.returnTo) {
      delete loginSession.returnTo;
      sessionChanged = true;
    }

    const handleAuth = () =>
      passport.authenticate(
        `replitauth:${req.hostname}`,
        (error: any, user: Express.User | false | null) => {
          if (error) {
            next(error);
            return;
          }

          if (!user) {
            res.redirect("/api/login");
            return;
          }

          req.logIn(user, (loginError) => {
            if (loginError) {
              next(loginError);
              return;
            }

            res.redirect(storedReturnTo ?? "/");
          });
        }
      )(req, res, next);

    if (sessionChanged) {
      req.session.save((error) => {
        if (error) {
          next(error);
          return;
        }
        handleAuth();
      });
      return;
    }

    handleAuth();
=======
    if (loginSession.returnTo) {
      delete loginSession.returnTo;
    }

    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: storedReturnTo ?? "/",
=======
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: storedReturnTo ?? "/",
    const sessionWithReturnTo = req.session as session.Session & {
      returnTo?: string;
    };
    const storedReturnTo = sessionWithReturnTo?.returnTo;
    const safeReturnTo = sanitizeReturnTo(storedReturnTo);

    if (storedReturnTo) {
      if (safeReturnTo) {
        console.info(
          "Using stored returnTo for login callback",
          safeReturnTo
        );
      } else {
        console.warn(
          "Discarding unsafe returnTo from session",
          storedReturnTo
        );
      }

      delete sessionWithReturnTo.returnTo;
    }

    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: safeReturnTo ?? "/",
      failureRedirect: "/api/login",
    })(req, res, next);

  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};