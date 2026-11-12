import Service from "../models/Service.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(Service, {
  searchableFields: [],
});
