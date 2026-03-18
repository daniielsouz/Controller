import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { app } from "./app.js";
import { ensureBootstrap } from "./bootstrap.js";
import { logError, logInfo } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const port = Number(process.env.PORT || 3333);

const bootstrap = async () => {
  await ensureBootstrap();
  app.listen(port, () => {
    logInfo("server", "API rodando.", { port });
  });
};

bootstrap().catch((error) => {
  logError("server", "Erro ao iniciar servidor.", error, { port });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logError("process", "Promessa rejeitada sem tratamento.", reason, { port });
});

process.on("uncaughtException", (error) => {
  logError("process", "Excecao nao tratada.", error, { port });
  process.exit(1);
});
