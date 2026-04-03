const db = require("../config/db");
const { generateMedicalCode } = require("../utils/medical-code.util");

const isJoinTableMissing = (err) => err?.code === "ER_NO_SUCH_TABLE";

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const normalizeBranchIds = (branchIds) => {
  if (!Array.isArray(branchIds)) return [];

  const normalized = branchIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const fetchPatientBranchesByPatientIds = (patientIds, callback) => {
  if (!patientIds.length) {
    return callback(null, new Map());
  }

  const sql = `
    SELECT
      pb.patient_id,
      b.id AS branch_id,
      b.name AS branch_name,
      b.code AS branch_code
    FROM patient_branch pb
    INNER JOIN branch b ON b.id = pb.branch_id
    WHERE pb.deleted_at IS NULL
      AND b.deleted_at IS NULL
      AND pb.patient_id IN (?)
    ORDER BY b.name ASC
  `;

  db.query(sql, [patientIds], (err, rows) => {
    if (err) {
      if (isJoinTableMissing(err)) {
        return callback(null, new Map());
      }
      return callback(err);
    }

    const map = new Map();
    rows.forEach((row) => {
      if (!map.has(row.patient_id)) {
        map.set(row.patient_id, []);
      }
      map.get(row.patient_id).push({
        id: row.branch_id,
        name: row.branch_name,
        code: row.branch_code,
      });
    });

    return callback(null, map);
  });
};

const attachBranchesForPatients = (patients, callback) => {
  if (!patients.length) {
    return callback(null, patients);
  }

  const patientIds = patients.map((patient) => patient.id);
  fetchPatientBranchesByPatientIds(patientIds, (err, branchMap) => {
    if (err) {
      return callback(err);
    }

    const enriched = patients.map((patient) => {
      const branches = branchMap.get(patient.id) || [];
      return {
        ...patient,
        branch_ids: branches.map((branch) => branch.id),
        branches,
        branch_names: branches.map((branch) => branch.name).join(", "),
      };
    });

    return callback(null, enriched);
  });
};

const syncPatientBranches = (patientId, rawBranchIds, callback) => {
  const branchIds = normalizeBranchIds(rawBranchIds);
  const deleteSql = "DELETE FROM patient_branch WHERE patient_id = ?";

  const finishInsert = () => {
    if (!branchIds.length) {
      return callback(null, []);
    }

    const insertSql = `
      INSERT INTO patient_branch (patient_id, branch_id, created_at, updated_at)
      VALUES ?
    `;
    const values = branchIds.map((branchId) => [patientId, branchId, new Date(), new Date()]);

    db.query(insertSql, [values], (insertErr) => {
      if (insertErr) {
        if (isJoinTableMissing(insertErr)) {
          return callback({
            statusCode: 500,
            message: "patient_branch table not found. Please run migration.",
          });
        }

        return callback({
          statusCode: 500,
          message: insertErr.message,
        });
      }

      return callback(null, branchIds);
    });
  };

  const verifySql = "SELECT id FROM branch WHERE id IN (?) AND deleted_at IS NULL";
  if (branchIds.length) {
    db.query(verifySql, [branchIds], (verifyErr, rows) => {
      if (verifyErr) {
        return callback({ statusCode: 500, message: verifyErr.message });
      }

      if (rows.length !== branchIds.length) {
        return callback({
          statusCode: 400,
          message: "One or more branches are invalid or inactive",
        });
      }

      db.query(deleteSql, [patientId], (deleteErr) => {
        if (deleteErr) {
          if (isJoinTableMissing(deleteErr)) {
            return callback({
              statusCode: 500,
              message: "patient_branch table not found. Please run migration.",
            });
          }

          return callback({
            statusCode: 500,
            message: deleteErr.message,
          });
        }

        finishInsert();
      });
    });
    return;
  }

  db.query(deleteSql, [patientId], (deleteErr) => {
    if (deleteErr) {
      if (isJoinTableMissing(deleteErr)) {
        return callback({
          statusCode: 500,
          message: "patient_branch table not found. Please run migration.",
        });
      }

      return callback({
        statusCode: 500,
        message: deleteErr.message,
      });
    }

    return callback(null, []);
  });
};

const fetchPatientBaseById = (id, callback) => {
  const sql = `
    SELECT
      p.*,
      u.username,
      u.status as user_status
    FROM patient p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      return callback(err);
    }

    if (!rows.length) {
      return callback(null, null);
    }

    return callback(null, rows[0]);
  });
};

// Get all patients with user info
const getAllPatients = (req, res) => {
  const sql = `
    SELECT
      p.*,
      u.username,
      u.status as user_status
    FROM patient p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.deleted_at IS NULL
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

    attachBranchesForPatients(results, (branchErr, withBranches) => {
      if (branchErr) {
        return res.status(500).json({
          message: "Database error",
          error: branchErr.message,
        });
      }

      return res.json({
        message: "Patients fetched successfully",
        data: withBranches,
      });
    });
  });
};

