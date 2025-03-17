const Role = require("../models/role");

const checkPermissions = (requiredPermissions) => async (req, res, next) => {
  try {
    console.log("Middleware checkPermissions triggered for path:", req.path);
    console.log(
      "Session user:",
      req.session.user ? req.session.user.email : "No session user"
    );
    console.log("Required permissions:", requiredPermissions);

    // Check if user is logged in
    if (!req.session.user || !req.session.user.role) {
      console.log("Unauthorized: No session or role");
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const role = req.session.user.role;

    // Debug log to verify permissions being checked
    console.log(
      "Checking permissions:",
      requiredPermissions,
      "for role:",
      role.name
    );

    const hasPermission = Array.isArray(requiredPermissions)
      ? requiredPermissions.every((perm) => role.permissions.includes(perm))
      : role.permissions.includes(requiredPermissions);

    if (!hasPermission) {
      console.log("Permission denied for:", requiredPermissions);
      return res.status(403).json({
        error: `Access denied: ${
          Array.isArray(requiredPermissions)
            ? requiredPermissions.join(", ")
            : requiredPermissions
        } required`,
      });
    }

    console.log("Permission granted, proceeding to next middleware");
    next();
  } catch (error) {
    console.error("Error in checkPermissions middleware:", error.stack);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

console.log("CheckPermission loaded:", checkPermissions);
module.exports = checkPermissions;
