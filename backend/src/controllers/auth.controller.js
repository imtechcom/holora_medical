const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { ensureHoloraFreeSubscription } = require("../middleware/provider.middleware");

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
  const { full_name, username, email, password, phone, account_type } = req.body;
  const normalizedAccountType = account_type === "provider" ? "provider" : "patient";
  const targetRoleCode = normalizedAccountType === "provider" ? "clinic_owner" : "patient";

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

          // Role is selected by account_type (patient/provider)
          const getRoleSql = `
            SELECT id 
            FROM role 
            WHERE code = ? 
              AND status = 'active'
            LIMIT 1
          `;

          db.query(getRoleSql, [targetRoleCode], (roleErr, roleResults) => {
            if (roleErr) {
              console.error("Get register role error:", roleErr);
              return res.status(500).json({
                message: "Register failed",
                error: roleErr.message,
              });
            }

            if (!roleResults.length) {
              return res.status(500).json({
                message: `${targetRoleCode} role not found. Please seed role table first.`,
              });
            }

            const roleId = roleResults[0].id;

            const insertUserRoleSql = `
              INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
              VALUES (?, ?, NOW(), NULL)
            `;

            db.query(
              insertUserRoleSql,
              [newUserId, roleId],
              (userRoleErr) => {
                if (userRoleErr) {
                  console.error("Insert user_role error:", userRoleErr);
                  return res.status(500).json({
                    message: "Register failed",
                    error: userRoleErr.message,
                  });
                }

                if (normalizedAccountType === "provider") {
                  // Auto-assign HOLORA_FREE to new clinic_owner (fire-and-forget, non-fatal)
                  ensureHoloraFreeSubscription(newUserId).catch((err) => {
                    console.error("Auto-assign HOLORA_FREE failed for user", newUserId, err.message);
                  });

                  return res.status(201).json({
                    message: "Provider register successful. Please login.",
                    user_id: newUserId,
                    role: "clinic_owner",
                    account_type: "provider",
                  });
                }

                // Patient flow: create patient profile
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
                      account_type: "patient",
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

const acceptDoctorInvite = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: "token and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const inviteRows = await queryAsync(
      `
        SELECT id, user_id, doctor_id, email, expires_at, used_at, revoked_at
        FROM doctor_invite
        WHERE token_hash = ?
        LIMIT 1
      `,
      [tokenHash]
    );

    if (!inviteRows.length) {
      return res.status(404).json({ message: "Invite not found" });
    }

    const invite = inviteRows[0];

    if (invite.revoked_at) {
      return res.status(410).json({ message: "Invite was revoked" });
    }

    if (invite.used_at) {
      return res.status(410).json({ message: "Invite has already been used" });
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ message: "Invite has expired" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await queryAsync(
      `
        UPDATE users
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [passwordHash, invite.user_id]
    );

    await queryAsync(
      `
        UPDATE doctor_invite
        SET used_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
      [invite.id]
    );

    return res.json({
      message: "Doctor account is ready. Please login.",
      data: {
        email: invite.email,
        doctor_id: invite.doctor_id,
      },
    });
  } catch (error) {
    console.error("Accept doctor invite error:", error);
    return res.status(500).json({
      message: "Failed to accept doctor invite",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Vui lòng nhập Email của bạn" });
  }

  try {
    const userRows = await queryAsync(
      `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email]
    );

    if (!userRows.length) {
      // Để tránh dò email, ta cứ báo là đã gửi email (Security Best Practice)
      return res.json({ message: "Nếu Email hợp lệ, thư khôi phục đã được gửi đi." });
    }

    const user = userRows[0];
    // Sinh Token ngẫu nhiên (chống lộ)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Thời gian hết hạn là 1 Tiếng sau kể từ bây giờ
    const expires = new Date(Date.now() + 3600000); 

    await queryAsync(
      `UPDATE users SET reset_password_token = ?, reset_password_expires = ?, updated_at = NOW() WHERE id = ?`,
      [resetToken, expires, user.id]
    );

    // TODO: Gửi Email thực tế ở đây sử dụng Nodemailer/SendGrid...
    // Hiện tại in ra màn hình Console để Dev copy cho nhanh
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    console.log(`\n\n[RESET PASSWORD SIMULATOR] 🚀`);
    console.log(`Gửi đến email: ${email}`);
    console.log(`Đường link khôi phục của bạn là: ${resetLink}`);
    console.log(`Link có gián trị trong vòng 1 tiếng.\n\n`);

    return res.json({ message: "Thư khôi phục đã được gửi vào Email của bạn!" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Lỗi Server, không thể gửi yêu cầu", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ message: "Token và Mật khẩu mới là bắt buộc." });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
  }

  try {
    const userRows = await queryAsync(
      `SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW() LIMIT 1`,
      [token]
    );

    if (!userRows.length) {
      return res.status(400).json({ message: "Yêu cầu khôi phục không hợp lệ hoặc đã hết hạn." });
    }

    const userId = userRows[0].id;
    const passwordHash = await bcrypt.hash(new_password, 10);

    await queryAsync(
      `UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() WHERE id = ?`,
      [passwordHash, userId]
    );

    return res.json({ message: "Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay!" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Lỗi khi đổi mật khẩu mới", error: error.message });
  }
};

module.exports = { register, login, googleAuth, acceptDoctorInvite, forgotPassword, resetPassword };