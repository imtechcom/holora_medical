const db = require("../config/db");

// Get all roles
const getAllRoles = (req, res) => {
  const sql = `
    SELECT 
      r.*,
      COUNT(ur.id) as user_count
    FROM role r
    LEFT JOIN user_role ur ON r.id = ur.role_id
    WHERE r.status = 'active'
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all roles error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Roles fetched successfully",
      data: results,
    });
  });
};

// Get role by ID
const getRoleById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      r.*,
      COUNT(ur.id) as user_count
    FROM role r
    LEFT JOIN user_role ur ON r.id = ur.role_id
    WHERE r.id = ? AND r.status = 'active'
    GROUP BY r.id
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get role by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    return res.json({
      message: "Role fetched successfully",
      data: results[0],
    });
  });
};

// Create role
const createRole = (req, res) => {
  const { name, code, description, is_system_role = false } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "Role name and code are required",
    });
  }

  // Check if role code already exists
  const checkSql = `
    SELECT id FROM role WHERE code = ? LIMIT 1
  `;

  db.query(checkSql, [code], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check role error:", checkErr);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message,
      });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({
        message: "Role code already exists",
      });
    }

    const insertSql = `
      INSERT INTO role (name, code, description, is_system_role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
    `;

    db.query(
      insertSql,
      [name, code, description || null, is_system_role ? 1 : 0],
      (insertErr, result) => {
        if (insertErr) {
          console.error("Insert role error:", insertErr);
          return res.status(500).json({
            message: "Create role failed",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          message: "Role created successfully",
          data: { id: result.insertId },
        });
      }
    );
  });
};

// Update role
const updateRole = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id || !name) {
    return res.status(400).json({
      message: "Role ID and name are required",
    });
  }

  const sql = `
    UPDATE role 
    SET name = ?, description = ?, updated_at = NOW()
    WHERE id = ? AND status = 'active'
  `;

  db.query(sql, [name, description || null, id], (err, result) => {
    if (err) {
      console.error("Update role error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Role not found or cannot be modified",
      });
    }

    return res.json({
      message: "Role updated successfully",
    });
  });
};

// Delete role (soft delete - mark as inactive)
const deleteRole = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "Role ID is required",
    });
  }

  // Check if role is system role
  const checkSql = `
    SELECT is_system_role FROM role WHERE id = ?
  `;

  db.query(checkSql, [id], (checkErr, checkResults) => {
    if (checkErr || !checkResults.length) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    if (checkResults[0].is_system_role) {
      return res.status(400).json({
        message: "System roles cannot be deleted",
      });
    }

    // Check if role is assigned to users
    const userCountSql = `
      SELECT COUNT(*) as count FROM user_role WHERE role_id = ?
    `;

    db.query(userCountSql, [id], (countErr, countResults) => {
      if (countErr) {
        return res.status(500).json({
          message: "Database error",
          error: countErr.message,
        });
      }

      if (countResults[0].count > 0) {
        return res.status(400).json({
          message: "Cannot delete role that is assigned to users",
        });
      }

      // Soft delete
      const deleteSql = `
        UPDATE role 
        SET status = 'inactive', updated_at = NOW()
        WHERE id = ?
      `;

      db.query(deleteSql, [id], (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete role error:", deleteErr);
          return res.status(500).json({
            message: "Database error",
            error: deleteErr.message,
          });
        }

        return res.json({
          message: "Role deleted successfully",
        });
      });
    });
  });
};

// Get role permissions
const getRolePermissions = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      p.id,
      p.name,
      p.code,
      p.module_name,
      rp.granted_at
    FROM permission p
    LEFT JOIN role_permission rp ON p.id = rp.permission_id AND rp.role_id = ?
    WHERE p.status = 'active'
    ORDER BY p.module_name, p.name
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get role permissions error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Role permissions fetched successfully",
      data: results,
    });
  });
};

// Assign permission to role
const assignPermissionToRole = (req, res) => {
  const { role_id, permission_id } = req.body;

  if (!role_id || !permission_id) {
    return res.status(400).json({
      message: "Role ID and permission ID are required",
    });
  }

  // Check if permission already assigned
  const checkSql = `
    SELECT id FROM role_permission 
    WHERE role_id = ? AND permission_id = ?
  `;

  db.query(checkSql, [role_id, permission_id], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message,
      });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({
        message: "Permission already assigned to this role",
      });
    }

    const insertSql = `
      INSERT INTO role_permission (role_id, permission_id, granted_at)
      VALUES (?, ?, NOW())
    `;

    db.query(insertSql, [role_id, permission_id], (insertErr) => {
      if (insertErr) {
        console.error("Assign permission error:", insertErr);
        return res.status(500).json({
          message: "Assign permission failed",
          error: insertErr.message,
        });
      }

      return res.status(201).json({
        message: "Permission assigned successfully",
      });
    });
  });
};

// Remove permission from role
const removePermissionFromRole = (req, res) => {
  const { role_id, permission_id } = req.body;

  if (!role_id || !permission_id) {
    return res.status(400).json({
      message: "Role ID and permission ID are required",
    });
  }

  const sql = `
    DELETE FROM role_permission 
    WHERE role_id = ? AND permission_id = ?
  `;

  db.query(sql, [role_id, permission_id], (err, result) => {
    if (err) {
      console.error("Remove permission error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Permission assignment not found",
      });
    }

    return res.json({
      message: "Permission removed successfully",
    });
  });
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
};
