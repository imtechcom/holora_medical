const express = require("express");
const router = express.Router();
const {
  getAllBranches,
  getBranchById,
  getMyBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/branch.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const {
  requireProviderRole,
  requireActiveSubscription,
  requireOwnedBranchAccess,
  enforceAccountBranchLimit,
} = require("../middleware/provider.middleware");

router.get("/", getAllBranches);
router.get("/my", authenticateToken, requireProviderRole, getMyBranches);
router.get("/:id", getBranchById);
router.post(
  "/",
  authenticateToken,
  requireProviderRole,
  requireActiveSubscription("branch.manage", { scopeOrder: ["account"] }),
  enforceAccountBranchLimit(),
  createBranch
);
router.put(
  "/:id",
  authenticateToken,
  requireProviderRole,
  requireOwnedBranchAccess({ includeResourceId: true }),
  requireActiveSubscription("branch.manage", { scopeOrder: ["branch", "doctor"] }),
  updateBranch
);
router.delete(
  "/:id",
  authenticateToken,
  requireProviderRole,
  requireOwnedBranchAccess({ includeResourceId: true }),
  requireActiveSubscription("branch.manage", { scopeOrder: ["branch", "doctor"] }),
  deleteBranch
);

module.exports = router;
