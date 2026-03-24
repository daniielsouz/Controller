import { Router } from "express";
import { login, me, register, updateProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(me));
router.put("/me", authMiddleware, asyncHandler(updateProfile));

export default router;
