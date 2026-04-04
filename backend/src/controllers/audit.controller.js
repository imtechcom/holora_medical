const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * GET /audit-logs
 * Query params: page, limit, action, entity_type, user_id, from, to
 */
const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (req.query.action) {
      conditions.push("a.action = ?");
      params.push(req.query.action);
    }
    if (req.query.entity_type) {
      conditions.push("a.entity_type = ?");
      params.push(req.query.entity_type);
    }
    if (req.query.user_id) {
      conditions.push("a.user_id = ?");
      params.push(Number(req.query.user_id));
    }
    if (req.query.from) {
      conditions.push("a.created_at >= ?");
      params.push(req.query.from);
    }
    if (req.query.to) {
      conditions.push("a.created_at <= ?");
      params.push(req.query.to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*) AS total FROM audit_logs a ${where}`;
    const [countRow] = await queryAsync(countSql, params);

    const dataSql = `
      SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id,
             a.details, a.ip_address, a.user_agent, a.created_at,
             u.full_name AS user_name, u.email AS user_email
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const rows = await queryAsync(dataSql, dataParams);

    // Parse details JSON
    const logs = rows.map((r) => ({
      ...r,
      details: r.details ? (typeof r.details === "string" ? JSON.parse(r.details) : r.details) : null,
    }));

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
      },
    });
  } catch (err) {
    console.error("getAuditLogs error:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

/**
 * GET /audit-logs/actions — distinct action values for filter dropdown
 */
const getAuditActions = async (_req, res) => {
  try {
    const rows = await queryAsync("SELECT DISTINCT action FROM audit_logs ORDER BY action");
    res.json({ data: rows.map((r) => r.action) });
  } catch (err) {
    console.error("getAuditActions error:", err);
    res.status(500).json({ message: "Failed to fetch audit actions" });
  }
};

/**
 * GET /audit-logs/entity-types — distinct entity_type values
 */
const getAuditEntityTypes = async (_req, res) => {
  try {
    const rows = await queryAsync("SELECT DISTINCT entity_type FROM audit_logs WHERE entity_type IS NOT NULL ORDER BY entity_type");
    res.json({ data: rows.map((r) => r.entity_type) });
  } catch (err) {
    console.error("getAuditEntityTypes error:", err);
    res.status(500).json({ message: "Failed to fetch entity types" });
  }
};

module.exports = { getAuditLogs, getAuditActions, getAuditEntityTypes };
