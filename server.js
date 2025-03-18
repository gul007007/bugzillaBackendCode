const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const bugRoutes = require("./routes/bugRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes"); // Add this
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET_KEY || "your-secret-key",
    resave: false,
    origin: "http://localhost:5173/",
    saveUninitialized: false,
    credentials: true,
    cookie: {
      sameSite: "lax",
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
    },
  })
);

const connectToDatabase = require("./config/db");
connectToDatabase()
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((error) => {
    console.error("DB connection error:", error);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api", dashboardRoutes);

// Serve uploads directory for images
app.use("/uploads", express.static("uploads"));

// Serve React frontend ~ for mono-repo
// app.use(express.static(path.join(__dirname, "../../frontend/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
