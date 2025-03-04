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
const restrictToRole = require("../middleware/restrictToRole");

router.post("/projects/:projectId/bugs", restrictToRole("QA"), bugController.createBug);
router.patch("/bugs/:bugId", restrictToRole("Developer"), bugController.updateBugStatus);
router.get("/qa", restrictToRole("QA"), bugController.getQABugs);
router.get("/dev", restrictToRole("Developer"), bugController.getDevBugs);

module.exports = router;