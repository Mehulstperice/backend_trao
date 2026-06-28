import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { tripRouter } from "./routes/tripRoutes.js";

dotenv.config();

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/trips", tripRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
