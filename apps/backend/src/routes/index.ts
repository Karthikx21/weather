import { Router } from "express";
import healthRouter from "./health";
import weatherRouter from "./weather";
import airQualityRouter from "./air-quality";
import geocodingRouter from "./geocoding";
import citiesRouter from "./cities";
import mlRouter from "./ml";
import assistantRouter from "./assistant";
import analyticsRouter from "./analytics";

const router = Router();

router.use(healthRouter);
router.use(weatherRouter);
router.use(airQualityRouter);
router.use(geocodingRouter);
router.use(citiesRouter);
router.use(mlRouter);
router.use(assistantRouter);
router.use(analyticsRouter);

export default router;
