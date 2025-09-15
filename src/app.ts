import { cors } from "./middlewares/cors";
import { errorMiddleware } from "./middlewares/error-middleware";
import express, { NextFunction, Request, Response } from "express";
import { apiRoutes } from "@/routes/routes";
import { env } from "@/config/env";
import { logger, morganStream } from "@/common/winston/winston";
import { openAPIRouter } from "@/common/swagger/swagger.router";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import path from "node:path";
import rateLimit from "express-rate-limit";
import responseTime from "response-time";
import timeout from "connect-timeout";

const app = express();

// Middlewares
app.use(cors); // Make sure this middleware is defined properly
logger.info("CORS middleware applied");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
logger.info("Helmet middleware applied");

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  headers: true,
});
logger.info("Rate limiting middleware created");

app.use(cookieParser());
logger.info("Cookie parser middleware applied");

if (env.ENABLE_WINSTON) {
  app.use(morgan("dev", { stream: morganStream }));
} else {
  app.use(morgan("dev"));
}
logger.info("Morgan middleware applied");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
logger.info("Body parser middleware applied");

app.use(compression({ level: 1 }));
logger.info("Compression middleware applied");

app.use(hpp());
logger.info("hpp middleware applied");

app.use(limiter);
logger.info("Rate limiting middleware applied");

// Response Time Middleware
app.use(responseTime());
logger.info("Response time middleware applied");

// Timeout Middleware
app.use(timeout(env.SERVER_TIMEOUT, { respond: true })); // Set a 30-second timeout for all routes
logger.info("Timeout middleware applied"); // Log timeout middleware

// Routes
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
logger.info("Uploads routes set up");

app.use("/logs", express.static(path.join(__dirname, "../logs")));
logger.info("Logs routes set up");

app.use("/api", apiRoutes);
logger.info("API routes set up");

// Swagger UI
app.use(openAPIRouter);
logger.info("Swagger UI routes set up");

// Custom Error Handler Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

// Catch 404 and forward to error handler
app.use((_: Request, res: Response) => {
  logger.warn("Route not found");
  res.status(404).send("Route not found");
});

export default app;
