import { User } from "../models/index.js";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não informado." });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    const user = await User.findByPk(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token inválido." });
  }
};
