import { FinancialMonth, Transaction } from "../models/index.js";
import { sendMonthlyReportEmail } from "../services/emailService.js";
import { ensureFinancialMonth, serializeMonth } from "../services/financeService.js";
import { generateMonthlyPdf } from "../services/pdfService.js";
import { cleanupExpiredReceiptsForUser } from "../services/receiptRetentionService.js";
import { buildReceiptEmailAttachments } from "../services/uploadService.js";
import { validateEditableMonth } from "../utils/monthEditability.js";
import { validateMonthPayload } from "../utils/transactionValidation.js";
import { validateAllowedYear } from "../utils/yearValidation.js";

export const listYearMonths = async (req, res) => {
  await cleanupExpiredReceiptsForUser(req.user.id);

  const year = Number(req.query.year || new Date().getFullYear());
  const validationError = validateAllowedYear(year);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const months = [];

  for (let month = 1; month <= 12; month += 1) {
    const ensuredMonth = await ensureFinancialMonth(req.user.id, year, month);
    const monthWithTransactions = await FinancialMonth.findByPk(ensuredMonth.id, {
      include: [{ model: Transaction, as: "transactions" }]
    });
    months.push(serializeMonth(monthWithTransactions));
  }

  return res.json(months);
};

export const getMonthDetails = async (req, res) => {
  await cleanupExpiredReceiptsForUser(req.user.id);

  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const validationError = validateAllowedYear(year);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const ensuredMonth = await ensureFinancialMonth(req.user.id, year, month);
  const fullMonth = await FinancialMonth.findByPk(ensuredMonth.id, {
    include: [{ model: Transaction, as: "transactions" }]
  });

  return res.json(serializeMonth(fullMonth));
};

export const updateMonthNotes = async (req, res) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const { notes, municipality } = req.body;
  const validationError = validateAllowedYear(year);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const editabilityError = validateEditableMonth(year, month);

  if (editabilityError) {
    return res.status(400).json({ message: editabilityError });
  }

  const payloadError = validateMonthPayload({ notes, municipality });

  if (payloadError) {
    return res.status(400).json({ message: payloadError });
  }

  const ensuredMonth = await ensureFinancialMonth(req.user.id, year, month);
  ensuredMonth.notes = notes;
  ensuredMonth.municipality = municipality?.trim() || "Chapeco";
  await ensuredMonth.save();

  const fullMonth = await FinancialMonth.findByPk(ensuredMonth.id, {
    include: [{ model: Transaction, as: "transactions" }]
  });

  return res.json(serializeMonth(fullMonth));
};

export const sendMonthReport = async (req, res) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const { email } = req.body;
  const validationError = validateAllowedYear(year);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const ensuredMonth = await ensureFinancialMonth(req.user.id, year, month);
  const fullMonth = await FinancialMonth.findByPk(ensuredMonth.id, {
    include: [{ model: Transaction, as: "transactions" }]
  });
  const monthData = serializeMonth(fullMonth);
  const pdfBuffer = await generateMonthlyPdf({
    user: req.user,
    monthData
  });
  const receiptAttachments = buildReceiptEmailAttachments(fullMonth.transactions || []);

  await sendMonthlyReportEmail({
    to: email,
    attachmentBuffer: pdfBuffer,
    filename: `controle-${year}-${String(month).padStart(2, "0")}.pdf`,
    monthLabel: `${String(month).padStart(2, "0")}/${year}`,
    userName: req.user?.name,
    contentType: "application/pdf",
    extensionLabel: "PDF",
    extraAttachments: receiptAttachments
  });

  return res.json({
    message: `Arquivo PDF enviado com sucesso${
      receiptAttachments.length ? ` com ${receiptAttachments.length} comprovante(s) para consulta.` : "."
    }`
  });
};

export const exportMonthPdf = async (req, res) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const validationError = validateAllowedYear(year);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const ensuredMonth = await ensureFinancialMonth(req.user.id, year, month);
  const fullMonth = await FinancialMonth.findByPk(ensuredMonth.id, {
    include: [{ model: Transaction, as: "transactions" }]
  });
  const monthData = serializeMonth(fullMonth);
  const pdfBuffer = await generateMonthlyPdf({
    user: req.user,
    monthData
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="controle-${year}-${String(month).padStart(2, "0")}.pdf"`
  );

  return res.send(pdfBuffer);
};
