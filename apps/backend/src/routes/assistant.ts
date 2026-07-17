import { Router, type IRouter } from "express";
import { AssistantController } from "../controllers/assistant.controller.js";

const router: IRouter = Router();

router.post("/assistant/query", AssistantController.queryAssistant);

export default router;
