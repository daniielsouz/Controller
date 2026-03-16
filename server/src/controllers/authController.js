import { OAuth2Client } from "google-auth-library";
import { User } from "../models/index.js";
import { signToken } from "../utils/jwt.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

export const googleLogin = async (req, res) => {
  try {
    const { credential, rememberMe } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ where: { email: payload.email } });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    return res.json(authResponse(user, Boolean(rememberMe)));
  } catch (_error) {
    return res.status(401).json({ message: "Falha ao autenticar com Google." });
  }
};

export const me = async (req, res) =>
  res.json(authResponse(req.user, Boolean(req.auth?.rememberMe)));
