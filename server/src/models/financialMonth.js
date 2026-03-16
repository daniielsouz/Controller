import { DataTypes, Model } from "sequelize";

export class FinancialMonth extends Model {}

export const initFinancialMonthModel = (sequelize) => {
  FinancialMonth.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12
        }
      },
      openingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      municipality: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Chapeco"
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "FinancialMonth",
      tableName: "financial_months",
      indexes: [
        {
          unique: true,
          fields: ["userId", "year", "month"]
        }
      ]
    }
  );

  return FinancialMonth;
};
