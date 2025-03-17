const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const bugController = require("../controllers/bugController");
const checkPermissions = require("../middleware/checkPermissions");

router.post(
  "/",
  checkPermissions("create_project"),
  projectController.createProject
);

router.put("/", checkPermissions(["edit_project"]), projectController.updateProject);
// router.put(
//   "/",
//   checkPermissions(["assign_users", "edit_project"]),
//   projectController.updateProject
// );
router.get(
  "/:projectId/bugs",
  checkPermissions("view_bugs"),
  projectController.getProjectBugs
);
router.get(
  "/",
  checkPermissions("view_all_projects"),
  projectController.getProjects
);
router.get(
  "/qa",
  checkPermissions("view_assigned_projects"),
  projectController.getQAProjects
);
router.get(
  "/:projectId/developers",
  checkPermissions("view_assigned_projects"),
  projectController.getProjectDevelopers
);
router.delete(
  "/:projectId",
  checkPermissions("delete_project"),
  projectController.deleteProject
);

router.get(
  "/filter",
  checkPermissions(["filter_projects"]),
  projectController.filterProjects
);

module.exports = router;
