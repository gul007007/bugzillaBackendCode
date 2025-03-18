const mongoose = require("mongoose");

const bugSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  type: { type: String, enum: ["bug", "feature"], required: true },
  status: {
    type: String,
    enum: ["new", "started", "posted_to_qa", "done_from_qa", "closed"],
    default: "new",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image: String,
  locked: { type: Boolean, default: false }, // Add this line
});

module.exports = mongoose.model("Bug", bugSchema);
