const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateMedicalCode } = require("../utils/medical-code.util");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });

const isJoinTableMissing = (err) => err?.code === "ER_NO_SUCH_TABLE";
const VALID_DOCTOR_STATUSES = new Set(["active", "inactive", "on_leave", "deleted"]);

const normalizeDoctorStatus = (status) =>
  VALID_DOCTOR_STATUSES.has(status) ? status : "active";

const normalizeBranchIds = (branchIds) => {
  if (!Array.isArray(branchIds)) return [];

  const normalized = branchIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const ensureLeafSpecialty = (specialtyId, callback) => {
  const parsedId = Number(specialtyId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    callback({ statusCode: 400, message: "Invalid specialty_id" });
    return;
  }

  const sql = `
    SELECT
      s.id,
      (
        SELECT COUNT(*)
        FROM specialty c
        WHERE c.parent_id = s.id
          AND c.deleted_at IS NULL
      ) AS child_count
    FROM specialty s
    WHERE s.id = ?
      AND s.deleted_at IS NULL
    LIMIT 1
  `;

  db.query(sql, [parsedId], (err, rows) => {
    if (err) {
      callback({ statusCode: 500, message: err.message });
      return;
    }

    if (!rows.length) {
      callback({ statusCode: 400, message: "Specialty not found or inactive" });
      return;
    }

    if (Number(rows[0].child_count || 0) > 0) {
      callback({
        statusCode: 400,
        message: "Doctors can only be assigned to leaf specialties",
      });
      return;
    }

    callback(null);
  });
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

const buildUsernameCandidate = (email, fullName, licenseNumber) => {
  const raw =
    (email ? email.split("@")[0] : "") ||
    (fullName || "").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    (licenseNumber || "").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "doctor";

  return raw.slice(0, 20) || "doctor";
};

const ensureUniqueUsername = async (baseUsername) => {
  for (let i = 0; i < 8; i += 1) {
    const suffix = i === 0 ? "" : `_${Date.now().toString().slice(-4)}${i}`;
    const candidate = `${baseUsername}${suffix}`.slice(0, 30);

    const existing = await queryAsync(
      `
        SELECT id FROM users
        WHERE username = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [candidate]
    );

    if (!existing.length) {
      return candidate;
    }
  }

  return `doctor_${Date.now().toString().slice(-8)}`;
};

const createDoctorInvite = async ({ userId, doctorId, email, createdByUserId, redirectBaseUrl }) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await queryAsync(
    `
      UPDATE doctor_invite
      SET revoked_at = NOW(), updated_at = NOW()
      WHERE user_id = ?
        AND used_at IS NULL
        AND revoked_at IS NULL
    `,
    [userId]
  );

  await queryAsync(
    `
      INSERT INTO doctor_invite (
        user_id,
        doctor_id,
        email,
        token_hash,
        expires_at,
        used_at,
        revoked_at,
        created_by_user_id,
        created_at,
        updated_at
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        DATE_ADD(NOW(), INTERVAL 72 HOUR),
        NULL,
        NULL,
        ?,
        NOW(),
        NOW()
      )
    `,
    [userId, doctorId, email, tokenHash, createdByUserId || null]
  );

  const normalizedBase = (redirectBaseUrl || process.env.DOCTOR_INVITE_REDIRECT_URL || "http://localhost:5173/doctor/invite-setup").replace(/\/$/, "");
  return `${normalizedBase}?token=${token}`;
};

const getNextDoctorCode = (req, res) => {
  generateMedicalCode("doctor", (err, code) => {
    if (err) {
      console.error("Generate next doctor code error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    return res.json({ message: "Next doctor code generated successfully", data: { code } });
  });
};

const createDoctorRecord = (
  res,
  created_by_user_id,
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
  branch_ids,
  onCreated = null
) => {
  const normalizedStatus = normalizeDoctorStatus(status);
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

    generateMedicalCode("doctor", (codeErr, doctor_code) => {
      if (codeErr) {
        console.error("Generate code error:", codeErr);
        return res.status(500).json({
          message: "Database error",
          error: codeErr.message,
        });
      }

      const insertSql = `
        INSERT INTO doctor (user_id, created_by_user_id, specialty_id, doctor_code, full_name, phone, email, license_number, qualification, experience_years, consultation_fee, bio, avatar_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const insertValues = [
        user_id,
        created_by_user_id,
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
        normalizedStatus,
      ];

      db.query(insertSql, insertValues, (insertErr, result) => {
        if (insertErr) {
          if (insertErr.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Doctor code already exists" });
          }
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
            status: normalizedStatus,
            created_at: new Date(),
            updated_at: new Date(),
          };

          const createdPayload = buildDoctorCreatedResponse(newDoctor, assignedBranchIds);

          if (typeof onCreated === "function") {
            return onCreated(null, createdPayload);
          }

          return res.status(201).json({
            message: "Doctor created successfully",
            data: createdPayload,
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

const searchDoctors = async (req, res) => {
  const {
    q = "",
    specialty_id,
    branch_id,
    status,
    page = "1",
    limit = "20",
  } = req.query;

  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = ["d.status <> 'deleted'"];
  const params = [];

  if (status) {
    where.push("d.status = ?");
    params.push(status);
  }

  const keyword = `${q || ""}`.trim();
  if (keyword) {
    const like = `%${keyword}%`;
    where.push("(d.full_name LIKE ? OR d.doctor_code LIKE ? OR s.name LIKE ?)");
    params.push(like, like, like);
  }

  const specialtyId = Number.parseInt(specialty_id, 10);
  if (Number.isInteger(specialtyId) && specialtyId > 0) {
    where.push("d.specialty_id = ?");
    params.push(specialtyId);
  }

  const branchId = Number.parseInt(branch_id, 10);
  if (Number.isInteger(branchId) && branchId > 0) {
    where.push(`EXISTS (
      SELECT 1
      FROM doctor_branch dbf
      INNER JOIN branch bf ON bf.id = dbf.branch_id
      WHERE dbf.doctor_id = d.id
        AND dbf.deleted_at IS NULL
        AND bf.deleted_at IS NULL
        AND dbf.branch_id = ?
    )`);
    params.push(branchId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const countRows = await queryAsync(
      `
        SELECT COUNT(*) AS total
        FROM doctor d
        LEFT JOIN specialty s ON d.specialty_id = s.id
        ${whereSql}
      `,
      params
    );

    const total = Number(countRows?.[0]?.total || 0);
    if (total === 0) {
      return res.json({
        message: "No doctors found",
        data: [],
        meta: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    const rows = await queryAsync(
      `
        SELECT
          d.*,
          u.username,
          u.email as user_email,
          s.name as specialty_name
        FROM doctor d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN specialty s ON d.specialty_id = s.id
        ${whereSql}
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, parsedLimit, offset]
    );

    const doctorsWithBranches = await new Promise((resolve, reject) => {
      attachBranchesForDoctors(rows, (branchErr, enriched) => {
        if (branchErr) reject(branchErr);
        else resolve(enriched);
      });
    });

    const totalPages = Math.ceil(total / parsedLimit);
    return res.json({
      message: "Doctors fetched successfully",
      data: doctorsWithBranches,
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
        hasMore: parsedPage < totalPages,
      },
    });
  } catch (err) {
    console.error("Search doctors error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
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
  const createdByUserId = req.user?.id || null;
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
    account_mode,
    invite_redirect_base,
  } = req.body;

  const accountMode = account_mode === "invite" ? "invite" : "manual";
  const normalizedStatus = normalizeDoctorStatus(status);

  if (!full_name || !phone || !license_number || !specialty_id) {
    return res.status(400).json({
      message: "Full name, phone, license number, and specialty are required",
    });
  }

  const runCreateFlow = () => {

  if (accountMode === "invite") {
    if (!email) {
      return res.status(400).json({
        message: "Email is required for invite mode",
      });
    }

    const runInviteFlow = async () => {
      try {
        const existingEmail = await queryAsync(
          `
            SELECT id
            FROM users
            WHERE email = ?
              AND deleted_at IS NULL
            LIMIT 1
          `,
          [email]
        );

        if (existingEmail.length) {
          return res.status(409).json({
            message: "Email already exists",
          });
        }

        const baseUsername = buildUsernameCandidate(email, full_name, license_number);
        const generatedUsername = await ensureUniqueUsername(baseUsername);
        const randomPassword = `invited_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        const userResult = await queryAsync(
          `
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
          `,
          [full_name, generatedUsername, email, passwordHash, phone]
        );

        const newUserId = userResult.insertId;
        const doctorRoleRows = await queryAsync(
          `
            SELECT id FROM role
            WHERE code = 'doctor' AND status = 'active'
            LIMIT 1
          `
        );

        if (!doctorRoleRows.length) {
          return res.status(500).json({
            message: "Doctor role not found. Please seed role table first.",
          });
        }

        await queryAsync(
          `
            INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
            VALUES (?, ?, NOW(), ?)
          `,
          [newUserId, doctorRoleRows[0].id, createdByUserId || null]
        );

        createDoctorRecord(
          res,
          createdByUserId,
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
          branch_ids,
          async (doctorErr, createdDoctor) => {
            if (doctorErr) {
              return res.status(500).json({ message: "Failed to create doctor profile" });
            }

            try {
              const inviteSetupUrl = await createDoctorInvite({
                userId: newUserId,
                doctorId: createdDoctor.id,
                email,
                createdByUserId,
                redirectBaseUrl: invite_redirect_base,
              });

              return res.status(201).json({
                message: "Doctor invited successfully",
                data: {
                  ...createdDoctor,
                  invite_setup_url: inviteSetupUrl,
                  invite_email: email,
                  account_mode: "invite",
                },
              });
            } catch (inviteErr) {
              console.error("Create doctor invite error:", inviteErr);
              return res.status(500).json({
                message: "Doctor created but invite generation failed",
                error: inviteErr.message,
              });
            }
          }
        );
      } catch (err) {
        console.error("Create doctor invite flow error:", err);
        return res.status(500).json({
          message: "Failed to invite doctor",
          error: err.message,
        });
      }
    };

    runInviteFlow();
    return;
  }

  if (!user_id && username && password) {
    if (!email) {
      return res.status(400).json({
        message: "Email is required when creating a new doctor login",
      });
    }

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
                createdByUserId,
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
                normalizedStatus,
                newUserId,
                branch_ids
              );
            });
          });
        }
      );
    });
  } else {
    if (!user_id && (!username || !password)) {
      return res.status(400).json({
        message: "Provide user_id, or username/password, or use invite mode",
      });
    }

    createDoctorRecord(
      res,
      createdByUserId,
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
      normalizedStatus,
      user_id || null,
      branch_ids
    );
  }
  };

  ensureLeafSpecialty(specialty_id, (specialtyErr) => {
    if (specialtyErr) {
      return res.status(specialtyErr.statusCode || 500).json({
        message: specialtyErr.message,
      });
    }

    return runCreateFlow();
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
    branch_ids,
  } = req.body;
  const normalizedStatus = normalizeDoctorStatus(status);

  if (!full_name || !phone || !license_number) {
    return res.status(400).json({
      message: "Full name, phone, and license number are required",
    });
  }

  ensureLeafSpecialty(specialty_id, (specialtyErr) => {
    if (specialtyErr) {
      return res.status(specialtyErr.statusCode || 500).json({
        message: specialtyErr.message,
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
        normalizedStatus,
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

// Get doctors in branches owned by authenticated clinic_owner
const getDoctorsByOwnerBranches = async (req, res) => {
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
      return res.json({ message: "No doctors found", data: [] });
    }

    const branchIds = branchRows.map((r) => r.id);

    const doctorRows = await queryAsync(
      `SELECT DISTINCT
          d.id, d.user_id, d.full_name, d.phone, d.email,
          d.license_number, d.qualification, d.experience_years,
          d.consultation_fee, d.bio, d.avatar_url, d.status,
          s.name AS specialty_name,
          d.specialty_id
       FROM doctor d
       LEFT JOIN specialty s ON s.id = d.specialty_id AND s.deleted_at IS NULL
       INNER JOIN doctor_branch db ON db.doctor_id = d.id AND db.deleted_at IS NULL
       WHERE db.branch_id IN (?)
         AND d.status <> 'deleted'
       ORDER BY d.full_name ASC`,
      [branchIds]
    );

    if (!doctorRows.length) {
      return res.json({ message: "No doctors found", data: [] });
    }

    const doctorIds = doctorRows.map((r) => r.id);
    const branchMap = await new Promise((resolve, reject) => {
      fetchDoctorBranchesByDoctorIds(doctorIds, (err, map) => {
        if (err) reject(err);
        else resolve(map);
      });
    });

    const data = doctorRows.map((d) => {
      const branches = branchMap.get(d.id) || [];
      return {
        ...d,
        branch_ids: branches.map((b) => b.id),
        branch_names: branches.map((b) => b.name).join(", "),
        branches,
      };
    });

    return res.json({ message: "Doctors fetched successfully", data });
  } catch (err) {
    console.error("getDoctorsByOwnerBranches error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Get current authenticated doctor's profile
const getMyProfile = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

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
    WHERE d.user_id = ? AND d.status <> 'deleted'
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Get my doctor profile error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    attachBranchesForDoctors([results[0]], (branchErr, withBranches) => {
      if (branchErr) {
        return res.status(500).json({
          message: "Database error",
          error: branchErr.message,
        });
      }

      return res.json({
        message: "Doctor profile fetched successfully",
        data: withBranches[0],
      });
    });
  });
};

// Update current authenticated doctor's profile
const updateMyProfile = (req, res) => {
  const userId = req.user?.id;
  const {
    full_name,
    phone,
    email,
    license_number,
    qualification,
    experience_years,
    consultation_fee,
    bio,
    avatar_url,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!full_name || !phone) {
    return res.status(400).json({
      message: "Full name and phone are required",
    });
  }

  const getDoctorSql = `
    SELECT id
    FROM doctor
    WHERE user_id = ? AND status <> 'deleted'
    LIMIT 1
  `;

  db.query(getDoctorSql, [userId], (getErr, getRows) => {
    if (getErr) {
      console.error("Get doctor profile for update error:", getErr);
      return res.status(500).json({
        message: "Database error",
        error: getErr.message,
      });
    }

    if (!getRows.length) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    const doctorId = getRows[0].id;
    const safeExperienceYears = Number.isFinite(Number(experience_years))
      ? Math.max(0, Number(experience_years))
      : 0;
    const safeConsultationFee = Number.isFinite(Number(consultation_fee))
      ? Math.max(0, Number(consultation_fee))
      : 0;

    const updateSql = `
      UPDATE doctor
      SET
        full_name = ?,
        phone = ?,
        email = ?,
        license_number = ?,
        qualification = ?,
        experience_years = ?,
        consultation_fee = ?,
        bio = ?,
        avatar_url = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      full_name,
      phone,
      email || null,
      license_number || null,
      qualification || null,
      safeExperienceYears,
      safeConsultationFee,
      bio || null,
      avatar_url || null,
      doctorId,
    ];

    db.query(updateSql, values, (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Update my doctor profile error:", updateErr);
        return res.status(500).json({
          message: "Database error",
          error: updateErr.message,
        });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(500).json({
          message: "Failed to update doctor profile",
        });
      }

      return res.json({
        message: "Doctor profile updated successfully",
      });
    });
  });
};

// Get all unique patients for the current authenticated doctor
const getMyPatients = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Find doctor_id from user_id
    const doctorRows = await queryAsync(
      "SELECT id FROM doctor WHERE user_id = ? AND status <> 'deleted' LIMIT 1",
      [userId]
    );

    if (!doctorRows.length) {
      return res.json({ message: "No patients found", data: [] });
    }

    const doctorId = doctorRows[0].id;

    // Get unique patients from both appointments and consultations
    const sql = `
      SELECT DISTINCT
        p.id,
        p.patient_code,
        p.full_name,
        p.phone,
        p.email,
        p.gender,
        p.date_of_birth,
        p.blood_group,
        p.status,
        p.created_at,
        (
          SELECT COUNT(*)
          FROM appointment a
          WHERE a.patient_id = p.id AND a.doctor_id = ? AND a.status IN ('completed', 'confirmed', 'in_progress')
        ) as appointment_count,
        (
          SELECT COUNT(*)
          FROM consultation c
          WHERE c.patient_id = p.id AND c.doctor_id = ? AND c.status IN ('completed', 'in_progress', 'pending')
        ) as consultation_count,
        (
          SELECT MAX(a.appointment_date)
          FROM appointment a
          WHERE a.patient_id = p.id AND a.doctor_id = ?
        ) as last_appointment_date
      FROM patient p
      WHERE (
        p.id IN (
          SELECT DISTINCT patient_id
          FROM appointment
          WHERE doctor_id = ? AND status IN ('completed', 'confirmed', 'in_progress', 'scheduled')
        )
        OR
        p.id IN (
          SELECT DISTINCT patient_id
          FROM consultation
          WHERE doctor_id = ? AND status IN ('pending', 'in_progress', 'completed')
        )
      )
      ORDER BY p.full_name ASC
    `;

    const params = [doctorId, doctorId, doctorId, doctorId, doctorId];
    const patients = await queryAsync(sql, params);

    return res.json({
      message: "Patients fetched successfully",
      data: patients,
    });
  } catch (err) {
    console.error("getMyPatients error:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

module.exports = {
  getAllDoctors,
  searchDoctors,
  getDoctorById,
  getDoctorsByOwnerBranches,
  getMyProfile,
  updateMyProfile,
  getMyPatients,
  getNextDoctorCode,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
