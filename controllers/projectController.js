const Project = require("../models/project");
const User = require("../models/user");
const Role = require("../models/role");
const Bug = require("../models/bug");

exports.createProject = async (req, res) => {
  const { name, developerEmails, qaEmails } = req.body;
  const managerId = req.session.user.id;

  try {
    // Find the role IDs for Developer and QA
    const developerRole = await Role.findOne({ name: "Developer" });
    const qaRole = await Role.findOne({ name: "QA" });

    if (!developerRole || !qaRole) {
      return res.status(500).json({ error: "Role definitions not found" });
    }

    // Find developers and QA users by email and their respective roles
    const developers = developerEmails
      ? await User.find({
          email: { $in: developerEmails },
          role: developerRole._id,
        })
      : [];
    const qas = qaEmails
      ? await User.find({ email: { $in: qaEmails }, role: qaRole._id })
      : [];

    // Validate that all provided emails exist and have the correct roles
    if (developerEmails && developerEmails.length !== developers.length) {
      return res
        .status(400)
        .json({ error: "Some developer emails not found or invalid role" });
    }
    if (qaEmails && qaEmails.length !== qas.length) {
      return res
        .status(400)
        .json({ error: "Some QA emails not found or invalid role" });
    }

    const project = new Project({
      name,
      managerId,
      developerIds: developers.map((dev) => dev._id),
      qaIds: qas.map((qa) => qa._id),
    });
    await project.save();
    res
      .status(201)
      .json({ message: "Project created", projectId: project._id });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const role = req.session.user.role;
    if (!role.permissions.includes("edit_project")) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient permissions" });
    }

    const { projectId, name, developerEmails, qaEmails } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Update project fields
    project.name = name || project.name;

    // Resolve developer emails to user IDs
    if (developerEmails && developerEmails.length > 0) {
      const developers = await User.find({ email: { $in: developerEmails } });
      if (developers.length !== developerEmails.length) {
        return res
          .status(400)
          .json({ error: "One or more developer emails not found" });
      }
      project.developerIds = developers.map((user) => user._id);
    }

    // Resolve QA emails to user IDs
    if (qaEmails && qaEmails.length > 0) {
      const qas = await User.find({ email: { $in: qaEmails } });
      if (qas.length !== qaEmails.length) {
        return res
          .status(400)
          .json({ error: "One or more QA emails not found" });
      }
      project.qaIds = qas.map((user) => user._id);
    }

    await project.save();

    res.status(200).json({ message: "Project updated successfully!" });
  } catch (error) {
    console.error("Project update error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.getProjectBugs = async (req, res) => {
  const { projectId } = req.params;
  const managerId = req.session.user.id;

  try {
    const project = await Project.findOne({ _id: projectId, managerId });
    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or not owned by you" });
    }

    const bugs = await Bug.find({ projectId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    res.status(200).json({ bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listProjects = async (req, res) => {
  const managerId = req.session.user.id;

  try {
    const projects = await Project.find({ managerId })
      .select("name _id")
      .populate("developerIds", "name email")
      .populate("qaIds", "name email");
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listQAProjects = async (req, res) => {
  const qaId = req.session.user.id;

  try {
    const projects = await Project.find({ qaIds: qaId }).select("name _id");
    if (!projects.length) {
      return res
        .status(200)
        .json({ projects: [], message: "No projects assigned" });
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

exports.getProjectDevelopers = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const project = await Project.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if the user is authorized (Manager or QA assigned to the project)
    if (userRole === "Manager" && project.managerId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this project's developers" });
    } else if (userRole === "QA" && !project.qaIds.includes(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this project's developers" });
    }

    const developers = await User.find({
      _id: { $in: project.developerIds },
    }).select("name email _id");
    res.status(200).json({ developers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const role = req.session.user.role;
    if (!role.permissions.includes("view_all_projects")) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient permissions" });
    }

    const projects = await Project.find()
      .populate("developerIds", "name email")
      .populate("qaIds", "name email")
      .populate("managerId", "name email");

    if (!projects.length) {
      return res.status(200).json({ message: "No projects yet", projects: [] });
    }

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.getQAProjects = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const projects = await Project.find({ qaIds: req.session.user.id })
      .populate("developerIds", "name email")
      .populate("qaIds", "name email");
    if (!projects.length) {
      return res
        .status(200)
        .json({ message: "No projects assigned yet", projects: [] });
    }

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Get QA projects error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const role = req.session.user.role;
    if (!role.permissions.includes("delete_project")) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient permissions" });
    }

    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Cascade delete associated bugs
    await Bug.deleteMany({ projectId: projectId });

    await Project.findByIdAndDelete(projectId);

    res
      .status(200)
      .json({ message: "Project and associated bugs deleted successfully!" });
  } catch (error) {
    console.error("Project delete error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.filterProjects = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const role = req.session.user.role;
    if (!role.permissions.includes("filter_projects")) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient permissions" });
    }

    const { name, developerEmail, qaEmail, bugCount } = req.query;
    let query = {};
    let aggregationPipeline = [];

    // Filter by project name (case-insensitive)
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Start with the base match
    aggregationPipeline.push({ $match: query });

    // Lookup developer and QA user details
    aggregationPipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "developerIds",
          foreignField: "_id",
          as: "developers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "qaIds",
          foreignField: "_id",
          as: "qas",
        },
      }
    );

    // Filter by developer email
    if (developerEmail) {
      aggregationPipeline.push({
        $match: {
          developers: {
            $elemMatch: { email: { $regex: developerEmail, $options: "i" } },
          },
        },
      });
    }

    // Filter by QA email
    if (qaEmail) {
      aggregationPipeline.push({
        $match: {
          qas: { $elemMatch: { email: { $regex: qaEmail, $options: "i" } } },
        },
      });
    }

    // Lookup bugs and count them per project
    aggregationPipeline.push(
      {
        $lookup: {
          from: "bugs",
          localField: "_id",
          foreignField: "projectId",
          as: "bugs",
        },
      },
      {
        $addFields: {
          bugCount: { $size: "$bugs" },
        },
      }
    );

    // Filter by bug count (e.g., >, <, =)
    if (bugCount) {
      const [operator, value] = bugCount.split("_"); // e.g., "gt_5" or "lt_10"
      const numValue = parseInt(value, 10);
      if (operator === "gt") {
        aggregationPipeline.push({ $match: { bugCount: { $gt: numValue } } });
      } else if (operator === "lt") {
        aggregationPipeline.push({ $match: { bugCount: { $lt: numValue } } });
      } else if (operator === "eq") {
        aggregationPipeline.push({ $match: { bugCount: numValue } });
      } else {
        return res.status(400).json({ error: "Invalid bug count operator" });
      }
    }

    // Project the final fields
    aggregationPipeline.push({
      $project: {
        name: 1,
        developerIds: 1,
        qaIds: 1,
        managerId: 1,
        bugCount: 1,
        developers: { name: 1, email: 1 },
        qas: { name: 1, email: 1 },
      },
    });

    const projects = await Project.aggregate(aggregationPipeline);

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Filter projects error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.getManagerDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const role = req.session.user.role;
    if (!role.permissions.includes("view_all_projects")) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient permissions" });
    }

    // Changed req.session.user._id to req.session.user.id
    const projects = await Project.find({ managerId: req.session.user.id });

    const message = projects.length
      ? `Welcome, ${req.session.user.name}! You have ${projects.length} projects.`
      : `Welcome, ${req.session.user.name}! You currently have no projects.`;

    res.status(200).json({ message });
  } catch (error) {
    console.error("Manager dashboard error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

module.exports = exports;
