const bcrypt = require("bcryptjs");
const db = require("../config/db");

// Get all users
const getAllUsers = (req, res) => {
  const sql = `
    SELECT 
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.avatar_url,
      u.gender,
      u.date_of_birth,
      u.status,
      u.email_verified_at,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      GROUP_CONCAT(r.name SEPARATOR ', ') as roles
    FROM users u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id, u.full_name, u.username, u.email, u.phone, u.avatar_url, u.gender, u.date_of_birth, u.status, u.email_verified_at, u.last_login_at, u.created_at, u.updated_at
    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all users error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Users fetched successfully",
      data: results,
    });
  });
};

// Get user by ID
const getUserById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.avatar_url,
      u.gender,
      u.date_of_birth,
      u.status,
      u.email_verified_at,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      GROUP_CONCAT(r.code SEPARATOR ', ') as roles
    FROM users u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.id = ?
      AND u.deleted_at IS NULL
    GROUP BY u.id, u.full_name, u.username, u.email, u.phone, u.avatar_url, u.gender, u.date_of_birth, u.status, u.email_verified_at, u.last_login_at, u.created_at, u.updated_at
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get user by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      message: "User fetched successfully",
      data: results[0],
    });
  });
};

// Create user
const createUser = async (req, res) => {
  const { full_name, username, email, password, phone, role_code, status = "active" } = req.body;

  if (!full_name || !username || !email || !password) {
    return res.status(400).json({
      message: "Full name, username, email, and password are required",
    });
  }

  try {
    // Check if user already exists
    const checkSql = `
      SELECT id 
      FROM users 
      WHERE (email = ? OR username = ?) 
        AND deleted_at IS NULL
      LIMIT 1
    `;

    db.query(checkSql, [email, username], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Check user error:", checkErr);
        return res.status(500).json({
          message: "Database error",
          error: checkErr.message,
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          message: "Email or username already exists",
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Insert user
      const insertSql = `
        INSERT INTO users (
          full_name,
          username,
          email,
          password_hash,
          phone,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      db.query(
        insertSql,
        [full_name, username, email, password_hash, phone || null, status],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Insert user error:", insertErr);
            return res.status(500).json({
              message: "Create user failed",
              error: insertErr.message,
            });
          }

          const newUserId = result.insertId;

          // If role is provided, assign it
          if (role_code) {
            const getRoleSql = `
              SELECT id 
              FROM role 
              WHERE code = ? 
                AND status = 'active'
              LIMIT 1
            `;

            db.query(getRoleSql, [role_code], (roleErr, roleResults) => {
              if (roleErr || !roleResults.length) {
                console.error("Get role error:", roleErr);
                return res.status(500).json({
                  message: "Create user failed",
                  error: "Role not found",
                });
              }

              const roleId = roleResults[0].id;

              const assignRoleSql = `
                INSERT INTO user_role (user_id, role_id, assigned_at)
                VALUES (?, ?, NOW())
              `;

              db.query(assignRoleSql, [newUserId, roleId], (assignErr) => {
                if (assignErr) {
                  console.error("Assign role error:", assignErr);
                  return res.status(500).json({
                    message: "Create user failed",
                    error: assignErr.message,
                  });
                }

                return res.status(201).json({
                  message: "User created successfully",
                  data: { id: newUserId },
                });
              });
            });
          } else {
            // Assign default patient role
            const getPatientRoleSql = `
              SELECT id 
              FROM role 
              WHERE code = 'patient' 
                AND status = 'active'
              LIMIT 1
            `;

            db.query(getPatientRoleSql, (roleErr, roleResults) => {
              if (!roleErr && roleResults.length) {
                const patientRoleId = roleResults[0].id;
                const assignRoleSql = `
                  INSERT INTO user_role (user_id, role_id, assigned_at)
                  VALUES (?, ?, NOW())
                `;

                db.query(assignRoleSql, [newUserId, patientRoleId], (assignErr) => {
                  if (assignErr) {
                    console.error("Assign role error:", assignErr);
                  }

                  return res.status(201).json({
                    message: "User created successfully",
                    data: { id: newUserId },
                  });
                });
              } else {
                return res.status(201).json({
                  message: "User created successfully",
                  data: { id: newUserId },
                });
              }
            });
          }
        }
      );
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, status, password } = req.body;

  if (!id || !full_name || !email) {
    return res.status(400).json({
      message: "User ID, full name, and email are required",
    });
  }

  try {
    let updateSql = `
      UPDATE users 
      SET full_name = ?, email = ?, phone = ?, status = ?, updated_at = NOW()
    `;
    let params = [full_name, email, phone || null, status];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateSql = `
        UPDATE users 
        SET full_name = ?, email = ?, phone = ?, status = ?, password_hash = ?, updated_at = NOW()
      `;
      params = [full_name, email, phone || null, status, password_hash];
    }

    updateSql += ` WHERE id = ? AND deleted_at IS NULL`;
    params.push(id);

    db.query(updateSql, params, (err, result) => {
      if (err) {
        console.error("Update user error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.json({
        message: "User updated successfully",
      });
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete user (soft delete)
const deleteUser = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  const sql = `
    UPDATE users 
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delete user error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      message: "User deleted successfully",
    });
  });
};

// Assign role to user (support multiple roles)
const assignRoleToUser = (req, res) => {
  const { user_id, role_id } = req.body;

  if (!user_id || !role_id) {
    return res.status(400).json({
      message: "User ID and role ID are required",
    });
  }

  // Check if user exists
  const checkUserSql = "SELECT id FROM users WHERE id = ? AND deleted_at IS NULL";
  db.query(checkUserSql, [user_id], (userErr, userResults) => {
    if (userErr || !userResults.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if role exists
    const checkRoleSql = "SELECT id FROM role WHERE id = ? AND status = 'active'";
    db.query(checkRoleSql, [role_id], (roleErr, roleResults) => {
      if (roleErr || !roleResults.length) {
        return res.status(404).json({
          message: "Role not found",
        });
      }

      // Check if assignment already exists
      const checkAssignSql = `
        SELECT id FROM user_role 
        WHERE user_id = ? AND role_id = ?
      `;

      db.query(checkAssignSql, [user_id, role_id], (checkErr, checkResults) => {
        if (checkResults.length > 0) {
          return res.status(400).json({
            message: "User already has this role",
          });
        }

        // Assign role (support multiple roles)
        const assignSql = `
          INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
          VALUES (?, ?, NOW(), ?)
        `;

        const admin_id = req.user?.id || 1; // Get from auth context
        db.query(assignSql, [user_id, role_id, admin_id], (assignErr) => {
          if (assignErr) {
            console.error("Assign role error:", assignErr);
            return res.status(500).json({
              message: "Assign role failed",
              error: assignErr.message,
            });
          }

          return res.json({
            message: "Role assigned successfully",
            data: { user_id, role_id },
          });
        });
      });
    });
  });
};

// Remove role from user
const removeRoleFromUser = (req, res) => {
  const { user_id, role_id } = req.body;

  if (!user_id || !role_id) {
    return res.status(400).json({
      message: "User ID and role ID are required",
    });
  }

  const removeSql = `
    DELETE FROM user_role 
    WHERE user_id = ? AND role_id = ?
  `;

  db.query(removeSql, [user_id, role_id], (err, result) => {
    if (err) {
      console.error("Remove role error:", err);
      return res.status(500).json({
        message: "Remove role failed",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User role assignment not found",
      });
    }

    return res.json({
      message: "Role removed successfully",
      data: { user_id, role_id },
    });
  });
};

// Get all roles of a user
const getUserRoles = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      r.id,
      r.code,
      r.name,
      r.description,
      r.status,
      ur.assigned_at,
      ur.assigned_by,
      admin.full_name as assigned_by_name
    FROM user_role ur
    JOIN role r ON ur.role_id = r.id
    LEFT JOIN users admin ON ur.assigned_by = admin.id
    WHERE ur.user_id = ?
    ORDER BY ur.assigned_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Get user roles error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "User roles fetched successfully",
      data: results,
    });
  });
};

// Get all available roles (not assigned to user)
const getAvailableRoles = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      r.id,
      r.code,
      r.name,
      r.description,
      r.status,
      CASE 
        WHEN ur.user_id IS NOT NULL THEN true
        ELSE false
      END as is_assigned
    FROM role r
    LEFT JOIN user_role ur ON r.id = ur.role_id AND ur.user_id = ?
    WHERE r.status = 'active'
    ORDER BY r.name
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Get available roles error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Available roles fetched successfully",
      data: results,
    });
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getAvailableRoles,
};
