import { sequelize } from "../config/database.js";
import { initFinancialMonthModel, FinancialMonth } from "./financialMonth.js";
import { initRecipientEmailModel, RecipientEmail } from "./recipientEmail.js";
import { initTransactionModel, Transaction } from "./transaction.js";
import { initUserModel, User } from "./user.js";

initUserModel(sequelize);
initFinancialMonthModel(sequelize);
initTransactionModel(sequelize);
initRecipientEmailModel(sequelize);

User.hasMany(FinancialMonth, {
  foreignKey: "userId",
  as: "months"
});
User.hasMany(RecipientEmail, {
  foreignKey: "userId",
  as: "recipientEmails"
});
FinancialMonth.belongsTo(User, {
  foreignKey: "userId",
  as: "user"
});
RecipientEmail.belongsTo(User, {
  foreignKey: "userId",
  as: "user"
});

FinancialMonth.hasMany(Transaction, {
  foreignKey: "financialMonthId",
  as: "transactions",
  onDelete: "CASCADE"
});
Transaction.belongsTo(FinancialMonth, {
  foreignKey: "financialMonthId",
  as: "financialMonth"
});

export { sequelize, User, FinancialMonth, Transaction, RecipientEmail };
