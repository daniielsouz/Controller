import { sequelize } from "./models/index.js";

let bootstrapPromise;

export const ensureBootstrap = async () => {
  if (!bootstrapPromise) {
    const shouldSyncSchema =
      process.env.NODE_ENV !== "production" && !process.env.VERCEL;

    bootstrapPromise = shouldSyncSchema ? sequelize.sync({ alter: true }) : sequelize.authenticate();
  }

  return bootstrapPromise;
};
