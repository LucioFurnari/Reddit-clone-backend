import Jwt  from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "octavia1fayqr*15176af1414"

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

export function verifyToken(token: string): TokenPayload {
  try {
    return Jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};