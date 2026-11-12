import Faq from "../models/Faq.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(Faq, {
  searchableFields: ["category"],
});
