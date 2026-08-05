import faqService from "../services/faqService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(faqService, "FAQ");
