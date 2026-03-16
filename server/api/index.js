import { app } from "../src/app.js";
import { ensureBootstrap } from "../src/bootstrap.js";

export default async function handler(req, res) {
  try {
    await ensureBootstrap();
    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Erro ao iniciar a API."
    });
  }
}
