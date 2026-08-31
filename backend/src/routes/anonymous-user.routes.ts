import { Router } from "express";
import { createAnonymousUser } from "../controllers/anonymous-user.controller";
import { anonymousUserLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// POST /api/users/anonymous
router.post("/anonymous", anonymousUserLimiter, createAnonymousUser);

export default router;
