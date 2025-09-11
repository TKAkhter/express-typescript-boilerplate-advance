import { Router } from "express";
import authRouter from "@/routes/auth.route";
import userRouter from "@/routes/users.route";
import fileRouter from "@/routes/files.route";
import healthRouter from "@/routes/health.route";

export const apiRoutes = Router();

apiRoutes.use("/health", healthRouter);
apiRoutes.use("/auth", authRouter);
apiRoutes.use("/users", userRouter);
apiRoutes.use("/files", fileRouter);
