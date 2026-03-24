import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import authRoutes from "./authRoutes.js";
import monthRoutes from "./monthRoutes.js";
import passwordRoutes from "./passwordRoutes.js";
import recipientEmailRoutes from "./recipientEmailRoutes.js";
import transactionRoutes from "./transactionRoutes.js";

const router = Router();

router.use("/password", passwordRoutes);
router.use("/auth", authRoutes);
router.use("/months", authMiddleware, monthRoutes);
router.use("/recipient-emails", authMiddleware, recipientEmailRoutes);
router.use("/transactions", authMiddleware, transactionRoutes);

export default router;
