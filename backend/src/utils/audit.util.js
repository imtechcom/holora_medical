const db = require("../config/db");

/**
 * Log an audit event to the audit_logs table.
 *
 * @param {object}      req         Express request (for IP / UA). Can be null.
 * @param {string}      action      e.g. "USER_LOGIN", "DOCTOR_CREATE"
 * @param {string|null} entityType  e.g. "user", "doctor", "appointment"
 * @param {number|null} entityId    ID of the affected entity
 * @param {object|null} details     Arbitrary JSON payload (old/new values, etc.)
 * @param {number|null} userId      Override user ID (when req.user is unavailable, e.g. failed login)
 */
const logAudit = (req, action, entityType = null, entityId = null, details = null, userId = null) => {
  const uid = userId ?? req?.user?.id ?? null;
  const ip = req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req?.socket?.remoteAddress || null;
  const ua = req?.headers?.["user-agent"] || null;

  const sql = `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [uid, action, entityType, entityId, details ? JSON.stringify(details) : null, ip, ua];

  // Fire-and-forget — never block the response
  db.query(sql, params, (err) => {
    if (err) {
      console.error("[AuditLog] Failed to write:", err.message);
    }
  });
};

module.exports = { logAudit };
