import { DataTypes, Model } from "sequelize";

export class Transaction extends Model {}

export const initTransactionModel = (sequelize) => {
  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      purchaseDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM("depositos", "veiculos", "outras-despesas"),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM("deposito", "credito", "debito"),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      receiptUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      receiptPublicId: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions"
    }
  );

  return Transaction;
};
