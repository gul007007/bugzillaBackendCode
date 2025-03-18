

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Add endpoint to fetch current user
router.get("/user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized: Please log in" });
  }
  res.status(200).json({ user: req.session.user });
});

module.exports = router;