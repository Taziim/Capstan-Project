import { Router } from "express";
import { getChatConfiguration } from "../controllers/chat-config.controller";

const router = Router();

// GET /api/config/chat
router.get("/chat", getChatConfiguration);

export default router;
