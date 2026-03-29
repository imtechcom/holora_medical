const db = require("../config/db");

// Get all doctors
const getAllDoctors = (req, res) => {
  const sql = `
    SELECT 
      d.*,
      u.username,
      u.email as user_email,
      s.name as specialty_name
    FROM doctor d
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN specialty s ON d.specialty_id = s.id
    ORDER BY d.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all doctors error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Doctors fetched successfully",
      data: results,
    });
  });
};

// Get doctor by ID
const getDoctorById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      d.*,
      u.username,
      u.email as user_email,
      s.name as specialty_name,
      s.id as specialty_id
    FROM doctor d
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN specialty s ON d.specialty_id = s.id
    WHERE d.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get doctor by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    return res.json({
      message: "Doctor fetched successfully",
      data: results[0],
    });
  });
};

// Create doctor
const createDoctor = (req, res) => {
  const {
    user_id,
    specialty_id,
    full_name,
    phone,
    email,
    license_number,
    qualification,
    experience_years,
    consultation_fee,
    bio,
    avatar_url,
    status,
  } = req.body;

  console.log("Create doctor request:", req.body);

  // Validate required fields
  if (!full_name || !phone || !license_number) {
    console.log("Validation failed:", { full_name, phone, license_number });
    return res.status(400).json({
      message: "Full name, phone, and license number are required",
    });
  }

  // Check if license number already exists
  const checkSql = "SELECT id FROM doctor WHERE license_number = ?";
  db.query(checkSql, [license_number], (err, results) => {
    if (err) {
      console.error("Check license number error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "License number already exists",
      });
    }

    // Generate doctor code (DOCTOR + ID padded)
    const generateCodeSql = "SELECT MAX(CAST(SUBSTRING(doctor_code, 7) AS UNSIGNED)) as maxId FROM doctor WHERE doctor_code LIKE 'DOCTOR%'";
    db.query(generateCodeSql, (err, codeResults) => {
      if (err) {
        console.error("Generate code error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      const nextId = (codeResults[0]?.maxId || 0) + 1;
      const doctor_code = `DOCTOR${String(nextId).padStart(6, "0")}`;
      console.log("Generated doctor code:", doctor_code);

      const insertSql = `
        INSERT INTO doctor (specialty_id, doctor_code, full_name, phone, email, license_number, qualification, experience_years, consultation_fee, bio, avatar_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const insertValues = [
        specialty_id || null,
        doctor_code,
        full_name,
        phone,
        email,
        license_number,
        qualification,
        experience_years || 0,
        consultation_fee || 0,
        bio || null,
        avatar_url || null,
        status || "active",
      ];
      
      console.log("Insert values:", insertValues);

      db.query(insertSql, insertValues, (err, result) => {
        if (err) {
          console.error("Create doctor SQL error:", err.message);
          console.error("Error code:", err.code);
          console.error("Error errno:", err.errno);
          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        console.log("Doctor inserted successfully, ID:", result.insertId);

        const newDoctor = {
          id: result.insertId,
          user_id,
          specialty_id,
          doctor_code,
          full_name,
          phone,
          email,
          license_number,
          qualification,
          experience_years: experience_years || 0,
          consultation_fee: consultation_fee || 0,
          bio,
          avatar_url,
          status: status || "active",
          created_at: new Date(),
          updated_at: new Date(),
        };

        return res.status(201).json({
          message: "Doctor created successfully",
          data: newDoctor,
        });
      });
    });
  });
};

// Update doctor
const updateDoctor = (req, res) => {
  const { id } = req.params;
  const {
    specialty_id,
    full_name,
    phone,
    email,
    license_number,
    qualification,
    experience_years,
    consultation_fee,
    bio,
    avatar_url,
    status,
  } = req.body;

  if (!full_name || !phone || !license_number) {
    return res.status(400).json({
      message: "Full name, phone, and license number are required",
    });
  }

  // Check if license number is already used by another doctor
  const checkSql = "SELECT id FROM doctor WHERE license_number = ? AND id != ?";
  db.query(checkSql, [license_number, id], (err, results) => {
    if (err) {
      console.error("Check license number error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "License number already exists",
      });
    }

    const updateSql = `
      UPDATE doctor
      SET specialty_id = ?, full_name = ?, phone = ?, email = ?, license_number = ?, 
          qualification = ?, experience_years = ?, consultation_fee = ?, bio = ?, 
          avatar_url = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [
        specialty_id || null,
        full_name,
        phone,
        email,
        license_number,
        qualification,
        experience_years || 0,
        consultation_fee || 0,
        bio || null,
        avatar_url || null,
        status || "active",
        id,
      ],
      (err, result) => {
        if (err) {
          console.error("Update doctor error:", err);
          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Doctor not found",
          });
        }

        return res.json({
          message: "Doctor updated successfully",
          data: {
            id: parseInt(id),
            specialty_id,
            full_name,
            phone,
            email,
            license_number,
            qualification,
            experience_years: experience_years || 0,
            consultation_fee: consultation_fee || 0,
            bio,
            avatar_url,
            status: status || "active",
          },
        });
      }
    );
  });
};

// Delete doctor (soft delete)
const deleteDoctor = (req, res) => {
  const { id } = req.params;

  // Check if doctor exists
  const checkSql = "SELECT id FROM doctor WHERE id = ?";
  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Check doctor error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    // Soft delete using status
    const deleteSql = "UPDATE doctor SET status = 'deleted', updated_at = NOW() WHERE id = ?";
    db.query(deleteSql, [id], (err) => {
      if (err) {
        console.error("Delete doctor error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      return res.json({
        message: "Doctor deleted successfully",
        data: { id: parseInt(id) },
      });
    });
  });
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
