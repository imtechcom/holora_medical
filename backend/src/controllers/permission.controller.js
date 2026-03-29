const db = require("../config/db");

// Get all permissions
const getAllPermissions = (req, res) => {
  const { module_name, status } = req.query;

  let sql = `
    SELECT *
    FROM permission
    WHERE 1=1
  `;
  let params = [];

  if (module_name) {
    sql += ` AND module_name = ?`;
    params.push(module_name);
  }

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY module_name, created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get all permissions error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Permissions fetched successfully",
      data: results,
    });
  });
};

// Get permission by ID
const getPermissionById = (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM permission WHERE id = ?`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get permission by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "Permission not found",
      });
    }

    return res.json({
      message: "Permission fetched successfully",
      data: results[0],
    });
  });
};

// Create permission
const createPermission = (req, res) => {
  const { name, code, module_name, description, status = "active" } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "Permission name and code are required",
    });
  }

  // Check if permission code already exists
  const checkSql = `
    SELECT id FROM permission WHERE code = ? LIMIT 1
  `;

  db.query(checkSql, [code], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check permission error:", checkErr);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message,
      });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({
        message: "Permission code already exists",
      });
    }

    const insertSql = `
      INSERT INTO permission (name, code, module_name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(
      insertSql,
      [name, code, module_name, description, status],
      (insertErr, insertResults) => {
        if (insertErr) {
          console.error("Create permission error:", insertErr);
          return res.status(500).json({
            message: "Failed to create permission",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          message: "Permission created successfully",
          data: {
            id: insertResults.insertId,
            name,
            code,
            module_name,
            description,
            status,
          },
        });
      }
    );
  });
};

// Update permission
const updatePermission = (req, res) => {
  const { id } = req.params;
  const { name, module_name, description, status } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Permission name is required",
    });
  }

  const updateSql = `
    UPDATE permission
    SET name = ?, module_name = ?, description = ?, status = ?, updated_at = NOW()
    WHERE id = ?
  `;

  db.query(updateSql, [name, module_name, description, status, id], (err, results) => {
    if (err) {
      console.error("Update permission error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: "Permission not found",
      });
    }

    return res.json({
      message: "Permission updated successfully",
    });
  });
};

// Delete permission (soft delete)
const deletePermission = (req, res) => {
  const { id } = req.params;

  // Check if permission is used by any role
  const checkSql = `
    SELECT COUNT(*) as count FROM role_permission WHERE permission_id = ?
  `;

  db.query(checkSql, [id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check permission usage error:", checkErr);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message,
      });
    }

    if (checkResults[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete permission that is assigned to roles",
      });
    }

    // Soft delete - change status to inactive
    const deleteSql = `
      UPDATE permission
      SET status = 'inactive', updated_at = NOW()
      WHERE id = ?
    `;

    db.query(deleteSql, [id], (deleteErr, deleteResults) => {
      if (deleteErr) {
        console.error("Delete permission error:", deleteErr);
        return res.status(500).json({
          message: "Database error",
          error: deleteErr.message,
        });
      }

      if (deleteResults.affectedRows === 0) {
        return res.status(404).json({
          message: "Permission not found",
        });
      }

      return res.json({
        message: "Permission deleted successfully",
      });
    });
  });
};

// Get distinct modules
const getModules = (req, res) => {
  const sql = `
    SELECT DISTINCT module_name
    FROM permission
    WHERE module_name IS NOT NULL
    ORDER BY module_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get modules error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Modules fetched successfully",
      data: results.map((r) => r.module_name),
    });
  });
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getModules,
};
