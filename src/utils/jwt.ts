import Jwt  from "jsonwebtoken";

// Add dotenv
const SECRET_KEY = process.env.SECRET_KEY || "faftwgt4d8b1qr4qgwgs"

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