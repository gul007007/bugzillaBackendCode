const User = require("../models/user");
const Project = require("../models/project");
const Role = require("../models/role");
const bcrypt = require("bcrypt");

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    /*  role by name to get its _id 
    
    This will check from Role model {name} only name field whether role from form is different or not .(kay role form wohi ha jo Role model ma ha ya different ?)
    */

    const roleDoc = await Role.findOne({ name: role });

    if (!roleDoc) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: roleDoc._id,
    });
    await user.save();
    /* not Know why user._id ? */
    res.status(201).json({ message: "Account created", userId: user._id });
  } catch (error) {
    console.error("Signup error", error);

    res
      .status(500)
      .json({ error: error.message || "An error occured. Please try again." });
  }
};

// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email }).populate("role");
//     if (!user) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     // Compare password (assumes password is hashed with bcrypt)
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     // Store user in session with populated role
//     req.session.user = {
//       id: user._id,
//       email: user.email,
//       name: user.name, // test
//       role: user.role, // This will be the full role document (e.g., { _id, name, permissions })
//     };
//     // Debug log to verify session data
//     console.log("Session user after login:", req.session.user);

//     res
//       .status(200)
//       .json({ message: "Login successful!", role: user.role.name });
//   } catch (error) {
//     console.error("Login error:", error.stack);
//     res
//       .status(500)
//       .json({
//         error: "An error occurred. Please try again.",
//         details: error.message,
//       });
//   }
// };

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
};


// avoid ~ bruteforce

const { isWithinLockoutPeriod, incrementFailedAttempts, resetFailedAttempts } = require("../utils/authUtils");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (isWithinLockoutPeriod(user)) {
      return res.status(403).json({
        error: "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await incrementFailedAttempts(user);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    await resetFailedAttempts(user);

    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    console.log("Session user after login:", req.session.user);

    res.status(200).json({ message: "Login successful!", role: user.role.name });
  } catch (error) {
    console.error("Login error:", error.stack);
    res.status(500).json({
      error: "An error occurred. Please try again.",
      details: error.message,
    });
  }
};

