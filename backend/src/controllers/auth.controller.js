const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const register = async (req, res) => {
  const { full_name, username, email, password, phone } = req.body;

  if (!full_name || !username || !email || !password) {
    return res.status(400).json({
      message: "Full name, username, email and password are required.",
    });
  }

  try {
    const checkSql = `
      SELECT id 
      FROM users 
      WHERE (email = ? OR username = ?) 
        AND deleted_at IS NULL
      LIMIT 1
    `;

    db.query(checkSql, [email, username], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error("DB check error:", checkErr);
        return res.status(500).json({
          message: "Database error",
          error: checkErr.message,
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          message: "Email or username already exists.",
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
        [full_name, username, email, password_hash, phone || null],
        (insertUserErr, userResult) => {
          if (insertUserErr) {
            console.error("Insert user error:", insertUserErr);
            return res.status(500).json({
              message: "Register failed",
              error: insertUserErr.message,
            });
          }

          const newUserId = userResult.insertId;

          // lấy role patient theo code, không hardcode id
          const getPatientRoleSql = `
            SELECT id 
            FROM role 
            WHERE code = 'patient' 
              AND status = 'active'
            LIMIT 1
          `;

          db.query(getPatientRoleSql, (roleErr, roleResults) => {
            if (roleErr) {
              console.error("Get patient role error:", roleErr);
              return res.status(500).json({
                message: "Register failed",
                error: roleErr.message,
              });
            }

            if (!roleResults.length) {
              return res.status(500).json({
                message: "Patient role not found. Please seed role table first.",
              });
            }

            const patientRoleId = roleResults[0].id;

            const insertUserRoleSql = `
              INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
              VALUES (?, ?, NOW(), NULL)
            `;

            db.query(
              insertUserRoleSql,
              [newUserId, patientRoleId],
              (userRoleErr) => {
                if (userRoleErr) {
                  console.error("Insert user_role error:", userRoleErr);
                  return res.status(500).json({
                    message: "Register failed",
                    error: userRoleErr.message,
                  });
                }

                // Tùy chọn: tạo luôn hồ sơ patient
                const patientCode = `PAT${String(newUserId).padStart(6, "0")}`;

                const insertPatientSql = `
                  INSERT INTO patient (
                    user_id,
                    patient_code,
                    full_name,
                    phone,
                    email,
                    status,
                    created_at,
                    updated_at
                  )
                  VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
                `;

                db.query(
                  insertPatientSql,
                  [
                    newUserId,
                    patientCode,
                    full_name,
                    phone || "",
                    email,
                  ],
                  (patientErr) => {
                    if (patientErr) {
                      console.error("Insert patient error:", patientErr);
                      return res.status(500).json({
                        message: "Register failed",
                        error: patientErr.message,
                      });
                    }

                    return res.status(201).json({
                      message: "Register successful. Please login.",
                      user_id: newUserId,
                      role: "patient",
                    });
                  }
                );
              }
            );
          });
        }
      );
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const login = (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT 
      u.*,
      r.code AS role
    FROM users u
    JOIN user_role ur ON u.id = ur.user_id
    JOIN role r ON ur.role_id = r.id
    WHERE u.email = ?
      AND u.deleted_at IS NULL
    LIMIT 1
  `;

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("DB query error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role,
      },
    });
  });
};

module.exports = { register, login };