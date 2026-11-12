import successStoryService from "../services/successStoryService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(successStoryService, "Success story");
