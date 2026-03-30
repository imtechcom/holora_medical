const db = require("../config/db");
const bcrypt = require("bcryptjs");

const isJoinTableMissing = (err) => err?.code === "ER_NO_SUCH_TABLE";

const normalizeBranchIds = (branchIds) => {
  if (!Array.isArray(branchIds)) return [];

  const normalized = branchIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const fetchDoctorBranchesByDoctorIds = (doctorIds, callback) => {
  if (!doctorIds.length) {
    return callback(null, new Map());
  }

  const sql = `
    SELECT
      db.doctor_id,
      b.id AS branch_id,
      b.name AS branch_name,
      b.code AS branch_code
    FROM doctor_branch db
    INNER JOIN branch b ON b.id = db.branch_id
    WHERE db.deleted_at IS NULL
      AND b.deleted_at IS NULL
      AND db.doctor_id IN (?)
    ORDER BY b.name ASC
  `;

  db.query(sql, [doctorIds], (err, rows) => {
    if (err) {
      if (isJoinTableMissing(err)) {
        return callback(null, new Map());
      }
      return callback(err);
    }

    const map = new Map();
    rows.forEach((row) => {
      if (!map.has(row.doctor_id)) {
        map.set(row.doctor_id, []);
      }
      map.get(row.doctor_id).push({
        id: row.branch_id,
        name: row.branch_name,
        code: row.branch_code,
      });
    });

    return callback(null, map);
  });
};

const attachBranchesForDoctors = (doctors, callback) => {
  if (!doctors.length) {
    return callback(null, doctors);
  }

  const doctorIds = doctors.map((doctor) => doctor.id);
  fetchDoctorBranchesByDoctorIds(doctorIds, (err, branchMap) => {
    if (err) {
      return callback(err);
    }

    const enriched = doctors.map((doctor) => {
      const branches = branchMap.get(doctor.id) || [];
      return {
        ...doctor,
        branch_ids: branches.map((branch) => branch.id),
        branches,
        branch_names: branches.map((branch) => branch.name).join(", "),
      };
    });

    return callback(null, enriched);
  });
};

const fetchDoctorBaseById = (id, callback) => {
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

const syncDoctorBranches = (doctorId, rawBranchIds, callback) => {
  const branchIds = normalizeBranchIds(rawBranchIds);

  const deleteSql = "DELETE FROM doctor_branch WHERE doctor_id = ?";

  const handleInsert = () => {
    if (!branchIds.length) {
      return callback(null, []);
    }

    const insertSql = `
      INSERT INTO doctor_branch (doctor_id, branch_id, created_at, updated_at)
      VALUES ?
    `;

    const values = branchIds.map((branchId) => [doctorId, branchId, new Date(), new Date()]);

    db.query(insertSql, [values], (insertErr) => {
      if (insertErr) {
        if (isJoinTableMissing(insertErr)) {
          return callback({
            statusCode: 500,
            message: "doctor_branch table not found. Please run migration.",
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

  if (!branchIds.length) {
    db.query(deleteSql, [doctorId], (deleteErr) => {
      if (deleteErr) {
        if (isJoinTableMissing(deleteErr)) {
          return callback({
            statusCode: 500,
            message: "doctor_branch table not found. Please run migration.",
          });
        }

        return callback({
          statusCode: 500,
          message: deleteErr.message,
        });
      }

      return callback(null, []);
    });
    return;
  }

  const verifySql = "SELECT id FROM branch WHERE id IN (?) AND deleted_at IS NULL";
  db.query(verifySql, [branchIds], (verifyErr, rows) => {
    if (verifyErr) {
      return callback({
        statusCode: 500,
        message: verifyErr.message,
      });
    }

    if (rows.length !== branchIds.length) {
      return callback({
        statusCode: 400,
        message: "One or more branches are invalid or inactive",
      });
    }

    db.query(deleteSql, [doctorId], (deleteErr) => {
      if (deleteErr) {
        if (isJoinTableMissing(deleteErr)) {
          return callback({
            statusCode: 500,
            message: "doctor_branch table not found. Please run migration.",
          });
        }

        return callback({
          statusCode: 500,
          message: deleteErr.message,
        });
      }

      handleInsert();
    });
  });
};

const buildDoctorCreatedResponse = (doctor, branchIds) => ({
  ...doctor,
  branch_ids: branchIds,
  branches: [],
  branch_names: "",
});

const createDoctorRecord = (
  res,
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
  user_id,
  branch_ids
) => {
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

    const generateCodeSql = "SELECT MAX(CAST(SUBSTRING(doctor_code, 7) AS UNSIGNED)) as maxId FROM doctor WHERE doctor_code LIKE 'DOCTOR%'";
    db.query(generateCodeSql, (codeErr, codeResults) => {
      if (codeErr) {
        console.error("Generate code error:", codeErr);
        return res.status(500).json({
          message: "Database error",
          error: codeErr.message,
        });
      }

      const nextId = (codeResults[0]?.maxId || 0) + 1;
      const doctor_code = `DOCTOR${String(nextId).padStart(6, "0")}`;

      const insertSql = `
        INSERT INTO doctor (user_id, specialty_id, doctor_code, full_name, phone, email, license_number, qualification, experience_years, consultation_fee, bio, avatar_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const insertValues = [
        user_id,
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

      db.query(insertSql, insertValues, (insertErr, result) => {
        if (insertErr) {
          console.error("Create doctor SQL error:", insertErr.message);
          return res.status(500).json({
            message: "Database error",
            error: insertErr.message,
          });
        }

        syncDoctorBranches(result.insertId, branch_ids, (branchErr, assignedBranchIds) => {
          if (branchErr) {
            return res.status(branchErr.statusCode || 500).json({
              message: branchErr.message || "Failed to assign doctor branches",
            });
          }

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
            data: buildDoctorCreatedResponse(newDoctor, assignedBranchIds),
          });
        });
      });
    });
  });
};

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

    attachBranchesForDoctors(results, (branchErr, doctorsWithBranches) => {
      if (branchErr) {
        console.error("Attach branches error:", branchErr);
        return res.status(500).json({
          message: "Database error",
          error: branchErr.message,
        });
      }

      return res.json({
        message: "Doctors fetched successfully",
        data: doctorsWithBranches,
      });
    });
  });
};

// Get doctor by ID
const getDoctorById = (req, res) => {
  const { id } = req.params;

  fetchDoctorBaseById(id, (err, doctor) => {
    if (err) {
      console.error("Get doctor by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    attachBranchesForDoctors([doctor], (branchErr, doctorsWithBranches) => {
      if (branchErr) {
        console.error("Attach doctor branches error:", branchErr);
        return res.status(500).json({
          message: "Database error",
          error: branchErr.message,
        });
      }

      return res.json({
        message: "Doctor fetched successfully",
        data: doctorsWithBranches[0],
      });
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
    username,
    password,
    branch_ids,
  } = req.body;

  if (!full_name || !phone || !license_number || !specialty_id) {
    return res.status(400).json({
      message: "Full name, phone, license number, and specialty are required",
    });
  }

  if (!user_id && username && password) {
    if (!username || !password || password.length < 6) {
      return res.status(400).json({
        message: "Username and password (min 6 chars) are required for new doctor accounts",
      });
    }

    const checkUsernameSql = `
      SELECT id FROM users
      WHERE username = ? AND deleted_at IS NULL
      LIMIT 1
    `;

    db.query(checkUsernameSql, [username], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Check username error:", checkErr);
        return res.status(500).json({
          message: "Database error",
          error: checkErr.message,
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const insertUserSql = `
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
        VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `;

      db.query(
        insertUserSql,
        [full_name, username, email || null, password_hash, phone],
        (insertUserErr, userResult) => {
          if (insertUserErr) {
            console.error("Create user error:", insertUserErr);
            return res.status(500).json({
              message: "Failed to create user account",
              error: insertUserErr.message,
            });
          }

          const newUserId = userResult.insertId;

          const getDoctorRoleSql = `
            SELECT id FROM role
            WHERE code = 'doctor' AND status = 'active'
            LIMIT 1
          `;

          db.query(getDoctorRoleSql, (roleErr, roleResults) => {
            if (roleErr) {
              console.error("Get doctor role error:", roleErr);
              return res.status(500).json({
                message: "Failed to assign doctor role",
                error: roleErr.message,
              });
            }

            if (!roleResults.length) {
              return res.status(500).json({
                message: "Doctor role not found. Please seed role table first.",
              });
            }

            const doctorRoleId = roleResults[0].id;

            const insertUserRoleSql = `
              INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
              VALUES (?, ?, NOW(), NULL)
            `;

            db.query(insertUserRoleSql, [newUserId, doctorRoleId], (roleAssignErr) => {
              if (roleAssignErr) {
                console.error("Assign role error:", roleAssignErr);
                return res.status(500).json({
                  message: "Failed to assign doctor role",
                  error: roleAssignErr.message,
                });
              }

              createDoctorRecord(
                res,
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
                newUserId,
                branch_ids
              );
            });
          });
        }
      );
    });
  } else {
    createDoctorRecord(
      res,
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
      user_id || null,
      branch_ids
    );
  }
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
    branch_ids,
  } = req.body;

  if (!full_name || !phone || !license_number) {
    return res.status(400).json({
      message: "Full name, phone, and license number are required",
    });
  }

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
      (updateErr, result) => {
        if (updateErr) {
          console.error("Update doctor error:", updateErr);
          return res.status(500).json({
            message: "Database error",
            error: updateErr.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Doctor not found",
          });
        }

        syncDoctorBranches(Number(id), branch_ids, (branchErr) => {
          if (branchErr) {
            return res.status(branchErr.statusCode || 500).json({
              message: branchErr.message || "Failed to update doctor branches",
            });
          }

          fetchDoctorBaseById(id, (fetchErr, doctor) => {
            if (fetchErr) {
              return res.status(500).json({
                message: "Database error",
                error: fetchErr.message,
              });
            }

            if (!doctor) {
              return res.status(404).json({ message: "Doctor not found" });
            }

            attachBranchesForDoctors([doctor], (attachErr, doctorsWithBranches) => {
              if (attachErr) {
                return res.status(500).json({
                  message: "Database error",
                  error: attachErr.message,
                });
              }

              return res.json({
                message: "Doctor updated successfully",
                data: doctorsWithBranches[0],
              });
            });
          });
        });
      }
    );
  });
};

// Delete doctor (soft delete)
const deleteDoctor = (req, res) => {
  const { id } = req.params;

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

    const deleteSql = "UPDATE doctor SET status = 'deleted', updated_at = NOW() WHERE id = ?";
    db.query(deleteSql, [id], (deleteErr) => {
      if (deleteErr) {
        console.error("Delete doctor error:", deleteErr);
        return res.status(500).json({
          message: "Database error",
          error: deleteErr.message,
        });
      }

      db.query("DELETE FROM doctor_branch WHERE doctor_id = ?", [id], () => {
        return res.json({
          message: "Doctor deleted successfully",
          data: { id: parseInt(id, 10) },
        });
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
