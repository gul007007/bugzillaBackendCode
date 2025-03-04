const express = require("express");
const router = express.Router();
const restrictToRole = require("../middleware/restrictToRole");
const Project = require("../models/project");

router.get("/manager-dashboard", restrictToRole("Manager"), (req, res) => {
  res.json({ message: "Welcome to Manager Dashboard" });
});

router.get("/developer-dashboard", restrictToRole("Developer"), async (req, res) => {
  try {
    const projects = await Project.find({ developerIds: req.session.user.id });
    if (!projects.length) {
      return res.json({ message: "No projects assigned" });
    }
    res.json({ projects: projects.map((p) => ({ name: p.name, _id: p._id })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/qa-dashboard", restrictToRole("QA"), async (req, res) => {
  try {
    const projects = await Project.find({ qaIds: req.session.user.id });
    if (!projects.length) {
      return res.json({ message: "No projects assigned" });
    }
    res.json({ projects: projects.map((p) => ({ name: p.name, _id: p._id })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;