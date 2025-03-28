// const User = require("../models/user");
// const Project = require("../models/project");
// const Role = require("../models/role");
// const bcrypt = require("bcrypt");

// exports.signup = async (req, res) => {
//   const { name, email, password, role } = req.body;
//   try {
//     /*  role by name to get its _id 
    
//     This will check from Role model {name} only name field whether role from form is different or not .(kay role form wohi ha jo Role model ma ha ya different ?)
//     */

//     const roleDoc = await Role.findOne({ name: role });

//     if (!roleDoc) {
//       return res.status(400).json({ error: "Invalid role specified" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: roleDoc._id,
//     });
//     await user.save();
//     /* not Know why user._id ? */
//     res.status(201).json({ message: "Account created", userId: user._id });
//   } catch (error) {
//     console.error("Signup error", error);

//     res
//       .status(500)
//       .json({ error: error.message || "An error occured. Please try again." });
//   }
// };

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
//     res.status(500).json({
//       error: "An error occurred. Please try again.",
//       details: error.message,
//     });
//   }
// };

// exports.logout = (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).json({ error: "Logout failed" });
//     }
//     res.status(200).json({ message: "Logged out successfully" });
//   });
// };


// to brute - force prevention attack
// const User = require("../models/user");
// const Project = require("../models/project");
// const Role = require("../models/role");
// const bcrypt = require("bcrypt");

// exports.signup = async (req, res) => {
//   const { name, email, password, role } = req.body;
//   try {
//     const roleDoc = await Role.findOne({ name: role });

//     if (!roleDoc) {
//       return res.status(400).json({ error: "Invalid role specified" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: roleDoc._id,
//     });
//     await user.save();
//     res.status(201).json({ message: "Account created", userId: user._id });
//   } catch (error) {
//     console.error("Signup error", error);
//     res.status(500).json({ error: error.message || "An error occurred. Please try again." });
//   }
// };

// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   const MAX_FAILED_ATTEMPTS = 5;
//   const LOCKOUT_DURATION = 15; // in minutes

//   try {
//     const user = await User.findOne({ email }).populate("role");
//     if (!user) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     // Check if account is locked
//     if (user.lockUntil && new Date() < user.lockUntil) {
//       const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60); // in minutes
//       return res.status(403).json({
//         error: `Account is locked due to multiple failed attempts. Please try again in ${remainingTime} minutes.`,
//       });
//     }

//     // Compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       // Increment failed attempts
//       user.failedLoginAttempts += 1;
//       if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
//         user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000); // Lock for 15 minutes
//       }
//       await user.save();
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     // Reset failed attempts and lockout on successful login
//     user.failedLoginAttempts = 0;
//     user.lockUntil = null;
//     await user.save();

//     // Store user in session with populated role
//     req.session.user = {
//       id: user._id,
//       email: user.email,
//       name: user.name,
//       role: user.role,
//     };
//     console.log("Session user after login:", req.session.user);

//     res.status(200).json({ message: "Login successful!", role: user.role.name });
//   } catch (error) {
//     console.error("Login error:", error.stack);
//     res.status(500).json({
//       error: "An error occurred. Please try again.",
//       details: error.message,
//     });
//   }
// };

// exports.logout = (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).json({ error: "Logout failed" });
//     }
//     res.status(200).json({ message: "Logged out successfully" });
//   });
// };


// restricting users
const User = require("../models/user");
const Project = require("../models/project");
const Role = require("../models/role");
const bcrypt = require("bcrypt");

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
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
    res.status(201).json({ message: "Account created", userId: user._id });
  } catch (error) {
    console.error("Signup error", error);
    res.status(500).json({ error: error.message || "An error occurred. Please try again." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15; // in minutes

  try {
    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.lockUntil && new Date() < user.lockUntil) {
      const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
      return res.status(403).json({
        error: `Account is locked due to multiple failed attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Reset failed attempts and lockout on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Check if user is assigned to any project (only for QA and Developer roles)
    const roleName = user.role.name.toLowerCase();
    let projectAssigned = true; // Default to true (Managers are exempt)

    if (["qa", "developer"].includes(roleName)) {
      const projects = await Project.find({
        $or: [
          { developerIds: user._id }, // Check if user is in developerIds
          { qaIds: user._id }, // Check if user is in qaIds
        ],
      });
      projectAssigned = projects.length > 0;
    }

    // Store user in session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    console.log("Session user after login:", req.session.user);

    if (!projectAssigned) {
      return res.status(200).json({
        message: "Login successful, but you need to be assigned to a project to access your dashboard.",
        role: user.role.name,
        restricted: true,
      });
    }

    res.status(200).json({ message: "Login successful!", role: user.role.name, restricted: false });
  } catch (error) {
    console.error("Login error:", error.stack);
    res.status(500).json({
      error: "An error occurred. Please try again.",
      details: error.message,
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
};