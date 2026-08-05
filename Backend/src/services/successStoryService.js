import SuccessStory from "../models/SuccessStory.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(SuccessStory, {
  searchableFields: ["category"],
});
