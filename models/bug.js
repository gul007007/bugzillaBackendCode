const mongoose = require("mongoose");

const bugSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, unique: true }, // Enforced with compound index below
    description: { type: String },
    deadline: { type: Date },
    image: { type: String }, // URL or path to image (.png/.gif, max 5MB handled in controller)
    type: { type: String, enum: ["feature", "bug"], required: true },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["new", "started", "resolved", "completed"], // Broader enum for flexibility
      },
      validate: {
        validator: function (v) {
          const validStatuses = this.type === "bug" ? ["new", "started", "resolved"] : ["new", "started", "completed"];
          return validStatuses.includes(v);
        },
        message: "Status must be valid for the bug type (bug: new/started/resolved, feature: new/started/completed)",
      },
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Developer ID or null
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // QA ID
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Compound index to ensure unique titles within a project
bugSchema.index({ projectId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("Bug", bugSchema);