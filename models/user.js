// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Name is required"],
//   },
//   email: { type: String, required: [true, "Email is required"], unique: true },
//   password: { type: String, required: [true, "Password is required"] },
//   // role refrecing Role model
//   role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: [true, "Role is required"] },
// });

// module.exports = mongoose.model("User", userSchema);


// to prevent brute-force
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: { type: String, required: [true, "Email is required"], unique: true },
  password: { type: String, required: [true, "Password is required"] },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: [true, "Role is required"] },
  failedLoginAttempts: { type: Number, default: 0 }, // Track failed login attempts
  lockUntil: { type: Date, default: null }, // Timestamp until which the account is locked
});

module.exports = mongoose.model("User", userSchema);