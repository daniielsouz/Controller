import jwt from "jsonwebtoken";

export const signToken = (user, rememberMe = false) =>
  jwt.sign(
    { sub: user.id, email: user.email, rememberMe },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? "30d" : "1d"
    }
  );

export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
