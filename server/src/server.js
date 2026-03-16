import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { app } from "./app.js";
import { sequelize } from "./models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const port = Number(process.env.PORT || 3333);

const bootstrap = async () => {
  await sequelize.sync({ alter: true });
  app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Erro ao iniciar servidor:", error);
  process.exit(1);
});
