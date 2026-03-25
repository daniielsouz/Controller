import { ValidationError } from "sequelize";
import { User } from "../models/index.js";
import { signToken } from "../utils/jwt.js";

const authResponse = (user, rememberMe = false) => ({
  token: signToken(user, rememberMe),
  rememberMe,
  user: {
    id: user.id,
    name: user.name,
    email: user.email
  }
});

const isValidEmail = (value = "") => {
  const email = String(value).trim();
  const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicPattern.test(email)) return false;

  const [, domainFull = ""] = email.split("@");
  const parts = domainFull.split(".");
  if (parts.length < 2) return false;
  const mainLabel = parts[parts.length - 2];

  // Exige pelo menos uma letra no label principal do domínio (evita algo como 123456.com)
  return /[a-zA-Z]/.test(mainLabel);
};

const isValidName = (value = "") => {
  const name = String(value).trim();
  if (!name) return false;
  // Proíbe dígitos
  return !/[0-9]/.test(name);
};

export const register = async (req, res) => {
  const { name, email, password, rememberMe } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({ message: "Nome inválido. Não use números." });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "E-mail inválido. Use um endereço real, por exemplo nome@empresa.com." });
  }

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ message: "E-mail já cadastrado." });
  }

  try {
    const user = await User.create({
      name,
      email,
      passwordHash: password
    });

    return res.status(201).json(authResponse(user, Boolean(rememberMe)));
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: "Informe um e-mail válido." });
    }
    return res
      .status(500)
      .json({ message: "Não foi possível concluir o cadastro.", detail: error?.message });
  }
};

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  return res.json(authResponse(user, Boolean(rememberMe)));
};

export const me = async (req, res) => res.json(authResponse(req.user, Boolean(req.auth?.rememberMe)));

export const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const user = req.user;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: "Nome e e-mail são obrigatórios." });
  }

  if (!isValidName(name)) {
    return res.status(400).json({ message: "Nome inválido. Não use números." });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "E-mail inválido. Use um endereço real, por exemplo nome@empresa.com." });
  }

  if (email.trim() !== user.email) {
    const existingUser = await User.findOne({ where: { email: email.trim() } });

    if (existingUser) {
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }
  }

  user.name = name.trim();
  user.email = email.trim();

  if (password) {
    user.passwordHash = password;
  }

  try {
    await user.save();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: "Informe um e-mail válido." });
    }
    return res.status(500).json({
      message: "Não foi possível atualizar o perfil.",
      detail: error?.message
    });
  }

  return res.json(authResponse(user, Boolean(req.auth?.rememberMe)));
};
