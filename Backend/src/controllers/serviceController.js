import serviceService from "../services/serviceService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(serviceService, "Service");
