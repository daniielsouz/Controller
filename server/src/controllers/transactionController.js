import { FinancialMonth, Transaction } from "../models/index.js";
import {
  ensureFinancialMonth,
  recalculateForwardBalances,
  serializeMonth
} from "../services/financeService.js";
import { deleteReceipt, uploadReceipt } from "../services/uploadService.js";
import { validateEditableMonth } from "../utils/monthEditability.js";
import { validateTransactionPayload } from "../utils/transactionValidation.js";
import { validateAllowedYear } from "../utils/yearValidation.js";

const fetchAuthorizedTransaction = async (userId, transactionId) => {
  const transaction = await Transaction.findByPk(transactionId, {
    include: [{ model: FinancialMonth, as: "financialMonth" }]
  });

  if (!transaction || transaction.financialMonth.userId !== userId) {
    return null;
  }

  return transaction;
};

export const createTransaction = async (req, res) => {
  const { year, month, purchaseDate, description, invoiceNumber, category, type, amount } =
    req.body;
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const validationError = validateAllowedYear(parsedYear);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const editabilityError = validateEditableMonth(parsedYear, parsedMonth);

  if (editabilityError) {
    return res.status(400).json({ message: editabilityError });
  }

  const payloadError = validateTransactionPayload({
    year: parsedYear,
    month: parsedMonth,
    purchaseDate,
    description,
    invoiceNumber,
    category,
    type,
    amount
  });

  if (payloadError) {
    return res.status(400).json({ message: payloadError });
  }

  const ensuredMonth = await ensureFinancialMonth(req.user.id, parsedYear, parsedMonth);
  const receipt = await uploadReceipt(req.file);

  await Transaction.create({
    financialMonthId: ensuredMonth.id,
    purchaseDate,
    description,
    invoiceNumber,
    category,
    type,
    amount,
    receiptUrl: receipt?.url || null,
    receiptPublicId: receipt?.publicId || null
  });

  await recalculateForwardBalances(req.user.id, parsedYear, parsedMonth);

  const fullMonth = await FinancialMonth.findByPk(ensuredMonth.id, {
    include: [{ model: Transaction, as: "transactions" }]
  });

  return res.status(201).json(serializeMonth(fullMonth));
};

export const updateTransaction = async (req, res) => {
  const transaction = await fetchAuthorizedTransaction(req.user.id, req.params.id);

  if (!transaction) {
    return res.status(404).json({ message: "Lancamento nao encontrado." });
  }

  const editabilityError = validateEditableMonth(
    transaction.financialMonth.year,
    transaction.financialMonth.month
  );

  if (editabilityError) {
    return res.status(400).json({ message: editabilityError });
  }

  const nextPayload = {
    year: transaction.financialMonth.year,
    month: transaction.financialMonth.month,
    purchaseDate: req.body.purchaseDate ?? transaction.purchaseDate,
    description: req.body.description ?? transaction.description,
    invoiceNumber: req.body.invoiceNumber ?? transaction.invoiceNumber,
    category: req.body.category ?? transaction.category,
    type: req.body.type ?? transaction.type,
    amount: req.body.amount ?? transaction.amount
  };

  const payloadError = validateTransactionPayload(nextPayload);

  if (payloadError) {
    return res.status(400).json({ message: payloadError });
  }

  const receipt = await uploadReceipt(req.file);
  const previousReceipt = {
    receiptUrl: transaction.receiptUrl,
    receiptPublicId: transaction.receiptPublicId
  };

  Object.assign(transaction, {
    purchaseDate: nextPayload.purchaseDate,
    description: nextPayload.description,
    invoiceNumber: nextPayload.invoiceNumber,
    category: nextPayload.category,
    type: nextPayload.type,
    amount: nextPayload.amount,
    receiptUrl: receipt?.url || transaction.receiptUrl,
    receiptPublicId: receipt?.publicId || transaction.receiptPublicId
  });

  await transaction.save();

  if (receipt && (previousReceipt.receiptUrl || previousReceipt.receiptPublicId)) {
    await deleteReceipt(previousReceipt);
  }

  await recalculateForwardBalances(
    req.user.id,
    transaction.financialMonth.year,
    transaction.financialMonth.month
  );

  const fullMonth = await FinancialMonth.findByPk(transaction.financialMonthId, {
    include: [{ model: Transaction, as: "transactions" }]
  });

  return res.json(serializeMonth(fullMonth));
};

export const deleteTransaction = async (req, res) => {
  const transaction = await fetchAuthorizedTransaction(req.user.id, req.params.id);

  if (!transaction) {
    return res.status(404).json({ message: "Lancamento nao encontrado." });
  }

  const editabilityError = validateEditableMonth(
    transaction.financialMonth.year,
    transaction.financialMonth.month
  );

  if (editabilityError) {
    return res.status(400).json({ message: editabilityError });
  }

  const { year, month } = transaction.financialMonth;
  const financialMonthId = transaction.financialMonthId;
  const receiptToDelete = {
    receiptUrl: transaction.receiptUrl,
    receiptPublicId: transaction.receiptPublicId
  };

  await transaction.destroy();
  await deleteReceipt(receiptToDelete);
  await recalculateForwardBalances(req.user.id, year, month);

  const fullMonth = await FinancialMonth.findByPk(financialMonthId, {
    include: [{ model: Transaction, as: "transactions" }]
  });

  return res.json(serializeMonth(fullMonth));
};
