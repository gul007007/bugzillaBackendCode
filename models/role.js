const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Role name is required"],
    unique: true,
    enum: {
      values: ["Manager", "Developer", "QA"],
      message: "Role must be Manager, Developer, QA",
    },
  },

  permissions: {
    type: [String],
    required: [true, "Permissions are required"],
    default: [], // default permisssion
  },
});

module.exports = mongoose.model("Role", roleSchema);
