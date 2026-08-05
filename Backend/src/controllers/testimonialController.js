import testimonialService from "../services/testimonialService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(testimonialService, "Testimonial");
