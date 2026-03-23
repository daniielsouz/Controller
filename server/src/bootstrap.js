import { sequelize } from "./models/index.js";
import { logError, logInfo } from "./utils/logger.js";

let bootstrapPromise;

export const ensureBootstrap = async () => {
  if (!bootstrapPromise) {
    const shouldSyncSchema = String(process.env.ALLOW_SCHEMA_SYNC || "false").toLowerCase() === "true";

    const mode = shouldSyncSchema ? "sync" : "authenticate";
    logInfo("bootstrap", "Inicializando banco de dados.", {
      mode,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    const bootstrapWork = shouldSyncSchema ? sequelize.sync({ alter: true }) : sequelize.authenticate();

    bootstrapPromise = bootstrapWork.catch((error) => {
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
