const db = require("../config/db");

// Get all branches
const getAllBranches = (req, res) => {
  const sql = `
    SELECT * FROM branch
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all branches error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Branches fetched successfully",
      data: results,
    });
  });
};

// Get branch by ID
const getBranchById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM branch
    WHERE id = ? AND deleted_at IS NULL
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get branch by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({ message: "Branch not found" });
    }

    return res.json({
      message: "Branch fetched successfully",
      data: results[0],
    });
  });
};

// Create branch
const createBranch = (req, res) => {
  const { name, code, phone, email, address, city, description, status } = req.body;
  const ownerUserId = req.user?.id || null;

  if (!name || !code || !address) {
    return res.status(400).json({
      message: "Name, code and address are required",
    });
  }

  if (!/^[A-Z0-9_]+$/.test(code)) {
    return res.status(400).json({
      message: "Code must contain only uppercase letters, numbers, and underscores",
    });
  }

  const checkSql = "SELECT id FROM branch WHERE code = ? AND deleted_at IS NULL";
  db.query(checkSql, [code], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check branch code error:", checkErr);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message,
      });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({ message: "Branch code already exists" });
    }

    const insertSql = `
      INSERT INTO branch (
        name, code, owner_user_id, phone, email, address, city, description, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      name,
      code,
      ownerUserId,
      phone || null,
      email || null,
      address,
      city || null,
      description || null,
      status || "active",
    ];

    db.query(insertSql, values, (insertErr, result) => {
      if (insertErr) {
        console.error("Create branch error:", insertErr);
        return res.status(500).json({
          message: "Database error",
          error: insertErr.message,
        });
      }

      return res.status(201).json({
        message: "Branch created successfully",
        data: {
          id: result.insertId,
          name,
          code,
          owner_user_id: ownerUserId,
          phone: phone || null,
          email: email || null,
          address,
          city: city || null,
          description: description || null,
          status: status || "active",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    });
  });
};

// Update branch
const updateBranch = (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, city, description, status } = req.body;

  if (!name || !address) {
    return res.status(400).json({
      message: "Name and address are required",
    });
  }

  const updateSql = `
    UPDATE branch
    SET
      name = ?,
      phone = ?,
      email = ?,
      address = ?,
      city = ?,
      description = ?,
      status = ?,
      updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

  const values = [
    name,
    phone || null,
    email || null,
    address,
    city || null,
    description || null,
    status || "active",
    id,
  ];

  db.query(updateSql, values, (err, result) => {
    if (err) {
      console.error("Update branch error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const selectSql = "SELECT * FROM branch WHERE id = ? AND deleted_at IS NULL";
    db.query(selectSql, [id], (selectErr, rows) => {
      if (selectErr) {
        console.error("Fetch updated branch error:", selectErr);
        return res.status(500).json({
          message: "Database error",
          error: selectErr.message,
        });
      }

      return res.json({
        message: "Branch updated successfully",
        data: rows[0],
      });
    });
  });
};

// Delete branch (soft delete)
const deleteBranch = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE branch
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delete branch error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Branch not found" });
    }

    return res.json({ message: "Branch deleted successfully" });
  });
};

// Get branches owned by the authenticated user
const getMyBranches = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const sql = `
    SELECT
      b.*,
      COUNT(DISTINCT db.doctor_id) AS doctor_count
    FROM branch b
    LEFT JOIN doctor_branch db ON db.branch_id = b.id
    WHERE b.owner_user_id = ?
      AND b.deleted_at IS NULL
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Get my branches error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    return res.json({ message: "Branches fetched successfully", data: results });
  });
};

module.exports = {
  getAllBranches,
  getBranchById,
  getMyBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
