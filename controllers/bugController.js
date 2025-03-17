const Bug = require("../models/bug");
const Project = require("../models/project");
const User = require("../models/user");
const multer = require("multer");
const path = require("path");
const Role = require("../models/role");
const mongoose = require("mongoose");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /png|gif/;
  const mimetypes = /image\/png|image\/gif/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mimetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images must be PNG or GIF");
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter,
}).single("image");

exports.upload = upload; // Export the upload middleware

exports.createBug = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const { projectId } = req.params;
    const { title, description, deadline, type, assignedTo } = req.body;
    const image = req.file ? `${req.file.filename}` : null;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!project.qaIds.includes(req.session.user.id)) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this project" });
    }

    let assignedDeveloper = null;
    if (assignedTo) {
      const developerRole = await Role.findOne({ name: "Developer" });
      if (!developerRole) {
        return res.status(500).json({ error: "Developer role not found" });
      }
      const developer = await User.findOne({
        _id: assignedTo,
        role: developerRole._id,
      });
      if (!developer) {
        return res
          .status(400)
          .json({ error: "Assigned user is not a Developer" });
      }
      if (!project.developerIds.includes(assignedTo)) {
        return res
          .status(400)
          .json({ error: "Assigned Developer is not part of this project" });
      }
      assignedDeveloper = assignedTo;
    }

    const bug = new Bug({
      projectId,
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
      type,
      status: "new",
      createdBy: req.session.user.id,
      assignedTo: assignedDeveloper,
      image,
    });

    await bug.save();
    console.log("Bug created:", bug); // Log the saved bug
    res.status(201).json({ message: "Bug created successfully", bug });
  } catch (error) {
    console.error("Create bug error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.getQABugs = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    // Convert user ID to MongoDB ObjectId
    const userId = mongoose.Types.ObjectId.createFromHexString(
      req.session.user.id
    );
    console.log("Fetching QA bugs for user:", userId);

    // Aggregation pipeline to fetch QA bugs
    const bugs = await Bug.aggregate([
      // Match bugs created by the current user
      { $match: { createdBy: userId } },

      // Lookup project details
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      // Ensure the project exists
      { $match: { $expr: { $gt: [{ $size: "$project" }, 0] } } },

      // Lookup assignedTo user details
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // Lookup createdBy user details
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      // Add the project name to projectId object
      {
        $addFields: {
          "projectId.name": { $arrayElemAt: ["$project.name", 0] },
        },
      },

      // Exclude the full project array
      {
        $project: {
          project: 0,
        },
      },
    ]);

    console.log("QA bugs fetched:", bugs);

    // Return response
    if (!bugs.length) {
      return res.status(200).json({ message: "No bugs created yet", bugs: [] });
    }
    res.status(200).json({ bugs });
  } catch (error) {
    console.error("Get QA bugs error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.getDevBugs = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    // Use createFromHexString to avoid deprecation warning
    const userId = mongoose.Types.ObjectId.createFromHexString(
      req.session.user.id
    );
    console.log("Fetching Dev bugs for user:", userId);

    const bugs = await Bug.aggregate([
      { $match: { assignedTo: userId } },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $match: { $expr: { $gt: [{ $size: "$project" }, 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
      // Add the project name to projectId
      {
        $addFields: {
          "projectId.name": { $arrayElemAt: ["$project.name", 0] },
        },
      },
      // Exclude the full project array
      { $project: { project: 0 } },
    ]);

    console.log("Dev bugs fetched:", bugs);
    if (!bugs.length) {
      return res
        .status(200)
        .json({ message: "No bugs assigned yet", bugs: [] });
    }
    res.status(200).json({ bugs });
  } catch (error) {
    console.error("Get Developer bugs error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.updateBugStatus = async (req, res) => {
  console.log(
    `updateBugStatus called for bugId: ${
      req.params.bugId
    } at ${new Date().toISOString()}`
  );
  console.log("Request body:", req.body);

  try {
    const { bugId } = req.params;
    const { status } = req.body;

    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({ error: "Bug not found" });
    }

    // Check if the bug is locked and the user is a Developer
    if (bug.locked && req.session.user.role.name === "Developer") {
      return res
        .status(403)
        .json({ error: "Cannot update status of a locked bug" });
    }

    const userRole = req.session.user.role.name;
    const userPermissions = req.session.user.role.permissions;

    // Define valid status transitions
    const validTransitions = {
      new: ["started"],
      started: ["posted_to_qa"],
      posted_to_qa: ["done_from_qa"],
      done_from_qa: ["closed"],
    };

    // Check if the transition is valid
    const allowedNextStatuses = validTransitions[bug.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${
          bug.status
        } to ${status}. Only ${allowedNextStatuses.join(", ")} are allowed.`,
      });
    }

    // Check role-based permissions for status updates
    if (status === "started" && userRole !== "Developer") {
      return res
        .status(403)
        .json({ error: "Only Developers can set status to 'started'" });
    }
    if (status === "posted_to_qa" && userRole !== "Developer") {
      return res
        .status(403)
        .json({ error: "Only Developers can set status to 'posted_to_qa'" });
    }
    if (status === "done_from_qa" && userRole !== "QA") {
      return res
        .status(403)
        .json({ error: "Only QA can set status to 'done_from_qa'" });
    }
    if (status === "closed" && bug.status !== "done_from_qa") {
      return res
        .status(400)
        .json({ error: "Only bugs with status 'done_from_qa' can be closed" });
    }
    if (status === "closed" && !userPermissions.includes("close_bug")) {
      return res
        .status(403)
        .json({ error: "You do not have permission to close bugs" });
    }

    // Update the bug status
    bug.status = status;
    await bug.save();

    console.log(`Bug status updated to: ${status} for bugId: ${bugId}`);
    res.status(200).json({ message: "Bug status updated successfully", bug });
  } catch (error) {
    console.error("Update bug status error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.deleteBug = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const { bugId } = req.params;
    const bug = await Bug.findByIdAndDelete(bugId);
    if (!bug) {
      return res.status(404).json({ error: "Bug not found" });
    }

    res.status(200).json({ message: "Bug deleted successfully" });
  } catch (error) {
    console.error("Delete bug error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

exports.lockBug = async (req, res) => {
  try {
    console.log(
      `lockBug function called for bugId: ${
        req.params.bugId
      } at ${new Date().toISOString()}`
    );
    if (!req.session.user) {
      console.log("Unauthorized: No session user");
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const bugId = req.params.bugId;
    console.log("Fetching bug with ID:", bugId);
    const bug = await Bug.findById(bugId);
    if (!bug) {
      console.log("Bug not found with ID:", bugId);
      return res.status(404).json({ error: "Bug not found" });
    }

    // Prevent locking/unlocking if the bug is closed
    if (bug.status === "closed") {
      console.log("Cannot lock/unlock a closed bug:", bugId);
      return res
        .status(400)
        .json({ error: "Cannot lock or unlock a closed bug" });
    }

    bug.locked = !bug.locked;
    await bug.save();
    console.log("Bug locked status toggled, saved:", bug);

    res.status(200).json({
      message: `Bug ${bug.locked ? "locked" : "unlocked"} successfully`,
      bug,
    });
  } catch (error) {
    console.error("Lock bug error:", error.stack);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

// This work fine than above
// exports.lockBug = async (req, res) => {
//   try {
//     console.log(
//       `lockBug function called for bugId: ${
//         req.params.bugId
//       } at ${new Date().toISOString()}`
//     );
//     if (!req.session.user) {
//       console.log("Unauthorized: No session user");
//       return res.status(401).json({ error: "Unauthorized: Please log in" });
//     }

//     const bugId = req.params.bugId;
//     console.log("Fetching bug with ID:", bugId);
//     const bug = await Bug.findById(bugId);
//     if (!bug) {
//       console.log("Bug not found with ID:", bugId);
//       return res.status(404).json({ error: "Bug not found" });
//     }

//     bug.locked = !bug.locked;
//     await bug.save();
//     console.log("Bug locked status toggled, saved:", bug);

//     res.status(200).json({
//       message: `Bug ${bug.locked ? "locked" : "unlocked"} successfully`,
//       bug,
//     });
//   } catch (error) {
//     console.error("Lock bug error:", error.stack);
//     res.status(500).json({ error: "An error occurred. Please try again." });
//   }
// };

module.exports = exports;
