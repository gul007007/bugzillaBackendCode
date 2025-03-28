// const mongoose = require("mongoose");

// const bugSchema = new mongoose.Schema({
//   projectId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Project",
//     required: true,
//   },
//   title: { type: String, required: true },
//   description: String,
//   deadline: Date,
//   type: { type: String, enum: ["bug", "feature"], required: true },
//   status: {
//     type: String,
//     enum: ["new", "started", "posted_to_qa", "done_from_qa", "closed"],
//     default: "new",
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   image: String,
//   locked: { type: Boolean, default: false }, // Add this line
// });

// module.exports = mongoose.model("Bug", bugSchema);


// const mongoose = require("mongoose");

// const bugSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   status: { type: String, default: "open" },
//   qaStatus: { type: String, default: "pending" },
//   assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   allowedDevelopers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Tracks allowed developers
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Bug", bugSchema);



// restrict user & bug assigning bug
const mongoose = require("mongoose");

const bugSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true }, // Add projectId field
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "open" },
  qaStatus: { type: String, default: "pending" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  allowedDevelopers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bug", bugSchema);