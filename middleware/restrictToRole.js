const restrictToRole = (role) => (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Please log in" });
    }
    if (req.session.user.role !== role) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
  
  module.exports = restrictToRole;