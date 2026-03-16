import { Router } from "express";
import { googleLogin, login, me, register } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleLogin));
router.get("/me", authMiddleware, asyncHandler(me));

export default router;
