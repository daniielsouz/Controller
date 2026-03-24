import { DataTypes, Model } from "sequelize";

export class PasswordResetToken extends Model {}

export const initPasswordResetTokenModel = (sequelize) => {
  PasswordResetToken.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      tokenHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "PasswordResetToken",
      tableName: "password_reset_tokens",
      updatedAt: "revokedAt",
      createdAt: "createdAt"
    }
  );

  return PasswordResetToken;
};
