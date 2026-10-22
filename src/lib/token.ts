import jwt, { SignOptions } from "jsonwebtoken";
import { Response } from "express";
import { config, isProd } from "../config";

export type TokenPayload = { sub: string; role: "STUDENT" | "MENTOR" };

export const signToken = (user: { id: string; role: "STUDENT" | "MENTOR" }) =>
  jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

export const verifyToken = (token: string) => jwt.verify(token, config.JWT_SECRET) as unknown as TokenPayload;

const cookieOptions = {
  httpOnly: true, // JS in the browser can't read it -> XSS can't steal it
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
};

export const setAuthCookie = (res: Response, token: string) =>
  res.cookie("token", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

export const clearAuthCookie = (res: Response) => res.clearCookie("token", cookieOptions);
