import crypto from "crypto";
import { Op } from "sequelize";
import { mailer } from "../config/mailer.js";
import { PasswordResetToken, User } from "../models/index.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const TOKEN_TTL_MS = 30 * 60 * 1000;
const CLIENT_URL = process.env.CLIENT_APP_URL || "http://localhost:5173";
const FROM_EMAIL =
  process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || "no-reply@controller-financeiro.local";

const buildResetLink = (token) => `${CLIENT_URL}/reset-senha?token=${token}`;

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ message: "O e-mail e obrigatorio." });
  }

  const user = await User.findOne({ where: { email: email.trim() } });

  if (!user) {
    // Não revelamos se o e-mail existe para não facilitar ataques.
    return res.json({ message: "Se enviou um e-mail com instrucoes para redefinir sua senha." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await PasswordResetToken.destroy({
    where: { userId: user.id }
  });

  await PasswordResetToken.create({
    userId: user.id,
    tokenHash,
    expiresAt
  });

  const resetLink = buildResetLink(token);

  try {
    await mailer.sendMail({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Controle Financeiro - redefina sua senha",
      text: `Use este codigo para redefinir sua senha (valido por 30 minutos): ${token}\n\n` +
        `Você também pode clicar no link abaixo para abrir diretamente a pagina de redefinição:\n${resetLink}`
    });
  } catch (error) {
    console.error("Falha ao enviar e-mail de redefinicao de senha:", error);
  }

  return res.json({ message: "Se enviou um e-mail com instrucoes para redefinir sua senha." });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Codigo e senha sao obrigatorios." });
  }

  const tokenHash = hashToken(token);
  const tokenRecord = await PasswordResetToken.findOne({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  if (!tokenRecord) {
    return res.status(400).json({ message: "Codigo invalido ou expirado." });
  }

  const user = await User.findByPk(tokenRecord.userId);

  if (!user) {
    return res.status(400).json({ message: "Usuario associadoo ao codigo nao encontrado." });
  }

  user.passwordHash = password;
  await user.save();

  tokenRecord.revokedAt = new Date();
  await tokenRecord.save();

  return res.json({ message: "Senha redefinida com sucesso." });
};
