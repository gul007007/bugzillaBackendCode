const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const bugController = require("../controllers/bugController");
const restrictToRole = require("../middleware/restrictToRole");

router.post("/", restrictToRole("Manager"), projectController.createProject);
router.put("/", restrictToRole("Manager"), projectController.updateProject);
router.get("/:projectId/bugs", restrictToRole("Manager"), projectController.getProjectBugs);
router.get("/", restrictToRole("Manager"), projectController.listProjects);
router.get("/qa", restrictToRole("QA"), projectController.listQAProjects);
router.get("/:projectId/developers", restrictToRole("QA"), projectController.getProjectDevelopers); // Already correct, but confirm

module.exports = router;