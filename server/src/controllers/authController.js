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

export const register = async (req, res) => {
  const { name, email, password, rememberMe } = req.body;
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ message: "E-mail já cadastrado." });
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password
  });

  return res.status(201).json(authResponse(user, Boolean(rememberMe)));
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

export const me = async (req, res) =>
  res.json(authResponse(req.user, Boolean(req.auth?.rememberMe)));

export const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const user = req.user;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: "Nome e e-mail sÃ£o obrigatÃ³rios." });
  }

  if (email.trim() !== user.email) {
    const existingUser = await User.findOne({ where: { email: email.trim() } });

    if (existingUser) {
      return res.status(409).json({ message: "E-mail jÃ¡ cadastrado." });
    }
  }

  user.name = name.trim();
  user.email = email.trim();

  if (password) {
    user.passwordHash = password;
  }

  await user.save();

  return res.json(authResponse(user, Boolean(req.auth?.rememberMe)));
};
