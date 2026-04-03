const crypto = require("crypto");
const db = require("../config/db");

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

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const parsePositiveNumber = (value, fallback = null) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
};

const getMyDoctorId = async (userId) => {
  const rows = await queryAsync(
    `
      SELECT id
      FROM doctor
      WHERE user_id = ?
        AND status <> 'deleted'
      ORDER BY id DESC
      LIMIT 1
    `,
    [userId]
  );

  return rows[0]?.id || null;
};

const getPlans = async (req, res) => {
  try {
    const rows = await queryAsync(
      `
        SELECT
          p.id,
          p.code,
          p.name,
          p.scope_type,
          p.billing_cycle,
          p.price_cents,
          p.currency,
          p.status,
          e.feature_code,
          e.is_enabled,
          e.limit_value
        FROM subscription_plan p
        LEFT JOIN subscription_entitlement e ON e.plan_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.status = 'active'
        ORDER BY p.scope_type ASC, p.price_cents ASC, e.feature_code ASC
      `
    );

    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          code: row.code,
          name: row.name,
          scope_type: row.scope_type,
          billing_cycle: row.billing_cycle,
          price_cents: row.price_cents,
          currency: row.currency,
          status: row.status,
          entitlements: [],
        };
      }

      if (row.feature_code) {
        acc[row.id].entitlements.push({
          feature_code: row.feature_code,
          is_enabled: !!row.is_enabled,
          limit_value: row.limit_value,
        });
      }

      return acc;
    }, {});

    return res.json({
      message: "Subscription plans fetched successfully",
      data: Object.values(grouped),
    });
  } catch (err) {
    console.error("Get plans error:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

const getMySubscriptions = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const doctorId = await getMyDoctorId(userId);

    let sql = `
      SELECT
        ps.id,
        ps.scope_type,
        ps.scope_id,
        ps.status,
        ps.starts_at,
        ps.ends_at,
        ps.trial_ends_at,
        ps.auto_renew,
        ps.created_at,
        ps.updated_at,
        p.code AS plan_code,
        p.name AS plan_name,
        p.billing_cycle,
        p.price_cents,
        p.currency
      FROM provider_subscription ps
      INNER JOIN subscription_plan p ON p.id = ps.plan_id
      WHERE ps.deleted_at IS NULL
        AND (
          ps.owner_user_id = ?
    `;

    const params = [userId];

    if (doctorId) {
      sql += ` OR (ps.scope_type = 'doctor' AND ps.scope_id = ?)`;
      params.push(doctorId);
    }

    sql += `)
      ORDER BY ps.created_at DESC`;

    const rows = await queryAsync(sql, params);

    return res.json({
      message: "Subscriptions fetched successfully",
      data: rows,
    });
  } catch (err) {
    console.error("Get my subscriptions error:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

const activateSubscription = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { plan_code, scope_type, scope_id, months } = req.body;
  const durationMonths = parsePositiveNumber(months, 1);

  if (!plan_code || !scope_type || !scope_id) {
    return res.status(400).json({
      message: "plan_code, scope_type and scope_id are required",
    });
  }

  if (!["doctor", "branch", "account"].includes(scope_type)) {
    return res.status(400).json({ message: "scope_type must be doctor, branch, or account" });
  }

  // For account scope, the scope_id is always the authenticated user's own ID
  const resolvedScopeId = scope_type === "account" ? userId : parsePositiveNumber(scope_id);
  if (!resolvedScopeId) {
    return res.status(400).json({ message: "scope_id must be a positive number" });
  }

  try {
    const plans = await queryAsync(
      `
        SELECT id, code, name, scope_type
        FROM subscription_plan
        WHERE code = ?
          AND status = 'active'
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [plan_code]
    );

    if (!plans.length) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = plans[0];
    if (plan.scope_type !== scope_type) {
      return res.status(400).json({
        message: `Plan ${plan.code} does not support scope_type ${scope_type}`,
      });
    }

    const startsAt = new Date();
    // Account-level plans (HOLORA_FREE / HOLORA_PLUS) are permanent when activated
    const endsAt = scope_type === "account" ? null : addMonths(startsAt, durationMonths);

    const existingRows = await queryAsync(
      `
        SELECT id
        FROM provider_subscription
        WHERE scope_type = ?
          AND scope_id = ?
          AND owner_user_id = ?
          AND deleted_at IS NULL
        ORDER BY id DESC
        LIMIT 1
      `,
      [scope_type, resolvedScopeId, userId]
    );

    if (existingRows.length) {
      await queryAsync(
        `
          UPDATE provider_subscription
          SET
            plan_id = ?,
            status = 'active',
            starts_at = ?,
            ends_at = ?,
            trial_ends_at = NULL,
            auto_renew = 1,
            updated_at = NOW()
          WHERE id = ?
        `,
        [plan.id, startsAt, endsAt, existingRows[0].id]
      );

      return res.json({
        message: "Subscription activated successfully",
        data: {
          subscription_id: existingRows[0].id,
          plan_code: plan.code,
          scope_type,
          scope_id: resolvedScopeId,
          status: "active",
          starts_at: startsAt,
          ends_at: endsAt,
        },
      });
    }

    const insertResult = await queryAsync(
      `
        INSERT INTO provider_subscription (
          plan_id,
          scope_type,
          scope_id,
          owner_user_id,
          status,
          starts_at,
          ends_at,
          trial_ends_at,
          auto_renew,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, 1, NOW(), NOW())
      `,
      [plan.id, scope_type, resolvedScopeId, userId, startsAt, endsAt]
    );

    return res.status(201).json({
      message: "Subscription activated successfully",
      data: {
        subscription_id: insertResult.insertId,
        plan_code: plan.code,
        scope_type,
        scope_id: resolvedScopeId,
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
      },
    });
  } catch (err) {
    console.error("Activate subscription error:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

// ─── createPayment ────────────────────────────────────────────────────────────
// Creates a pending payment_order row and returns a short-lived token.
// The token is consumed by confirmPayment once the user completes payment.
const createPayment = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "User not authenticated" });

  const { plan_code, scope_type = "account", months = 1, payment_method } = req.body;

  if (!plan_code) return res.status(400).json({ message: "plan_code is required" });
  if (!payment_method) return res.status(400).json({ message: "payment_method is required" });

  const durationMonths = parsePositiveNumber(months, 1);

  const ALLOWED_METHODS = ["vnpay", "momo", "zalopay", "bank_transfer"];
  if (!ALLOWED_METHODS.includes(payment_method)) {
    return res.status(400).json({ message: "Invalid payment_method" });
  }

  try {
    const plans = await queryAsync(
      `SELECT id, code, name, price_cents, currency
       FROM subscription_plan
       WHERE code = ? AND status = 'active' AND deleted_at IS NULL
       LIMIT 1`,
      [plan_code]
    );

    if (!plans.length) return res.status(404).json({ message: "Plan not found" });

    const plan = plans[0];
    if (plan.price_cents === 0) {
      return res.status(400).json({ message: "Free plans do not require payment" });
    }

    const amountCents = plan.price_cents * durationMonths;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const result = await queryAsync(
      `INSERT INTO payment_order
         (user_id, plan_code, scope_type, months, amount_cents, currency, payment_method, status, token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [userId, plan_code, scope_type, durationMonths, amountCents, plan.currency || "VND", payment_method, token, expiresAt]
    );

    return res.status(201).json({
      message: "Payment order created",
      data: {
        order_id: result.insertId,
        plan_code,
        plan_name: plan.name,
        amount_cents: amountCents,
        currency: plan.currency || "VND",
        payment_method,
        token,
        expires_at: expiresAt,
      },
    });
  } catch (err) {
    console.error("Create payment error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ─── getPaymentHistory ────────────────────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "User not authenticated" });

  try {
    const rows = await queryAsync(
      `SELECT
         po.id,
         po.plan_code,
         po.scope_type,
         po.months,
         po.amount_cents,
         po.currency,
         po.payment_method,
         po.status,
         po.invoice_number,
         po.paid_at,
         po.description,
         po.created_at,
         sp.name AS plan_name
       FROM payment_order po
       LEFT JOIN subscription_plan sp ON sp.code = po.plan_code AND sp.deleted_at IS NULL
       WHERE po.user_id = ?
       ORDER BY po.created_at DESC`,
      [userId]
    );

    return res.json({ message: "Payment history fetched", data: rows });
  } catch (err) {
    console.error("Get payment history error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ─── confirmPayment ───────────────────────────────────────────────────────────
// Validates the payment token, marks the order as paid, then activates the
// subscription.  In production this would be called by the gateway callback;
// for the demo the client calls it directly after simulated processing.
const confirmPayment = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "User not authenticated" });

  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "token is required" });

  try {
    const orders = await queryAsync(
      `SELECT * FROM payment_order WHERE token = ? AND user_id = ? LIMIT 1`,
      [token, userId]
    );

    if (!orders.length) return res.status(404).json({ message: "Payment order not found" });

    const order = orders[0];

    if (order.status === "paid") {
      return res.status(400).json({ message: "Payment already processed" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Payment order is no longer valid" });
    }
    if (new Date() > new Date(order.expires_at)) {
      await queryAsync(
        `UPDATE payment_order SET status = 'expired', updated_at = NOW() WHERE id = ?`,
        [order.id]
      );
      return res.status(400).json({ message: "Payment order has expired. Please try again." });
    }

    // Generate invoice number: INV-YYYYMMDD-ORDERID
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNumber = `INV-${dateStr}-${String(order.id).padStart(4, "0")}`;
    const description = `${order.plan_code} × ${order.months} month(s)`;

    // Mark order as paid
    await queryAsync(
      `UPDATE payment_order
       SET status = 'paid', paid_at = NOW(), invoice_number = ?, description = ?, updated_at = NOW()
       WHERE id = ?`,
      [invoiceNumber, description, order.id]
    );

    // Activate the subscription
    const plans = await queryAsync(
      `SELECT id, code, name, scope_type FROM subscription_plan
       WHERE code = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      [order.plan_code]
    );

    if (!plans.length) return res.status(404).json({ message: "Plan not found after payment" });

    const plan = plans[0];
    const startsAt = new Date();
    const endsAt = order.scope_type === "account" ? null : addMonths(startsAt, order.months);
    const resolvedScopeId = order.scope_type === "account" ? userId : userId;

    const existing = await queryAsync(
      `SELECT id FROM provider_subscription
       WHERE scope_type = ? AND scope_id = ? AND owner_user_id = ? AND deleted_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [order.scope_type, resolvedScopeId, userId]
    );

    if (existing.length) {
      await queryAsync(
        `UPDATE provider_subscription
         SET plan_id = ?, status = 'active', starts_at = ?, ends_at = ?,
             trial_ends_at = NULL, auto_renew = 1, updated_at = NOW()
         WHERE id = ?`,
        [plan.id, startsAt, endsAt, existing[0].id]
      );
    } else {
      await queryAsync(
        `INSERT INTO provider_subscription
           (plan_id, scope_type, scope_id, owner_user_id, status, starts_at, ends_at, trial_ends_at, auto_renew, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, 1, NOW(), NOW())`,
        [plan.id, order.scope_type, resolvedScopeId, userId, startsAt, endsAt]
      );
    }

    return res.json({
      message: "Payment confirmed and subscription activated",
      data: {
        order_id: order.id,
        plan_code: order.plan_code,
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
      },
    });
  } catch (err) {
    console.error("Confirm payment error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

module.exports = {
  getPlans,
  getMySubscriptions,
  activateSubscription,
  createPayment,
  confirmPayment,
  getPaymentHistory,
};
