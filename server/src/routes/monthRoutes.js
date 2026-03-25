import { Router } from "express";
import {
  getMonthDetails,
  listYearMonths,
  exportMonthPdf,
  sendMonthReport,
  updateMonthNotes
} from "../controllers/monthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listYearMonths));
router.get("/:year/:month", asyncHandler(getMonthDetails));
router.get("/:year/:month/export-pdf", asyncHandler(exportMonthPdf));
router.put("/:year/:month", asyncHandler(updateMonthNotes));
router.post("/:year/:month/send-report", asyncHandler(sendMonthReport));

export default router;
