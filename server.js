// const express = require("express");
// const session = require("express-session");
// const path = require("path");
// require("dotenv").config();

// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: process.env.SECRET_KEY || "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       sameSite: "lax",
//       secure: false, // Set to true in production with HTTPS
//       httpOnly: true,
//     },
//   })
// );

// const connectToDatabase = require("./config/db");
// connectToDatabase()
//   .then(() => console.log("MongoDB Atlas connected"))
//   .catch((error) => {
//     console.error("DB connection error:", error);
//     process.exit(1);
//   });

// // Routes
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api", require("./routes/dashboardRoutes"));
// app.use("/api/projects", require("./routes/projectRoutes"));
// app.use("/api/bugs", require("./routes/bugRoutes"));

// // Serve uploads directory for images
// app.use("/uploads", express.static("uploads"));

// // Serve React frontend
// // app.use(express.static(path.join(__dirname, "../../frontend/build")));
// // app.get("*", (req, res) => {
// //   res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"));
// // });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// test change to above (only production)
const express = require("express");
const session = require("express-session");
const cors = require("cors"); // Add this import
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*", // Replace with your Vercel URL
    credentials: true, // Allow cookies/sessions (important for express-session)
  })
);
app.use(
  session({
    secret: process.env.SECRET_KEY || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "lax",
      secure: true, // Set to true in production with HTTPS
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
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/dashboardRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/bugs", require("./routes/bugRoutes"));

// Serve uploads directory for images
app.use("/uploads", express.static("uploads"));

// Serve React frontend (commented out for separate deployment)
// app.use(express.static(path.join(__dirname, "../../frontend/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));