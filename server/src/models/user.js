import bcrypt from "bcryptjs";
import { DataTypes, Model } from "sequelize";

export class User extends Model {
  async comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }
}

export const initUserModel = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      hooks: {
        async beforeCreate(user) {
          if (user.passwordHash) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
          }
        },
        async beforeUpdate(user) {
          if (user.changed("passwordHash")) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
          }
        }
      }
    }
  );

  return User;
};
