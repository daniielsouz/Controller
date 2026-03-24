import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requestPasswordReset, resetPassword } from "../controllers/passwordController.js";

const router = Router();

router.post("/forgot", asyncHandler(requestPasswordReset));
router.post("/reset", asyncHandler(resetPassword));

export default router;