// Get patient by ID
const getPatientById = (req, res) => {
  const { id } = req.params;

  fetchPatientBaseById(id, (err, patient) => {
    if (err) {
      console.error("Get patient by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    attachBranchesForPatients([patient], (branchErr, withBranches) => {
      if (branchErr) {
        return res.status(500).json({
          message: "Database error",
          error: branchErr.message,
        });
      }

      return res.json({
        message: "Patient fetched successfully",
        data: withBranches[0],
      });
    });
  });
};

const getNextPatientCode = (req, res) => {
  generateMedicalCode("patient", (err, code) => {
    if (err) {
      console.error("Generate next patient code error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    return res.json({ message: "Next patient code generated successfully", data: { code } });
  });
};

// Create patient
const createPatient = (req, res) => {
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
    branch_ids,
  } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({
      message: "Full name and phone are required",
    });
  }

  generateMedicalCode("patient", (codeErr, patient_code) => {
    if (codeErr) {
      console.error("Generate patient code error:", codeErr);
      return res.status(500).json({
        message: "Database error",
        error: codeErr.message,
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
          if (insertErr.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Patient code already exists" });
          }
          console.error("Create patient error:", insertErr);
          return res.status(500).json({
            message: "Failed to create patient",
            error: insertErr.message,
          });
        }

        syncPatientBranches(insertResults.insertId, branch_ids, (branchErr, assignedBranchIds) => {
          if (branchErr) {
            return res.status(branchErr.statusCode || 500).json({
              message: branchErr.message || "Failed to assign patient branches",
            });
          }

          return res.status(201).json({
            message: "Patient created successfully",
            data: {
              id: insertResults.insertId,
              patient_code,
              full_name,
              phone,
              branch_ids: assignedBranchIds,
            },
          });
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
    branch_ids,
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

      syncPatientBranches(Number(id), branch_ids, (branchErr) => {
        if (branchErr) {
          return res.status(branchErr.statusCode || 500).json({
            message: branchErr.message || "Failed to update patient branches",
          });
        }

        return res.json({
          message: "Patient updated successfully",
        });
      });
    }
  );
};

// Delete patient (soft delete)
const deletePatient = (req, res) => {
  const { id } = req.params;

  const deleteSql = `
    UPDATE patient
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
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

    db.query("UPDATE patient_branch SET deleted_at = NOW() WHERE patient_id = ? AND deleted_at IS NULL", [id], () => {
      return res.json({
        message: "Patient deleted successfully",
      });
    });
  });
};

// Get current authenticated user's patient profile
const getMyProfile = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      p.*,
      u.username,
      u.email as user_email,
      u.status as user_status
    FROM patient p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ? AND (p.status != 'blocked' OR p.status IS NULL)
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Get my profile error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    attachBranchesForPatients([results[0]], (branchErr, withBranches) => {
      if (branchErr) {
        return res.status(500).json({
          message: "Database error",
          error: branchErr.message,
        });
      }

      return res.json({
        message: "Patient profile fetched successfully",
        data: withBranches[0],
      });
    });
  });
};

// Update current authenticated user's patient profile
const updateMyProfile = (req, res) => {
  const userId = req.user.id;
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
  } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({
      message: "Full name and phone are required",
    });
  }

  const getPatientSql = `
    SELECT id FROM patient
    WHERE user_id = ? AND (status != 'blocked' OR status IS NULL)
    LIMIT 1
  `;

  db.query(getPatientSql, [userId], (getErr, getResults) => {
    if (getErr) {
      console.error("Get patient error:", getErr);
      return res.status(500).json({
        message: "Database error",
        error: getErr.message,
      });
    }

    if (!getResults.length) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const patientId = getResults[0].id;

    const updateSql = `
      UPDATE patient
      SET
        full_name = ?,
        phone = ?,
        email = ?,
        gender = ?,
        date_of_birth = ?,
        address = ?,
        blood_group = ?,
        allergies = ?,
        medical_history = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const updateValues = [
      full_name,
      phone,
      email || null,
      gender || null,
      date_of_birth || null,
      address || null,
      blood_group || null,
      allergies || null,
      medical_history || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      patientId,
    ];

    db.query(updateSql, updateValues, (updateErr, updateResults) => {
      if (updateErr) {
        console.error("Update my profile error:", updateErr);
        return res.status(500).json({
          message: "Database error",
          error: updateErr.message,
        });
      }

      if (updateResults.affectedRows === 0) {
        return res.status(500).json({
          message: "Failed to update profile",
        });
      }

      return res.json({
        message: "Patient profile updated successfully",
      });
    });
  });
};

const getPatientsByOwnerBranches = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const branchRows = await queryAsync(
      "SELECT id FROM branch WHERE owner_user_id = ? AND deleted_at IS NULL",
      [userId]
    );

    if (!branchRows.length) {
      return res.json({ message: "No patients found", data: [] });
    }

    const branchIds = branchRows.map((r) => r.id);

    const patientRows = await queryAsync(
      `SELECT DISTINCT
          p.id, p.patient_code, p.full_name, p.phone, p.email,
          p.gender, p.date_of_birth, p.blood_group, p.status,
          p.created_at
       FROM patient p
       INNER JOIN patient_branch pb ON pb.patient_id = p.id AND pb.deleted_at IS NULL
       WHERE pb.branch_id IN (?)
         AND p.status != 'blocked'
       ORDER BY p.full_name ASC`,
      [branchIds]
    );

    if (!patientRows.length) {
      return res.json({ message: "No patients found", data: [] });
    }

    const patientIds = patientRows.map((r) => r.id);
    const branchMap = await new Promise((resolve, reject) => {
      fetchPatientBranchesByPatientIds(patientIds, (err, map) => {
        if (err) reject(err);
        else resolve(map);
      });
    });

    const data = patientRows.map((p) => {
      const branches = branchMap.get(p.id) || [];
      return {
        ...p,
        branch_ids: branches.map((b) => b.id),
        branch_names: branches.map((b) => b.name).join(", "),
        branches,
      };
    });

    return res.json({ message: "Patients fetched successfully", data });
  } catch (err) {
    console.error("getPatientsByOwnerBranches error:", err);
    if (isJoinTableMissing(err)) {
      return res.json({ message: "No patients found", data: [] });
    }
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

const getMyStats = async (req, res) => {
  const userId = req.user.id;

  try {
    console.log("getMyStats: Fetching stats for userId:", userId);
    
    // Lấy patient_id từ user_id
    const patientRows = await queryAsync(
      "SELECT id FROM patient WHERE user_id = ? LIMIT 1",
      [userId]
    );

    console.log("patientRows:", patientRows);

    if (!patientRows.length) {
      console.log("No patient record found for userId:", userId);
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const patientId = patientRows[0].id;
    console.log("patientId:", patientId);

    // Đếm số lịch hẹn sắp tới (confirmed, pending)
    const appointmentCountSql = `
      SELECT COUNT(*) AS count 
      FROM appointment 
      WHERE patient_id = ? 
        AND status IN ('confirmed', 'pending')
        AND appointment_date >= CURDATE()
    `;
    const apptRes = await queryAsync(appointmentCountSql, [patientId]);
    console.log("apptRes:", apptRes);

    // Đếm số ca tư vấn đã hoàn thành
    const consultationCountSql = `
      SELECT COUNT(*) AS count 
      FROM consultation 
      WHERE patient_id = ? 
        AND status = 'completed'
    `;
    const consRes = await queryAsync(consultationCountSql, [patientId]);
    console.log("consRes:", consRes);

    return res.json({
      message: "Stats fetched successfully",
      data: {
        upcomingAppointments: apptRes[0].count,
        pastConsultations: consRes[0].count,
      },
    });
  } catch (err) {
    console.error("Get my stats error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

// GET /patients/me/doctors — doctors the patient has interacted with via appointments or consultations
const getMyDoctors = async (req, res) => {
  const userId = req.user.id;
  try {
    const patientRows = await queryAsync(
      "SELECT id FROM patient WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!patientRows.length) {
      return res.status(404).json({ message: "Patient profile not found" });
    }
    const patientId = patientRows[0].id;

    // Doctors from appointments
    const apptDoctors = await queryAsync(
      `SELECT
         d.id,
         d.full_name,
         d.avatar_url,
         s.name AS specialty_name,
         COUNT(a.id) AS appointment_count,
         MAX(a.appointment_date) AS last_appointment_date
       FROM appointment a
       JOIN doctor d ON a.doctor_id = d.id
       LEFT JOIN specialty s ON d.specialty_id = s.id
       WHERE a.patient_id = ?
       GROUP BY d.id, d.full_name, d.avatar_url, s.name
       ORDER BY last_appointment_date DESC`,
      [patientId]
    );

    // Doctors from consultations
    const consDoctors = await queryAsync(
      `SELECT
         d.id,
         d.full_name,
         d.avatar_url,
         s.name AS specialty_name,
         COUNT(c.id) AS consultation_count,
         MAX(c.created_at) AS last_consultation_date
       FROM consultation c
       JOIN doctor d ON c.doctor_id = d.id
       LEFT JOIN specialty s ON d.specialty_id = s.id
       WHERE c.patient_id = ? AND c.doctor_id IS NOT NULL
       GROUP BY d.id, d.full_name, d.avatar_url, s.name
       ORDER BY last_consultation_date DESC`,
      [patientId]
    );

    return res.json({
      message: "My doctors fetched successfully",
      data: {
        appointments: apptDoctors,
        consultations: consDoctors,
      },
    });
  } catch (err) {
    console.error("getMyDoctors error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

// GET /patients/me/branches — branches (via doctor_branch) the patient has interacted with
const getMyBranches = async (req, res) => {
  const userId = req.user.id;
  try {
    const patientRows = await queryAsync(
      "SELECT id FROM patient WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!patientRows.length) {
      return res.status(404).json({ message: "Patient profile not found" });
    }
    const patientId = patientRows[0].id;

    // Branches of doctors the patient had appointments with
    const apptBranches = await queryAsync(
      `SELECT
         b.id,
         b.name,
         b.city,
         b.address,
         b.phone,
         b.email,
         COUNT(DISTINCT a.id) AS appointment_count,
         MAX(a.appointment_date) AS last_appointment_date
       FROM appointment a
       JOIN doctor_branch db ON a.doctor_id = db.doctor_id
       JOIN branch b ON db.branch_id = b.id
       WHERE a.patient_id = ?
         AND (db.deleted_at IS NULL)
         AND b.deleted_at IS NULL
       GROUP BY b.id, b.name, b.city, b.address, b.phone, b.email
       ORDER BY last_appointment_date DESC`,
      [patientId]
    );

    // Branches of doctors the patient had consultations with
    const consBranches = await queryAsync(
      `SELECT
         b.id,
         b.name,
         b.city,
         b.address,
         b.phone,
         b.email,
         COUNT(DISTINCT c.id) AS consultation_count,
         MAX(c.created_at) AS last_consultation_date
       FROM consultation c
       JOIN doctor_branch db ON c.doctor_id = db.doctor_id
       JOIN branch b ON db.branch_id = b.id
       WHERE c.patient_id = ?
         AND c.doctor_id IS NOT NULL
         AND (db.deleted_at IS NULL)
         AND b.deleted_at IS NULL
       GROUP BY b.id, b.name, b.city, b.address, b.phone, b.email
       ORDER BY last_consultation_date DESC`,
      [patientId]
    );

    return res.json({
      message: "My branches fetched successfully",
      data: {
        appointments: apptBranches,
        consultations: consBranches,
      },
    });
  } catch (err) {
    console.error("getMyBranches error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getNextPatientCode,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
  getPatientsByOwnerBranches,
  getMyStats,
  getMyDoctors,
  getMyBranches,
};
