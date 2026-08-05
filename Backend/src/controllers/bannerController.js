import bannerService from "../services/bannerService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(bannerService, "Banner");
