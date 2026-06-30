import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
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
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err instanceof Error ? err : new Error(String(err));
  const cause = e.cause instanceof Error ? e.cause.message : String(e.cause ?? "");
  const code = (err as NodeJS.ErrnoException)?.code;
  logger.error({ err, cause, code }, "Unhandled error");
  res.status(500).json({
    error: "Internal server error",
    detail: e.message,
    cause,
    code,
  });
});

export default app;
