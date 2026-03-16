import { DataTypes, Model } from "sequelize";

export class RecipientEmail extends Model {}

export const initRecipientEmailModel = (sequelize) => {
  RecipientEmail.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      }
    },
    {
      sequelize,
      modelName: "RecipientEmail",
      tableName: "recipient_emails",
      indexes: [
        {
          unique: true,
          fields: ["userId", "email"]
        }
      ]
    }
  );

  return RecipientEmail;
};
