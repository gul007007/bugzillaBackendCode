const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  developerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  qaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Project", projectSchema);