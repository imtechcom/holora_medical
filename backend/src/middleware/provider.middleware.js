const db = require("../config/db");

const PROVIDER_ROLES = ["super_admin", "admin", "doctor", "clinic_owner", "branch_manager"];
const BYPASS_ROLES = ["super_admin", "admin"];

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

const parsePositiveNumber = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

const getRoleSet = (req) => {
  const fromToken = Array.isArray(req.user?.roles)
    ? req.user.roles
    : req.user?.role
      ? [req.user.role]
      : [];

  const fromDb = Array.isArray(req.userRoles) ? req.userRoles : [];
  return new Set([...fromToken, ...fromDb]);
};

const userHasAnyRole = (req, roles = []) => {
  const roleSet = getRoleSet(req);
  return roles.some((role) => roleSet.has(role));
};

const getProviderDoctorId = async (userId) => {
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

const findEntitledSubscription = async ({ ownerUserId, featureCode, candidates }) => {
  if (!candidates.length) return null;

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];

    const rows = await queryAsync(
      `
        SELECT
          ps.id,
          ps.scope_type,
          ps.scope_id,
          ps.status,
          ps.starts_at,
          ps.ends_at,
          ps.trial_ends_at,
          ps.owner_user_id,
          p.id AS plan_id,
          p.code AS plan_code,
          p.name AS plan_name,
          e.feature_code,
          e.is_enabled,
          e.limit_value
        FROM provider_subscription ps
        INNER JOIN subscription_plan p ON p.id = ps.plan_id
        INNER JOIN subscription_entitlement e ON e.plan_id = p.id
        WHERE ps.scope_type = ?
          AND ps.scope_id = ?
          AND ps.deleted_at IS NULL
          AND ps.status IN ('trialing', 'active')
          AND (ps.ends_at IS NULL OR ps.ends_at >= NOW())
          AND (ps.trial_ends_at IS NULL OR ps.trial_ends_at >= NOW() OR ps.status = 'active')
          AND p.status = 'active'
          AND e.feature_code = ?
          AND e.is_enabled = 1
          AND (ps.owner_user_id = ?)
        ORDER BY ps.id DESC
        LIMIT 1
      `,
      [candidate.scopeType, candidate.scopeId, featureCode, ownerUserId]
    );

    if (rows.length) {
      return rows[0];
    }
  }

  return null;
};

