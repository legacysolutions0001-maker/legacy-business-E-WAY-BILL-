import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.set("trust proxy", 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "fallback-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

if (isProduction) {
  const frontendPath = path.resolve(process.cwd(), "artifacts/eway-bill/dist/public");
  app.use(express.static(frontendPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Global error handler — returns JSON with full error chain for diagnosis
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err instanceof Error ? err : new Error(String(err));
  const cause = e.cause instanceof Error ? e.cause.message : String(e.cause ?? "");
  const causeOfCause = e.cause instanceof Error && e.cause.cause instanceof Error
    ? e.cause.cause.message : "";
  const code = (err as NodeJS.ErrnoException)?.code;
  logger.error({ err, cause, code }, "Unhandled error");
  res.status(500).json({
    error: "Internal server error",
    detail: e.message,
    cause,
    causeOfCause,
    code,
  });
});

export default app;
