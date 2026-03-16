import { Op } from "sequelize";
import { FinancialMonth, Transaction } from "../models/index.js";
import { deleteReceipt } from "./uploadService.js";

const CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000;
const lastCleanupAtByUser = new Map();

const getReceiptRetentionCutoff = () => {
  const cutoff = new Date();
  cutoff.setDate(1);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setMonth(cutoff.getMonth() - 2);

  return cutoff.toISOString().slice(0, 10);
};

export const cleanupExpiredReceiptsForUser = async (userId) => {
  const now = Date.now();
  const lastCleanupAt = lastCleanupAtByUser.get(userId) || 0;

  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanupAtByUser.set(userId, now);

  const expiredTransactions = await Transaction.findAll({
    where: {
      receiptUrl: {
        [Op.ne]: null
      },
      purchaseDate: {
        [Op.lt]: getReceiptRetentionCutoff()
      }
    },
    include: [
      {
        model: FinancialMonth,
        as: "financialMonth",
        where: { userId },
        attributes: ["id"]
      }
    ]
  });

  for (const transaction of expiredTransactions) {
    await deleteReceipt({
      receiptUrl: transaction.receiptUrl,
      receiptPublicId: transaction.receiptPublicId
    });

    transaction.receiptUrl = null;
    transaction.receiptPublicId = null;
    await transaction.save();
  }
};
