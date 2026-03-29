const db = require("../config/db");

const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const userId = req.user.id;

    const sql = `
      SELECT r.code 
      FROM users u
      LEFT JOIN user_role ur ON u.id = ur.user_id
      LEFT JOIN role r ON ur.role_id = r.id
      WHERE u.id = ? AND u.deleted_at IS NULL
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Authorization check error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      const userRoles = results.map((row) => row.code).filter(Boolean);

      const hasRole = allowedRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          message: "You do not have permission to access this resource",
          requiredRoles: allowedRoles,
          userRoles,
        });
      }

      req.userRoles = userRoles;
      next();
    });
  };
};

module.exports = { authorizeRole };