const createTrialSubscription = async ({ ownerUserId, scopeType, scopeId }) => {
  // For account scope, auto-assign HOLORA_FREE (permanent free tier)
  if (scopeType === "account") {
    const holoraFree = await queryAsync(
      `SELECT id FROM subscription_plan WHERE code = 'HOLORA_FREE' AND status = 'active' AND deleted_at IS NULL LIMIT 1`
    );
    if (!holoraFree.length) return null;
    const existing = await queryAsync(
      `SELECT id FROM provider_subscription WHERE scope_type = 'account' AND scope_id = ? AND owner_user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [scopeId, ownerUserId]
    );
    if (existing.length) return { planId: holoraFree[0].id, trialPlanCode: "HOLORA_FREE" };
    await queryAsync(
      `INSERT INTO provider_subscription (plan_id, scope_type, scope_id, owner_user_id, status, starts_at, ends_at, trial_ends_at, auto_renew, created_at, updated_at)
       VALUES (?, 'account', ?, ?, 'active', NOW(), NULL, NULL, 0, NOW(), NOW())`,
      [holoraFree[0].id, scopeId, ownerUserId]
    );
    return { planId: holoraFree[0].id, trialPlanCode: "HOLORA_FREE" };
  }

  const trialPlanCode = scopeType === "branch" ? "BRANCH_TRIAL_30D" : "DOCTOR_TRIAL_14D";

  const plans = await queryAsync(
    `
      SELECT id
      FROM subscription_plan
      WHERE code = ?
        AND status = 'active'
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [trialPlanCode]
  );

  if (!plans.length) {
    return null;
  }

  const planId = plans[0].id;
  const trialDays = scopeType === "branch" ? 30 : 14;

  await queryAsync(
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
      VALUES (
        ?,
        ?,
        ?,
        ?,
        'trialing',
        NOW(),
        DATE_ADD(NOW(), INTERVAL ? DAY),
        DATE_ADD(NOW(), INTERVAL ? DAY),
        0,
        NOW(),
        NOW()
      )
    `,
    [planId, scopeType, scopeId, ownerUserId, trialDays, trialDays]
  );

  return { planId, trialPlanCode };
};

/**
 * Auto-assign HOLORA_FREE to a user if they have no account subscription.
 * Called during provider registration.
 */
const ensureHoloraFreeSubscription = async (userId) => {
  const plans = await queryAsync(
    `SELECT id FROM subscription_plan WHERE code = 'HOLORA_FREE' AND status = 'active' AND deleted_at IS NULL LIMIT 1`
  );
  if (!plans.length) return;
  const existing = await queryAsync(
    `SELECT id FROM provider_subscription WHERE scope_type = 'account' AND scope_id = ? AND owner_user_id = ? AND deleted_at IS NULL LIMIT 1`,
    [userId, userId]
  );
  if (existing.length) return;
  await queryAsync(
    `INSERT INTO provider_subscription (plan_id, scope_type, scope_id, owner_user_id, status, starts_at, ends_at, trial_ends_at, auto_renew, created_at, updated_at)
     VALUES (?, 'account', ?, ?, 'active', NOW(), NULL, NULL, 0, NOW(), NOW())`,
    [plans[0].id, userId, userId]
  );
};

const resolveScopeCandidates = (req, options = {}) => {
  const branchId =
    parsePositiveNumber(req.body?.branch_id) ||
    parsePositiveNumber(req.params?.branch_id) ||
    parsePositiveNumber(req.query?.branch_id) ||
    (Array.isArray(req.body?.branch_ids) ? parsePositiveNumber(req.body.branch_ids[0]) : null) ||
    (req.baseUrl.includes("/branches") ? parsePositiveNumber(req.params?.id) : null);

  const doctorId =
    parsePositiveNumber(req.body?.doctor_id) ||
    parsePositiveNumber(req.params?.doctor_id) ||
    parsePositiveNumber(req.providerContext?.doctorId);

  const userId = req.user?.id;

  // Default order: account first (HOLORA_FREE/PLUS), then branch, then doctor
  const order = Array.isArray(options.scopeOrder) && options.scopeOrder.length
    ? options.scopeOrder
    : ["account", "branch", "doctor"];

  const candidates = [];
  order.forEach((scopeType) => {
    if (scopeType === "account" && userId) {
      candidates.push({ scopeType: "account", scopeId: userId });
    }

    if (scopeType === "branch" && branchId) {
      candidates.push({ scopeType: "branch", scopeId: branchId });
    }

    if (scopeType === "doctor" && doctorId) {
      candidates.push({ scopeType: "doctor", scopeId: doctorId });
    }
  });

  return { candidates, branchId, doctorId };
};

const getBranchIdsFromRequest = (req, options = {}) => {
  const branchIds = new Set();

  if (Array.isArray(req.body?.branch_ids)) {
    req.body.branch_ids.forEach((id) => {
      const parsed = parsePositiveNumber(id);
      if (parsed) branchIds.add(parsed);
    });
  }

  const branchIdFromBody = parsePositiveNumber(req.body?.branch_id);
  if (branchIdFromBody) branchIds.add(branchIdFromBody);

  const branchIdFromParam = parsePositiveNumber(req.params?.branch_id);
  if (branchIdFromParam) branchIds.add(branchIdFromParam);

  const branchIdFromQuery = parsePositiveNumber(req.query?.branch_id);
  if (branchIdFromQuery) branchIds.add(branchIdFromQuery);

  if (options.includeResourceId && req.baseUrl.includes("/branches")) {
    const id = parsePositiveNumber(req.params?.id);
    if (id) branchIds.add(id);
  }

  return [...branchIds];
};

const requireProviderRole = async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const userId = req.user.id;

  try {
    const roleRows = await queryAsync(
      `
        SELECT r.code
        FROM user_role ur
        INNER JOIN role r ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `,
      [userId]
    );

    req.userRoles = roleRows.map((row) => row.code).filter(Boolean);

    const hasProviderRole = req.userRoles.some((role) => PROVIDER_ROLES.includes(role));
    if (!hasProviderRole) {
      return res.status(403).json({
        message: "Provider access required",
        requiredRoles: PROVIDER_ROLES,
        userRoles: req.userRoles,
      });
    }

    const doctorId = await getProviderDoctorId(userId);
    req.providerContext = { doctorId };

    return next();
  } catch (err) {
    console.error("Provider role check error:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

const requireActiveSubscription = (featureCode, options = {}) => {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (userHasAnyRole(req, BYPASS_ROLES)) {
      return next();
    }

    const ownerUserId = req.user.id;

    try {
      const { candidates } = resolveScopeCandidates(req, options);

      if (!candidates.length) {
        if (options.allowNoScopeOnCreate) {
          return next();
        }

        return res.status(400).json({
          message: "Unable to determine subscription scope. Provide branch_id or doctor context.",
        });
      }

      let subscription = await findEntitledSubscription({
        ownerUserId,
        featureCode,
        candidates,
      });

      if (!subscription && options.autoCreateTrial !== false) {
        await createTrialSubscription({
          ownerUserId,
          scopeType: candidates[0].scopeType,
          scopeId: candidates[0].scopeId,
        });

        subscription = await findEntitledSubscription({
          ownerUserId,
          featureCode,
          candidates,
        });
      }

      if (!subscription) {
        return res.status(402).json({
          message: "Active subscription required",
          requiredFeature: featureCode,
          scopeCandidates: candidates,
        });
      }

      req.subscriptionGrant = subscription;
      return next();
    } catch (err) {
      console.error("Subscription check error:", err);
      return res.status(500).json({
        message: "Subscription validation failed",
        error: err.message,
      });
    }
  };
};

const requireOwnedBranchAccess = (options = {}) => {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (userHasAnyRole(req, BYPASS_ROLES)) {
      return next();
    }

    const branchIds = getBranchIdsFromRequest(req, options);
    if (!branchIds.length) {
      if (options.allowEmpty) {
        return next();
      }

      return res.status(400).json({
        message: "branch_id or branch_ids is required",
      });
    }

    try {
      const rows = await queryAsync(
        `
          SELECT id
          FROM branch
          WHERE deleted_at IS NULL
            AND owner_user_id = ?
            AND id IN (?)
        `,
        [req.user.id, branchIds]
      );

      if (rows.length !== branchIds.length) {
        return res.status(403).json({
          message: "You can only manage your own branches",
          branch_ids: branchIds,
        });
      }

      return next();
    } catch (err) {
      console.error("Branch ownership check error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }
  };
};

const enforceDoctorManageLimit = () => {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (userHasAnyRole(req, BYPASS_ROLES)) {
      return next();
    }

    const grant = req.subscriptionGrant;
    const limit = Number(grant?.limit_value);

    if (!grant || !Number.isInteger(limit) || limit <= 0) {
      return next();
    }

    try {
      // For account scope and branch scope, the limit is per branch
      if (grant.scope_type === "branch" || grant.scope_type === "account") {
        const branchIds = getBranchIdsFromRequest(req, { allowEmpty: false });
        const branchId = branchIds[0];

        if (!branchId) {
          return res.status(400).json({
            message: "A target branch is required to enforce doctor limit",
          });
        }

        const rows = await queryAsync(
          `
            SELECT COUNT(DISTINCT db.doctor_id) AS total
            FROM doctor_branch db
            INNER JOIN doctor d ON d.id = db.doctor_id
            WHERE db.branch_id = ?
              AND db.deleted_at IS NULL
              AND d.status <> 'deleted'
          `,
          [branchId]
        );

        const currentTotal = Number(rows[0]?.total || 0);
        if (currentTotal >= limit) {
          return res.status(402).json({
            message: `Doctor limit reached. Your plan allows ${limit} doctor(s) per branch.`,
            feature: "doctor.manage",
            scope_type: grant.scope_type,
            scope_id: branchId,
            limit,
            current: currentTotal,
          });
        }

        return next();
      }

      const rows = await queryAsync(
        `
          SELECT COUNT(*) AS total
          FROM doctor
          WHERE created_by_user_id = ?
            AND status <> 'deleted'
        `,
        [req.user.id]
      );

      const currentTotal = Number(rows[0]?.total || 0);
      if (currentTotal >= limit) {
        return res.status(402).json({
          message: "Doctor limit reached for current subscription",
          feature: "doctor.manage",
          scope_type: "doctor",
          scope_id: grant.scope_id,
          limit,
          current: currentTotal,
        });
      }

      return next();
    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({
          message: "Missing ownership columns. Please run migrate:provider-ownership",
        });
      }

      console.error("Doctor limit check error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }
  };
};

/**
 * Checks that the clinic_owner has not exceeded the maximum branch count
 * allowed by their account subscription. Must run AFTER requireActiveSubscription.
 */
const enforceAccountBranchLimit = () => {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (userHasAnyRole(req, BYPASS_ROLES)) {
      return next();
    }

    const grant = req.subscriptionGrant;
    const limit = Number(grant?.limit_value);

    // Unlimited plan (limit_value IS NULL → Number(null) = 0 ≤ 0 → skip)
    if (!grant || !Number.isInteger(limit) || limit <= 0) {
      return next();
    }

    try {
      const rows = await queryAsync(
        `SELECT COUNT(*) AS total FROM branch WHERE owner_user_id = ? AND deleted_at IS NULL`,
        [req.user.id]
      );

      const current = Number(rows[0]?.total || 0);
      if (current >= limit) {
        return res.status(402).json({
          message: `Branch limit reached. Your plan allows ${limit} branch(es). Upgrade to Holora Plus for unlimited branches.`,
          feature: "branch.manage",
          limit,
          current,
        });
      }

      return next();
    } catch (err) {
      console.error("Branch limit check error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
  };
};

module.exports = {
  requireProviderRole,
  requireActiveSubscription,
  requireOwnedBranchAccess,
  enforceDoctorManageLimit,
  enforceAccountBranchLimit,
  ensureHoloraFreeSubscription,
};
