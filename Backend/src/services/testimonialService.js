import Testimonial from "../models/Testimonial.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(Testimonial, {
  searchableFields: ["clientName", "company"],
});
