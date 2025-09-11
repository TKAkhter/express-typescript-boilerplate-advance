import { Router } from "express";
import authRouter from "@/routes/auth.route";
import userRouter from "@/routes/user.route";
import fileRouter from "@/routes/file.route";
import healthRouter from "@/routes/health.route";

export const apiRoutes = Router();

apiRoutes.use("/health", healthRouter);
apiRoutes.use("/auth", authRouter);
apiRoutes.use("/user", userRouter);
apiRoutes.use("/file", fileRouter);
