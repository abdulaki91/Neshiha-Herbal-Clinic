import Banner from "../models/Banner.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(Banner, {
  searchableFields: [],
});
