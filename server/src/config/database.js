import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql2 from "mysql2";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const useSsl =
  String(process.env.DB_SSL || "").toLowerCase() === "true" ||
  String(process.env.DB_SSL || "").toLowerCase() === "required";

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    dialectModule: mysql2,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined,
    logging: false
  }
);
