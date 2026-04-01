import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import branchService from "../../services/branchService";
import subscriptionService from "../../services/subscriptionService";
import PaymentModal from "../../components/PaymentModal";
import ConfirmModal from "../../components/ConfirmModal";

const STATUS_STYLE = {
  active:   { label: "Đang hoạt động",       cls: "sub-badge sub-badge--active" },
  trialing: { label: "Dùng thử",             cls: "sub-badge sub-badge--trial" },
  past_due: { label: "Quá hạn thanh toán",   cls: "sub-badge sub-badge--warn" },
  cancelled:{ label: "Đã hủy",               cls: "sub-badge sub-badge--off" },
  expired:  { label: "Hết hạn",              cls: "sub-badge sub-badge--off" },
};

const PLAN_META = {
  HOLORA_FREE: { color: "#64748b", icon: "🏥", tagline: "Miễn phí mãi mãi" },
  HOLORA_PLUS: { color: "#3b82f6", icon: "⭐", tagline: "Không giới hạn" },
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [accountSub, setAccountSub] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmDowngradeOpen, setConfirmDowngradeOpen] = useState(false);

  // Static plan metadata for the payment modal (matches DB values)
  const PLUS_PLAN = { code: "HOLORA_PLUS", name: "Holora Plus", price_cents: 299000, currency: "VND" };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [subRes, branchRes] = await Promise.all([
        subscriptionService.getMySubscriptions(),
        branchService.getMyBranches(),
      ]);
      const subs = subRes.data || [];
      const acct = subs
        .filter((s) => s.scope_type === "account")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
      setAccountSub(acct);
      setBranches(branchRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const planCode = accountSub?.plan_code || "HOLORA_FREE";
  const meta = PLAN_META[planCode] || PLAN_META.HOLORA_FREE;
  const isPlus = planCode === "HOLORA_PLUS";
  const branchUsed = branches.length;
  const branchLimit = isPlus ? null : 3;

  const usagePercent = useMemo(() => {
    if (branchLimit === null) return 100;
    return Math.min(100, Math.round((branchUsed / branchLimit) * 100));
  }, [branchUsed, branchLimit]);

  const switchPlan = async (targetCode) => {
    if (targetCode === "HOLORA_PLUS") {
      // Paid upgrade — open the payment modal
      setMessage("");
      setError("");
      setShowPaymentModal(true);
      return;
    }

    // Downgrade to Free — no payment required
    setConfirmDowngradeOpen(true);
  };

  const confirmDowngrade = async () => {
    const targetCode = "HOLORA_FREE";
    setUpgrading(true);
    setMessage("");
    setError("");
    try {
      await subscriptionService.activateSubscription({
        plan_code: targetCode,
        scope_type: "account",
        months: 1,
      });
      setMessage("Đã chuyển về Holora Free.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setUpgrading(false);
      setConfirmDowngradeOpen(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setMessage("Nâng cấp lên Holora Plus thành công! 🎉");
    await loadData();
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E06666]"></div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main">Gói dịch vụ</h1>
        <p className="text-text-dim text-sm mt-1">Quản lý gói Holora của bạn</p>
      </div>

      {message && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Active plan summary */}
      <div
        className="bg-bg-surface dark:bg-slate-800 rounded-xl border-2 p-5 flex items-center justify-between gap-4"
        style={{ borderColor: meta.color }}
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl leading-none" role="img" aria-label="plan">{meta.icon}</span>
          <div>
            <div className="text-lg font-bold text-text-main">{accountSub?.plan_name || "Holora Free"}</div>
            <div className="text-sm text-text-dim">{meta.tagline}</div>
          </div>
        </div>
        {(() => {
          const s = accountSub?.status;
          const badgeCls = {
            active:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
            trialing:  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
            past_due:  "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
            cancelled: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400",
            expired:   "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400",
          };
          const badgeLabel  = STATUS_STYLE[s]?.label || "Đang hoạt động";
          const badgeClass  = badgeCls[s] || badgeCls.active;
          return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
              {badgeLabel}
            </span>
          );
        })()}
      </div>

      {/* Usage (only for Free tier) */}
      {!isPlus && (
        <div className="bg-bg-surface dark:bg-slate-800 border border-border-main rounded-xl p-5">
          <h2 className="text-base font-semibold text-text-main mb-4">Mức sử dụng</h2>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-text-dim w-20 flex-shrink-0">Chi nhánh</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  background: branchUsed >= branchLimit ? "#ef4444" : meta.color,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-text-main w-12 text-right">{branchUsed} / {branchLimit}</span>
          </div>
          <p className="text-xs text-text-dim">Giới hạn bác sĩ: 3 bác sĩ / chi nhánh</p>
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <h2 className="text-lg font-bold text-text-main mb-4">Các gói dịch vụ</h2>
        <div className="flex gap-4 flex-wrap">

          {/* FREE */}
          <div className={`relative flex-1 min-w-[220px] flex flex-col gap-3 rounded-xl p-6 pt-7 border-2 transition ${!isPlus ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border-main bg-bg-surface dark:bg-slate-800"}`}>
            {!isPlus && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-0.5 rounded-full whitespace-nowrap">
                Gói hiện tại
              </div>
            )}
            <div className="text-base font-bold text-text-main">🏥 Holora Free</div>
            <div className="text-2xl font-extrabold text-text-main">Miễn phí</div>
            <ul className="flex-1 space-y-2 text-sm text-text-dim">
              <li>✅ Tối đa 3 chi nhánh</li>
              <li>✅ Tối đa 3 bác sĩ / chi nhánh</li>
              <li>✅ Quản lý lịch hẹn</li>
              <li>✅ Hồ sơ bệnh nhân</li>
              <li className="opacity-50">❌ Chi nhánh không giới hạn</li>
              <li className="opacity-50">❌ Bác sĩ không giới hạn</li>
            </ul>
            {isPlus && (
              <button
                type="button"
                onClick={() => switchPlan("HOLORA_FREE")}
                disabled={upgrading}
                className="w-full mt-auto border border-border-main rounded-lg py-2.5 text-sm font-semibold text-text-dim hover:bg-bg-app dark:hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Hạ xuống Free
              </button>
            )}
          </div>

          {/* PLUS */}
          <div className={`relative flex-1 min-w-[220px] flex flex-col gap-3 rounded-xl p-6 pt-7 border-2 transition ${isPlus ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-border-main bg-bg-surface dark:bg-slate-800"}`}>
            {isPlus && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-0.5 rounded-full whitespace-nowrap">
                Gói hiện tại
              </div>
            )}
            {!isPlus && (
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                Phổ biến nhất
              </div>
            )}
            <div className="text-base font-bold text-text-main">⭐ Holora Plus</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              299.000 ₫ <span className="text-sm font-normal text-text-dim">/ tháng</span>
            </div>
            <ul className="flex-1 space-y-2 text-sm text-text-dim">
              <li>✅ Chi nhánh không giới hạn</li>
              <li>✅ Bác sĩ không giới hạn</li>
              <li>✅ Quản lý lịch hẹn</li>
              <li>✅ Hồ sơ bệnh nhân</li>
              <li>✅ Báo cáo &amp; phân tích</li>
              <li>✅ Hỗ trợ ưu tiên 24/7</li>
            </ul>
            {!isPlus && (
              <button
                type="button"
                onClick={() => switchPlan("HOLORA_PLUS")}
                disabled={upgrading}
                className="w-full mt-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {upgrading ? "Đang xử lý..." : "Nâng cấp ngay"}
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-text-dim mt-4">
          Xem chi tiết tại{" "}
          <button type="button" onClick={() => navigate("/pricing")} className="text-blue-500 hover:text-blue-700 underline bg-transparent border-none p-0 cursor-pointer">
            trang bảng giá
          </button>
        </p>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <PaymentModal
          plan={PLUS_PLAN}
          months={1}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={confirmDowngradeOpen}
        title="Hạ xuống Holora Free?"
        description="Giới hạn 3 chi nhánh và 3 bác sĩ mỗi chi nhánh sẽ được áp dụng ngay sau khi chuyển gói."
        badgeLabel="Subscription"
        tone="danger"
        confirmLabel="Xác nhận hạ gói"
        cancelLabel="Hủy"
        closeLabel="Đóng"
        onConfirm={confirmDowngrade}
        onClose={() => setConfirmDowngradeOpen(false)}
      />
    </div>
  );
};

export default SubscriptionPage;
