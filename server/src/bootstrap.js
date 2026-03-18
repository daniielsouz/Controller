import { sequelize } from "./models/index.js";
import { logError, logInfo } from "./utils/logger.js";

let bootstrapPromise;

export const ensureBootstrap = async () => {
  if (!bootstrapPromise) {
    const shouldSyncSchema =
      process.env.NODE_ENV !== "production" && !process.env.VERCEL;

    const mode = shouldSyncSchema ? "sync" : "authenticate";
    logInfo("bootstrap", "Inicializando banco de dados.", {
      mode,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    bootstrapPromise = (shouldSyncSchema
      ? sequelize.sync({ alter: true })
      : sequelize.authenticate()
    ).catch((error) => {
      bootstrapPromise = undefined;
      logError("bootstrap", "Falha ao inicializar banco de dados.", error, {
        mode,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
      });
      throw error;
    });
  }

  return bootstrapPromise;
};
