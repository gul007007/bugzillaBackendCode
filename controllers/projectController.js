const Project = require("../models/project");
const User = require("../models/user");
const Bug = require("../models/bug");

exports.createProject = async (req, res) => {
  const { name, developerEmails, qaEmails } = req.body;
  const managerId = req.session.user.id;

  try {
    const developers = await User.find({ email: { $in: developerEmails }, role: "Developer" });
    const qas = await User.find({ email: { $in: qaEmails }, role: "QA" });

    if (developers.length !== developerEmails.length || qas.length !== qaEmails.length) {
      return res.status(400).json({ error: "Some users not found or invalid roles" });
    }

    const project = new Project({
      name,
      managerId,
      developerIds: developers.map((dev) => dev._id),
      qaIds: qas.map((qa) => qa._id),
    });
    await project.save();
    res.status(201).json({ message: "Project created", projectId: project._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  const { projectId, developerEmails, qaEmails } = req.body;
  const managerId = req.session.user.id;

  try {
    const project = await Project.findOne({ _id: projectId, managerId });
    if (!project) {
      return res.status(404).json({ error: "Project not found or not owned by you" });
    }

    const developers = await User.find({ email: { $in: developerEmails }, role: "Developer" });
    const qas = await User.find({ email: { $in: qaEmails }, role: "QA" });

    if (developers.length !== developerEmails.length || qas.length !== qaEmails.length) {
      return res.status(400).json({ error: "Some users not found or invalid roles" });
    }

    project.developerIds = developers.map((dev) => dev._id);
    project.qaIds = qas.map((qa) => qa._id);
    await project.save();
    res.status(200).json({ message: "Project updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectBugs = async (req, res) => {
  const { projectId } = req.params;
  const managerId = req.session.user.id;

  try {
    const project = await Project.findOne({ _id: projectId, managerId });
    if (!project) {
      return res.status(404).json({ error: "Project not found or not owned by you" });
    }

    const bugs = await Bug.find({ projectId }).populate("assignedTo", "name email").populate("createdBy", "name email");
    res.status(200).json({ bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listProjects = async (req, res) => {
  const managerId = req.session.user.id;

  try {
    const projects = await Project.find({ managerId }).select("name _id");
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add to projectController.js
exports.listQAProjects = async (req, res) => {
  const qaId = req.session.user.id;

  try {
    const projects = await Project.find({ qaIds: qaId }).select("name _id");
    if (!projects.length) {
      return res.status(200).json({ projects: [], message: "No projects assigned" });
    }

    // Generate an ETag based on the data (simplified for demo)
    const etag = require("etag")(JSON.stringify(projects));
    res.set("ETag", etag);

    // Check if the client has a valid cached version
    if (req.get("if-none-match") === etag) {
      return res.status(304).end(); // No changes, return 304
    }

    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add to projectController.js
exports.getProjectDevelopers = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.session.user.id; // Use the user's ID for both Managers and QAs
  const userRole = req.session.user.role;

  try {
    const project = await Project.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if the user is authorized (Manager or QA assigned to the project)
    if (userRole === "Manager" && project.managerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to view this project's developers" });
    } else if (userRole === "QA" && !project.qaIds.includes(userId)) {
      return res.status(403).json({ error: "Not authorized to view this project's developers" });
    }

    const developers = await User.find({ _id: { $in: project.developerIds } }).select("name email _id");
    res.status(200).json({ developers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};