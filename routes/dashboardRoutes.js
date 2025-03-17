const express = require("express");
const router = express.Router();
const checkPermissions = require("../middleware/checkPermissions");
const projectController = require("../controllers/projectController");
const bugController = require("../controllers/bugController");
const Project = require("../models/project");

// Middleware to check if user is assigned to any projects
const checkProjectAssignment = (roleType) => async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const userId = req.session.user.id; // Use user _id from session
    let projects;

    if (roleType === "qa") {
      projects = await Project.find({ qaIds: userId });
    } else if (roleType === "developer") {
      projects = await Project.find({ developerIds: userId });
    }

    if (!projects || projects.length === 0) {
      return res.status(403).json({
        error:
          "Access denied: You are not assigned to any projects. Please contact the Manager.",
      });
    }

    req.assignedProjects = projects;
    next();
  } catch (error) {
    console.error("Error checking project assignment:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};


// New manager dashboard route
router.get(
  "/manager-dashboard",
  checkPermissions(["view_all_projects"]),
  projectController.getManagerDashboard
);



// New routes for update and delete
router.put(
  "/projects",
  checkPermissions(["edit_project"]),
  projectController.updateProject
);

router.delete(
  "/projects/:projectId",
  checkPermissions(["delete_project"]),
  projectController.deleteProject
);

router.get(
  "/developer-dashboard",
  checkPermissions("view_assigned_bugs"),
  checkProjectAssignment("developer"),
  bugController.getDevBugs
);


router.get(
  "/qa-dashboard",
  checkPermissions("view_assigned_projects"),
  checkProjectAssignment("qa"),
  bugController.getQABugs
);

module.exports = router;
