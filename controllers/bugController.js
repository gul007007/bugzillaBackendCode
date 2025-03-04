const Bug = require("../models/bug");
const Project = require("../models/project");
const User = require("../models/user");
const multer = require("multer");
const path = require("path");

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

exports.createBug = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err });
    }

    const {
      projectId,
      title,
      description,
      deadline,
      type,
      status,
      assignedTo,
    } = req.body;
    const qaId = req.session.user.id;

    try {
      const project = await Project.findOne({ _id: projectId, qaIds: qaId });
      if (!project) {
        return res
          .status(403)
          .json({ error: "Not authorized to create bugs in this project" });
      }

      let image = null;
      if (req.file) {
        image = `/uploads/${req.file.filename}`;
      }

      let assignedToId = null;
      if (assignedTo) {
        const dev = await User.findOne({ _id: assignedTo, role: "Developer" });
        if (!dev || !project.developerIds.includes(dev._id)) {
          return res
            .status(400)
            .json({ error: "Invalid or unauthorized Developer" });
        }
        assignedToId = dev._id;
      }

      const bug = new Bug({
        projectId,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        image,
        type,
        status,
        assignedTo: assignedToId,
        createdBy: qaId,
      });
      await bug.save();
      res.status(201).json({ message: "Bug created", bugId: bug._id });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });
};

exports.updateBugStatus = async (req, res) => {
  const { bugId } = req.params;
  const { status } = req.body;
  const devId = req.session.user.id;

  try {
    const bug = await Bug.findOne({ _id: bugId, assignedTo: devId });
    if (!bug) {
      return res.status(403).json({ error: "Not authorized or bug not found" });
    }

    bug.status = status;
    bug.updatedAt = new Date();
    await bug.save();
    res.status(200).json({ message: "Bug updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQABugs = async (req, res) => {
  const qaId = req.session.user.id;

  try {
    const bugs = await Bug.find({ createdBy: qaId })
      .populate("assignedTo", "name email") // Populate Developer assigned to the bug
      .populate("projectId", "name") // Populate project name
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
    res.status(200).json({ bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDevBugs = async (req, res) => {
  const devId = req.session.user.id;

  try {
    const bugs = await Bug.find({ assignedTo: devId })
      .populate("createdBy", "name email") // Populate QA who created the bug
      .populate("projectId", "name") // Populate project name
      .sort({ updatedAt: -1 }); // Sort by last update, newest first
    res.status(200).json({ bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
