import { sequelize } from "./models/index.js";

let bootstrapPromise;

export const ensureBootstrap = async () => {
  if (!bootstrapPromise) {
    bootstrapPromise = sequelize.sync({ alter: true });
  }

  return bootstrapPromise;
};
