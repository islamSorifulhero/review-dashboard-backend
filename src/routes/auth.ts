import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/token";
import { loginSchema, signupSchema } from "../lib/validators";
import { authLimiter } from "../middleware/rateLimit";
import { authenticate } from "../middleware/auth";

const router = Router();
const publicUser = { id: true, name: true, email: true, role: true } as const;
// compared against when the email doesn't exist, so response time doesn't reveal which emails are registered
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);

router.post("/signup", authLimiter, async (req, res) => {
  const data = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  // role is NEVER read from the request body -> nobody can sign up as a mentor
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: "STUDENT" },
    select: publicUser,
  });
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const found = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !ok) throw new AppError(401, "Invalid email or password");
  const user = { id: found.id, name: found.name, email: found.email, role: found.role };
  setAuthCookie(res, signToken(user));
  res.json({ user });
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: publicUser });
  if (!user) throw new AppError(401, "Account no longer exists");
  res.json({ user });
});

export default router;
