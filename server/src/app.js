import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sequelize } from "./models/index.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim())
  .filter(Boolean);

const allowedHostnames = allowedOrigins
  .map((origin) => {
    try {
      return new URL(origin).hostname;
    } catch (_error) {
      return "";
    }
  })
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.length === 0) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);

    if (allowedHostnames.includes(hostname)) {
      return true;
    }

    return (
      hostname.endsWith(".vercel.app") &&
      allowedHostnames.some(
        (allowedHostname) =>
          allowedHostname.endsWith(".vercel.app") &&
          hostname.startsWith(allowedHostname.split(".vercel.app")[0])
      )
    );
  } catch (_error) {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/", (_req, res) =>
  res.json({
    ok: true,
    service: "controller-server",
    health: "/health",
    api: "/api"
  })
);

app.get(["/favicon.ico", "/favicon.png"], (_req, res) => res.status(204).end());

app.use("/api", routes);

app.get("/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.use((error, _req, res, _next) =>
  res.status(500).json({
    message: error.message || "Erro interno do servidor."
  })
);

export { app };
export default app;
