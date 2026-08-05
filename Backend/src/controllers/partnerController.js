import partnerService from "../services/partnerService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(partnerService, "Partner");
