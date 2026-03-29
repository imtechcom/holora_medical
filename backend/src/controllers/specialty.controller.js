const db = require("../config/db");

// Get all specialties
const getAllSpecialties = (req, res) => {
  const sql = `
    SELECT * FROM specialty
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all specialties error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Specialties fetched successfully",
      data: results,
    });
  });
};

// Get specialty by ID
const getSpecialtyById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM specialty
    WHERE id = ? AND deleted_at IS NULL
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get specialty by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Specialty not found",
      });
    }

    return res.json({
      message: "Specialty fetched successfully",
      data: results[0],
    });
  });
};

// Create specialty
const createSpecialty = (req, res) => {
  const { name, code, description, status } = req.body;

  // Validate required fields
  if (!name || !code) {
    return res.status(400).json({
      message: "Specialty name and code are required",
    });
  }

  // Validate code format (uppercase letters, numbers, underscores only)
  if (!/^[A-Z0-9_]+$/.test(code)) {
    return res.status(400).json({
      message: "Code must contain only uppercase letters, numbers, and underscores",
    });
  }

  // Check if code already exists
  const checkSql = "SELECT id FROM specialty WHERE code = ? AND deleted_at IS NULL";
  db.query(checkSql, [code], (err, results) => {
    if (err) {
      console.error("Check code error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "Specialty code already exists",
      });
    }

    const insertSql = `
      INSERT INTO specialty (name, code, description, status, doctor_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, NOW(), NOW())
    `;

    const insertValues = [
      name,
      code,
      description || null,
      status || "active",
    ];

    db.query(insertSql, insertValues, (err, result) => {
      if (err) {
        console.error("Create specialty error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      const newSpecialty = {
        id: result.insertId,
        name,
        code,
        description,
        status: status || "active",
        doctor_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      return res.status(201).json({
        message: "Specialty created successfully",
        data: newSpecialty,
      });
    });
  });
};

// Update specialty
const updateSpecialty = (req, res) => {
  const { id } = req.params;
  const { name, code, description, status } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Specialty name is required",
    });
  }

  // Code cannot be changed on update
  const updateSql = `
    UPDATE specialty
    SET name = ?, description = ?, status = ?, updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

  db.query(updateSql, [name, description || null, status || "active", id], (err, result) => {
    if (err) {
      console.error("Update specialty error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Specialty not found",
      });
    }

    // Fetch updated specialty
    const selectSql = "SELECT * FROM specialty WHERE id = ? AND deleted_at IS NULL";
    db.query(selectSql, [id], (err, results) => {
      if (err) {
        console.error("Fetch updated specialty error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      return res.json({
        message: "Specialty updated successfully",
        data: results[0],
      });
    });
  });
};

// Delete specialty (soft delete)
const deleteSpecialty = (req, res) => {
  const { id } = req.params;

  // Check if specialty has doctors assigned
  const checkSql = `
    SELECT COUNT(*) as doctor_count FROM doctor
    WHERE specialty_id = ? AND status != 'deleted'
  `;

  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Check doctors error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results[0].doctor_count > 0) {
      return res.status(400).json({
        message: "Cannot delete specialty with assigned doctors",
      });
    }

    // Soft delete the specialty
    const deleteSql = `
      UPDATE specialty
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error("Delete specialty error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Specialty not found",
        });
      }

      return res.json({
        message: "Specialty deleted successfully",
      });
    });
  });
};

module.exports = {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
};
