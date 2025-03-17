// const express = require("express");
// const router = express.Router();
// const bugController = require("../controllers/bugController");
// const restrictToRole = require("../middleware/restrictToRole");

// router.post("/projects/:projectId/bugs", restrictToRole("QA"), bugController.createBug);
// router.patch("/bugs/:bugId", restrictToRole("Developer"), bugController.updateBugStatus);

// module.exports = router;

// Test code ~~ go back to above code
const express = require("express");
const router = express.Router();
const bugController = require("../controllers/bugController");
const checkPermissions = require("../middleware/checkPermissions");

const upload = require("../controllers/bugController").upload;

router.post(
  "/projects/:projectId/bugs",
  checkPermissions("create_bug"),
  upload,
  bugController.createBug
);

router.patch(
  "/:bugId",
  bugController.updateBugStatus
);

router.get(
  "/qa",
  checkPermissions("view_assigned_projects"),
  bugController.getQABugs
);

router.get(
  "/dev",
  checkPermissions("view_assigned_bugs"),
  bugController.getDevBugs
);

router.delete(
  "/bugs/:bugId",
  checkPermissions("delete_bug"),
  bugController.deleteBug
);

router.patch(
  "/:bugId/lock",
  checkPermissions("lock_bug"),
  (req, res, next) => {
    console.log(
      `Received PATCH request for bug ${
        req.params.bugId
      } at ${new Date().toISOString()}`
    );
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    next();
  },
  bugController.lockBug
);

// Add catch-all for debugging
router.use((req, res, next) => {
  console.log(`Catch-all in bugRoutes: ${req.method} ${req.path}`);
  next();
});
module.exports = router;
