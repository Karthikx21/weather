import { Router, type IRouter } from "express";
import { MlController } from "../controllers/ml.controller.js";

const router: IRouter = Router();

router.get("/ml/predictions", MlController.getPredictions);
router.get("/ml/models", MlController.getModels);
router.post("/ml/train", MlController.trainModels);

export default router;
