import teamMemberService from "../services/teamMemberService.js";
import { createCollectionController } from "./contentCollectionController.js";

export default createCollectionController(teamMemberService, "Team member");
