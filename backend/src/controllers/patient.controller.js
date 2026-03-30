const db = require("../config/db");

const isJoinTableMissing = (err) => err?.code === "ER_NO_SUCH_TABLE";

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
    branch_ids,
  } = req.body;

  if (!patient_code || !full_name || !phone) {
    return res.status(400).json({
      message: "Patient code, full name, and phone are required",
    });
  }

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

    db.query("DELETE FROM patient_branch WHERE patient_id = ?", [id], () => {
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

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
};
