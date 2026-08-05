import TeamMember from "../models/TeamMember.js";
import { createCollectionService } from "./contentCollectionFactory.js";

export default createCollectionService(TeamMember, {
  searchableFields: ["name"],
});
