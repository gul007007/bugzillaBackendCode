const User = require("../models/user");
const Project = require("../models/project");
const bcrypt = require("bcrypt");

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: "Account created" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (user.role !== "Manager") {
      const project = await Project.findOne({
        $or: [{ developerIds: user._id }, { qaIds: user._id }],
      });
      if (!project) {
        return res.status(403).json({ error: "Not assigned to any project" });
      }
    }
    req.session.user = { id: user._id, role: user.role };
    res.status(200).json({ message: "Login successful", role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
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