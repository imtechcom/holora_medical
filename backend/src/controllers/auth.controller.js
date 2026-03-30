const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const issueTokenAndRespond = (res, user) => {
  const rolesSql = `
    SELECT r.code AS role
    FROM user_role ur
    JOIN role r ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `;

  db.query(rolesSql, [user.id], (roleErr, roleResults) => {
    if (roleErr) {
      console.error("Get roles error:", roleErr);
      return res.status(500).json({
        message: "Database error",
        error: roleErr.message,
      });
    }

    const roles = roleResults.map((r) => r.role);
    const primaryRole = roles.length > 0 ? roles[0] : "patient";

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: primaryRole,
        roles,
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
        role: primaryRole,
        roles,
      },
    });
  });
};

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

  // First query: Get user without roles
  const userSql = `
    SELECT 
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.avatar_url,
      u.gender,
      u.date_of_birth,
      u.password_hash,
      u.status,
      u.email_verified_at,
      u.last_login_at,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.email = ?
      AND u.deleted_at IS NULL
  `;

  db.query(userSql, [email], async (err, userResults) => {
    if (err) {
      console.error("DB query error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userResults[0];

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return issueTokenAndRespond(res, user);
  });
};

const googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      message: "Google credential is required",
    });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      message: "GOOGLE_CLIENT_ID is not configured",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const fullName = payload?.name || "Google User";
    const emailVerified = payload?.email_verified;

    if (!email || !emailVerified) {
      return res.status(401).json({
        message: "Google account email is not verified",
      });
    }

    const getUserSql = `
      SELECT id, full_name, username, email, status
      FROM users
      WHERE email = ? AND deleted_at IS NULL
      LIMIT 1
    `;

    db.query(getUserSql, [email], async (getErr, getResults) => {
      if (getErr) {
        console.error("Get user by email error:", getErr);
        return res.status(500).json({
          message: "Database error",
          error: getErr.message,
        });
      }

      if (getResults.length > 0) {
        const existingUser = getResults[0];

        if (existingUser.status !== "active") {
          return res.status(403).json({
            message: "Account is not active",
          });
        }

        return issueTokenAndRespond(res, existingUser);
      }

      const baseUsername = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18) || "user";
      const username = `${baseUsername}_${Date.now().toString().slice(-6)}`;
      const randomPassword = `google_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const password_hash = await bcrypt.hash(randomPassword, 10);

      const insertUserSql = `
        INSERT INTO users (
          full_name,
          username,
          email,
          password_hash,
          status,
          email_verified_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 'active', NOW(), NOW(), NOW())
      `;

      db.query(
        insertUserSql,
        [fullName, username, email, password_hash],
        (insertUserErr, userResult) => {
          if (insertUserErr) {
            console.error("Insert Google user error:", insertUserErr);
            return res.status(500).json({
              message: "Google auth failed",
              error: insertUserErr.message,
            });
          }

          const newUserId = userResult.insertId;

          const getPatientRoleSql = `
            SELECT id
            FROM role
            WHERE code = 'patient' AND status = 'active'
            LIMIT 1
          `;

          db.query(getPatientRoleSql, (roleErr, roleResults) => {
            if (roleErr || !roleResults.length) {
              console.error("Get patient role error:", roleErr);
              return res.status(500).json({
                message: "Google auth failed",
                error: roleErr?.message || "Patient role not found",
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
                    message: "Google auth failed",
                    error: userRoleErr.message,
                  });
                }

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
                  [newUserId, patientCode, fullName, "", email],
                  (patientErr) => {
                    if (patientErr) {
                      console.error("Insert patient error:", patientErr);
                      return res.status(500).json({
                        message: "Google auth failed",
                        error: patientErr.message,
                      });
                    }

                    const newUser = {
                      id: newUserId,
                      full_name: fullName,
                      username,
                      email,
                      status: "active",
                    };

                    return issueTokenAndRespond(res, newUser);
                  }
                );
              }
            );
          });
        }
      );
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(401).json({
      message: "Invalid Google token",
    });
  }
};

module.exports = { register, login, googleAuth };