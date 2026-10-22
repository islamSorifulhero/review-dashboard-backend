import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { verifyToken } from "../lib/token";

// AuthN: "who are you?" -> verify the signed JWT
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = req.cookies?.token ?? (header?.startsWith("Bearer ") ? header.slice(7) : undefined);
  if (!token) throw new AppError(401, "Authentication required");
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw new AppError(401, "Invalid or expired session");
  }
  next();
}

// AuthZ: "are you allowed to do this?" -> check the role
export const requireRole =
  (...roles: Array<"STUDENT" | "MENTOR">) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new AppError(403, "You do not have permission to do this");
    next();
  };
