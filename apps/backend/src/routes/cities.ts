import { Router, type IRouter } from "express";
import { CitiesController } from "../controllers/cities.controller.js";

const router: IRouter = Router();

router.get("/cities/favorites", CitiesController.getFavorites);
router.post("/cities/favorites", CitiesController.addFavorite);
router.delete("/cities/favorites/:id", CitiesController.removeFavorite);

router.get("/cities/search-history", CitiesController.getSearchHistory);
router.post("/cities/search-history", CitiesController.addSearchHistory);
router.delete("/cities/search-history", CitiesController.clearSearchHistory);

export default router;
