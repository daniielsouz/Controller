import { Op } from "sequelize";
import { FinancialMonth, Transaction } from "../models/index.js";
import { isMonthEditable } from "../utils/monthEditability.js";

const parseMoney = (value) => Number(value || 0);

export const calculateMonthTotals = (transactions, openingBalance) => {
  const totals = transactions.reduce(
    (accumulator, transaction) => {
      const amount = parseMoney(transaction.amount);

      if (transaction.type === "deposito") {
        accumulator.deposits += amount;
      } else if (transaction.type === "credito") {
        accumulator.credits += amount;
      } else {
        accumulator.debits += amount;
      }

      return accumulator;
    },
    { deposits: 0, credits: 0, debits: 0 }
  );

  const closingBalance =
    Number(openingBalance || 0) + totals.deposits - totals.debits;

  return {
    ...totals,
    closingBalance
  };
};

export const getPreviousMonthCoordinates = (year, month) => {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
};

export const ensureFinancialMonth = async (userId, year, month) => {
  const existingMonth = await FinancialMonth.findOne({
    where: { userId, year, month }
  });

  if (existingMonth) {
    return existingMonth;
  }

  const previousCoordinates = getPreviousMonthCoordinates(year, month);
  const previousMonth = await FinancialMonth.findOne({
    where: {
      userId,
      year: previousCoordinates.year,
      month: previousCoordinates.month
    },
    include: [{ model: Transaction, as: "transactions" }]
  });

  const openingBalance = previousMonth
    ? calculateMonthTotals(previousMonth.transactions, previousMonth.openingBalance).closingBalance
    : 0;

  return FinancialMonth.create({
    userId,
    year,
    month,
    openingBalance,
    municipality: "Chapeco"
  });
};

export const recalculateForwardBalances = async (userId, year, month) => {
  const months = await FinancialMonth.findAll({
    where: {
      userId,
      [Op.or]: [
        { year: { [Op.gt]: year } },
        { year, month: { [Op.gte]: month } }
      ]
    },
    include: [{ model: Transaction, as: "transactions" }],
    order: [
      ["year", "ASC"],
      ["month", "ASC"]
    ]
  });

  let carryBalance = null;

  for (const currentMonth of months) {
    if (carryBalance === null) {
      const previousCoordinates = getPreviousMonthCoordinates(currentMonth.year, currentMonth.month);
      const previousMonth = await FinancialMonth.findOne({
        where: {
          userId,
          year: previousCoordinates.year,
          month: previousCoordinates.month
        },
        include: [{ model: Transaction, as: "transactions" }]
      });

      carryBalance = previousMonth
        ? calculateMonthTotals(previousMonth.transactions, previousMonth.openingBalance).closingBalance
        : 0;
    }

    currentMonth.openingBalance = carryBalance;
    await currentMonth.save();

    const totals = calculateMonthTotals(currentMonth.transactions, currentMonth.openingBalance);
    carryBalance = totals.closingBalance;
  }
};

export const serializeMonth = (month) => {
  const totals = calculateMonthTotals(month.transactions || [], month.openingBalance);

  return {
    id: month.id,
    year: month.year,
    month: month.month,
    isEditable: isMonthEditable(month.year, month.month),
    openingBalance: Number(month.openingBalance),
    municipality: month.municipality,
    deposits: totals.deposits,
    credits: totals.credits,
    debits: totals.debits,
    closingBalance: totals.closingBalance,
    balanceStatus:
      totals.closingBalance > 0
        ? "voce_deve_empresa"
        : totals.closingBalance < 0
          ? "empresa_deve_voce"
          : "quitado",
    notes: month.notes,
    transactions: (month.transactions || []).map((transaction) => ({
      id: transaction.id,
      purchaseDate: transaction.purchaseDate,
      description: transaction.description,
      invoiceNumber: transaction.invoiceNumber,
      category: transaction.category,
      type: transaction.type,
      amount: Number(transaction.amount),
      receiptUrl: transaction.receiptUrl
        ? transaction.receiptUrl.startsWith("/uploads")
          ? `${process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 3333}`}${transaction.receiptUrl}`
          : transaction.receiptUrl
        : null
    }))
  };
};
