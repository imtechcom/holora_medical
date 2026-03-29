const db = require("../config/db");

// Get all patients with user info
const getAllPatients = (req, res) => {
  const sql = `
    SELECT 
      p.*,
      u.username,
      u.status as user_status
    FROM patient p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status != 'blocked' OR p.status IS NOT NULL
    ORDER BY p.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all patients error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Patients fetched successfully",
      data: results,
    });
  });
};

// Get patient by ID
const getPatientById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      p.*,
      u.username,
      u.status as user_status
    FROM patient p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get patient by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    return res.json({
      message: "Patient fetched successfully",
      data: results[0],
    });
  });
};

// Create patient
const createPatient = (req, res) => {
  const {
    patient_code,
    full_name,
    phone,
    email,
    gender,
    date_of_birth,
    address,
    blood_group,
    allergies,
    medical_history,
    emergency_contact_name,
    emergency_contact_phone,
  } = req.body;

  if (!patient_code || !full_name || !phone) {
    return res.status(400).json({
      message: "Patient code, full name, and phone are required",
    });
  }

  // Check if patient code already exists
  const checkSql = `
    SELECT id FROM patient WHERE patient_code = ? LIMIT 1
  `;

  db.query(checkSql, [patient_code], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check patient error:", checkErr);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message,
      });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({
        message: "Patient code already exists",
      });
    }

    const insertSql = `
      INSERT INTO patient (
        patient_code, full_name, phone, email, gender, date_of_birth,
        address, blood_group, allergies, medical_history,
        emergency_contact_name, emergency_contact_phone, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `;

    db.query(
      insertSql,
      [
        patient_code,
        full_name,
        phone,
        email,
        gender,
        date_of_birth,
        address,
        blood_group,
        allergies,
        medical_history,
        emergency_contact_name,
        emergency_contact_phone,
      ],
      (insertErr, insertResults) => {
        if (insertErr) {
          console.error("Create patient error:", insertErr);
          return res.status(500).json({
            message: "Failed to create patient",
            error: insertErr.message,
          });
        }

        return res.status(201).json({
          message: "Patient created successfully",
          data: {
            id: insertResults.insertId,
            patient_code,
            full_name,
            phone,
          },
        });
      }
    );
  });
};

// Update patient
const updatePatient = (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    phone,
    email,
    gender,
    date_of_birth,
    address,
    blood_group,
    allergies,
    medical_history,
    emergency_contact_name,
    emergency_contact_phone,
    status,
  } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({
      message: "Full name and phone are required",
    });
  }

  const updateSql = `
    UPDATE patient
    SET 
      full_name = ?, phone = ?, email = ?, gender = ?, date_of_birth = ?,
      address = ?, blood_group = ?, allergies = ?, medical_history = ?,
      emergency_contact_name = ?, emergency_contact_phone = ?, status = ?,
      updated_at = NOW()
    WHERE id = ?
  `;

  db.query(
    updateSql,
    [
      full_name,
      phone,
      email,
      gender,
      date_of_birth,
      address,
      blood_group,
      allergies,
      medical_history,
      emergency_contact_name,
      emergency_contact_phone,
      status || "active",
      id,
    ],
    (err, results) => {
      if (err) {
        console.error("Update patient error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          message: "Patient not found",
        });
      }

      return res.json({
        message: "Patient updated successfully",
      });
    }
  );
};

// Delete patient (soft delete)
const deletePatient = (req, res) => {
  const { id } = req.params;

  const deleteSql = `
    UPDATE patient
    SET status = 'blocked', updated_at = NOW()
    WHERE id = ?
  `;

  db.query(deleteSql, [id], (err, results) => {
    if (err) {
      console.error("Delete patient error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    return res.json({
      message: "Patient deleted successfully",
    });
  });
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
