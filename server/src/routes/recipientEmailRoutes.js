import { Router } from "express";
import {
  createRecipientEmail,
  deleteRecipientEmail,
  listRecipientEmails
} from "../controllers/recipientEmailController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listRecipientEmails));
router.post("/", asyncHandler(createRecipientEmail));
router.delete("/:id", asyncHandler(deleteRecipientEmail));

export default router;
