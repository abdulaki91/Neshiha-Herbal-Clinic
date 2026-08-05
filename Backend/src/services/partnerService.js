import Partner from "../models/Partner.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(Partner, {
  searchableFields: ["name"],
});
