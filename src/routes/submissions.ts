import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { authenticate, requireRole } from "../middleware/auth";
import { submissionLimiter } from "../middleware/rateLimit";
import { listQuerySchema, reviewSchema, submissionSchema } from "../lib/validators";

const router = Router();
router.use(authenticate);

// ---------- Student ----------
router.post("/", requireRole("STUDENT"), submissionLimiter, async (req, res) => {
  const data = submissionSchema.parse(req.body);
  // duplicate repoUrl -> DB unique constraint throws P2002 -> error handler returns 409
  // (a DB constraint is race-condition safe; a "check then insert" is not)
  const submission = await prisma.submission.create({
    data: { ...data, studentId: req.user!.id },
  });
  res.status(201).json({ submission });
});

router.get("/mine", requireRole("STUDENT"), async (req, res) => {
  const items = await prisma.submission.findMany({
    where: { studentId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items });
});

// ---------- Mentor ----------
router.get("/stats", requireRole("MENTOR"), async (_req, res) => {
  const grouped = await prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
  const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const g of grouped) {
    stats[g.status.toLowerCase() as "pending" | "approved" | "rejected"] = g._count._all;
    stats.total += g._count._all;
  }
  res.json(stats);
});

router.get("/", requireRole("MENTOR"), async (req, res) => {
  const { status, page, limit } = listQuerySchema.parse(req.query);
  const where = status ? { status } : {};
  // filtering + pagination happen in the database (server side)
  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { student: { select: { id: true, name: true, email: true } } },
    }),
    prisma.submission.count({ where }),
  ]);
  res.json({ items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

router.patch("/:id/status", requireRole("MENTOR"), async (req, res) => {
  const { status, feedback } = reviewSchema.parse(req.body);
  const id = String(req.params.id);
  // atomic: only a PENDING submission can be reviewed, so two mentors can't overwrite each other
  const result = await prisma.submission.updateMany({
    where: { id, status: "PENDING" },
    data: { status, feedback, reviewedById: req.user!.id, reviewedAt: new Date() },
  });
  if (result.count === 0) {
    const exists = await prisma.submission.findUnique({ where: { id }, select: { id: true } });
    throw exists ? new AppError(409, "This submission has already been reviewed") : new AppError(404, "Submission not found");
  }
  res.json({ message: `Submission ${status.toLowerCase()}` });
});

export default router;
