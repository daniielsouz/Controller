import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction
} from "../controllers/transactionController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", upload.single("receipt"), asyncHandler(createTransaction));
router.put("/:id", upload.single("receipt"), asyncHandler(updateTransaction));
router.delete("/:id", asyncHandler(deleteTransaction));

export default router;
