import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import branchService from "../../services/branchService";
import subscriptionService from "../../services/subscriptionService";
import PaymentModal from "../../components/PaymentModal";

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
    if (!window.confirm("Hạ xuống Holora Free? Giới hạn 3 chi nhánh và 3 bác sĩ/chi nhánh sẽ được áp dụng.")) return;
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
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setMessage("Nâng cấp lên Holora Plus thành công! 🎉");
    await loadData();
  };

  if (loading) return <div className="sub-page"><p style={{ color: "#94a3b8", padding: "48px 0" }}>Đang tải...</p></div>;

  return (
    <div className="sub-page">
      <div className="sub-header">
        <h1 className="sub-header__title">Gói dịch vụ</h1>
        <p className="sub-header__subtitle">Quản lý gói Holora của bạn</p>
      </div>

      {message && <div className="sub-alert sub-alert--ok">{message}</div>}
      {error && <div className="sub-alert sub-alert--err">{error}</div>}

      {/* Active plan summary */}
      <div className="sub-plan-card" style={{ "--plan-color": meta.color }}>
        <div className="sub-plan-card__left">
          <span className="sub-plan-card__icon" role="img" aria-label="plan">{meta.icon}</span>
          <div>
            <div className="sub-plan-card__name">{accountSub?.plan_name || "Holora Free"}</div>
            <div className="sub-plan-card__tagline">{meta.tagline}</div>
          </div>
        </div>
        <span className={(accountSub && STATUS_STYLE[accountSub.status]?.cls) || "sub-badge sub-badge--active"}>
          {(accountSub && STATUS_STYLE[accountSub.status]?.label) || "Đang hoạt động"}
        </span>
      </div>

      {/* Usage (only for Free tier) */}
      {!isPlus && (
        <div className="sub-usage">
          <h2 className="sub-usage__title">Mức sử dụng</h2>
          <div className="sub-usage__row">
            <span className="sub-usage__label">Chi nhánh</span>
            <div className="sub-usage__bar-wrap">
              <div
                className="sub-usage__bar-fill"
                style={{
                  width: `${usagePercent}%`,
                  background: branchUsed >= branchLimit ? "#ef4444" : meta.color,
                }}
              />
            </div>
            <span className="sub-usage__count">{branchUsed} / {branchLimit}</span>
          </div>
          <p className="sub-usage__note">Giới hạn bác sĩ: 3 bác sĩ / chi nhánh</p>
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <h2 className="sub-compare__title">Các gói dịch vụ</h2>
        <div className="sub-compare__cards">

          {/* FREE */}
          <div className={`sub-cmp-card${!isPlus ? " sub-cmp-card--active" : ""}`}>
            {!isPlus && <div className="sub-cmp-card__cur">Gói hiện tại</div>}
            <div className="sub-cmp-card__name">🏥 Holora Free</div>
            <div className="sub-cmp-card__price">Miễn phí</div>
            <ul className="sub-cmp-card__features">
              <li>✅ Tối đa 3 chi nhánh</li>
              <li>✅ Tối đa 3 bác sĩ / chi nhánh</li>
              <li>✅ Quản lý lịch hẹn</li>
              <li>✅ Hồ sơ bệnh nhân</li>
              <li>❌ Chi nhánh không giới hạn</li>
              <li>❌ Bác sĩ không giới hạn</li>
            </ul>
            {isPlus && (
              <button type="button" className="sub-cmp-card__btn sub-cmp-card__btn--sec" onClick={() => switchPlan("HOLORA_FREE")} disabled={upgrading}>
                Hạ xuống Free
              </button>
            )}
          </div>

          {/* PLUS */}
          <div className={`sub-cmp-card sub-cmp-card--plus${isPlus ? " sub-cmp-card--active" : ""}`}>
            {isPlus && <div className="sub-cmp-card__cur">Gói hiện tại</div>}
            {!isPlus && <div className="sub-cmp-card__pop">Phổ biến nhất</div>}
            <div className="sub-cmp-card__name">⭐ Holora Plus</div>
            <div className="sub-cmp-card__price">
              299.000 ₫<span className="sub-cmp-card__price-suf"> / tháng</span>
            </div>
            <ul className="sub-cmp-card__features">
              <li>✅ Chi nhánh không giới hạn</li>
              <li>✅ Bác sĩ không giới hạn</li>
              <li>✅ Quản lý lịch hẹn</li>
              <li>✅ Hồ sơ bệnh nhân</li>
              <li>✅ Báo cáo &amp; phân tích</li>
              <li>✅ Hỗ trợ ưu tiên 24/7</li>
            </ul>
            {!isPlus && (
              <button type="button" className="sub-cmp-card__btn sub-cmp-card__btn--pri" onClick={() => switchPlan("HOLORA_PLUS")} disabled={upgrading}>
                {upgrading ? "Đang xử lý..." : "Nâng cấp ngay"}
              </button>
            )}
          </div>
        </div>

        <p className="sub-pricing-link">
          Xem chi tiết tại{" "}
          <button type="button" className="sub-link" onClick={() => navigate("/pricing")}>
            trang bảng giá
          </button>
        </p>
      </div>

      <style>{`
        .sub-page { display:flex; flex-direction:column; gap:24px; max-width:680px; }
        .sub-header__title { font-size:24px; font-weight:700; color:#1e293b; margin:0 0 4px; }
        .sub-header__subtitle { font-size:14px; color:#64748b; margin:0; }

        .sub-alert { padding:12px 16px; border-radius:10px; font-size:14px; }
        .sub-alert--ok { background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; }
        .sub-alert--err { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; }

        .sub-plan-card {
          background:linear-gradient(135deg,#f8fafc,#fff);
          border:2px solid var(--plan-color,#3b82f6);
          border-radius:16px; padding:20px 24px;
          display:flex; align-items:center; justify-content:space-between; gap:16px;
        }
        .sub-plan-card__left { display:flex; align-items:center; gap:16px; }
        .sub-plan-card__icon { font-size:36px; line-height:1; }
        .sub-plan-card__name { font-size:20px; font-weight:700; color:#1e293b; }
        .sub-plan-card__tagline { font-size:13px; color:#64748b; }

        .sub-badge { display:inline-flex; align-items:center; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; }
        .sub-badge--active { background:#dcfce7; color:#15803d; }
        .sub-badge--trial  { background:#fef9c3; color:#a16207; }
        .sub-badge--warn   { background:#ffedd5; color:#c2410c; }
        .sub-badge--off    { background:#f1f5f9; color:#64748b; }

        .sub-usage { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px 24px; }
        .sub-usage__title { font-size:16px; font-weight:600; color:#1e293b; margin:0 0 16px; }
        .sub-usage__row { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
        .sub-usage__label { font-size:14px; color:#64748b; width:80px; flex-shrink:0; }
        .sub-usage__bar-wrap { flex:1; height:8px; background:#e2e8f0; border-radius:999px; overflow:hidden; }
        .sub-usage__bar-fill { height:100%; border-radius:999px; transition:width .4s ease; }
        .sub-usage__count { font-size:13px; font-weight:600; color:#374151; width:48px; text-align:right; }
        .sub-usage__note { font-size:13px; color:#94a3b8; }

        .sub-compare__title { font-size:18px; font-weight:700; color:#1e293b; margin:0 0 16px; }
        .sub-compare__cards { display:flex; gap:20px; flex-wrap:wrap; }

        .sub-cmp-card {
          position:relative; flex:1; min-width:220px;
          background:#f8fafc; border:2px solid #e2e8f0;
          border-radius:16px; padding:28px 20px 20px;
          display:flex; flex-direction:column; gap:12px;
        }
        .sub-cmp-card--active { border-color:#3b82f6; background:#eff6ff; }
        .sub-cmp-card--plus.sub-cmp-card--active { border-color:#6366f1; background:#eef2ff; }
        .sub-cmp-card__cur {
          position:absolute; top:-12px; left:50%; transform:translateX(-50%);
          background:#3b82f6; color:#fff; font-size:11px; font-weight:700;
          padding:3px 14px; border-radius:999px; white-space:nowrap;
        }
        .sub-cmp-card--plus .sub-cmp-card__cur { background:#6366f1; }
        .sub-cmp-card__pop {
          position:absolute; top:-12px; right:16px;
          background:linear-gradient(90deg,#3b82f6,#6366f1);
          color:#fff; font-size:10px; font-weight:700;
          padding:3px 12px; border-radius:999px; white-space:nowrap;
        }
        .sub-cmp-card__name { font-size:17px; font-weight:700; color:#1e293b; }
        .sub-cmp-card__price { font-size:22px; font-weight:800; color:#1e293b; }
        .sub-cmp-card--plus .sub-cmp-card__price { color:#4f46e5; }
        .sub-cmp-card__price-suf { font-size:13px; font-weight:400; color:#94a3b8; }
        .sub-cmp-card__features { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; font-size:14px; color:#374151; flex:1; }
        .sub-cmp-card__btn { width:100%; padding:10px 0; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s; border:none; margin-top:auto; }
        .sub-cmp-card__btn--pri { background:linear-gradient(90deg,#3b82f6,#6366f1); color:#fff; }
        .sub-cmp-card__btn--pri:hover { opacity:.9; }
        .sub-cmp-card__btn--pri:disabled { opacity:.6; cursor:not-allowed; }
        .sub-cmp-card__btn--sec { background:transparent; border:1.5px solid #94a3b8; color:#64748b; }
        .sub-cmp-card__btn--sec:hover { background:#f1f5f9; }

        .sub-pricing-link { font-size:13px; color:#64748b; margin:16px 0 0; }
        .sub-link { background:none; border:none; padding:0; cursor:pointer; color:#3b82f6; font-size:inherit; text-decoration:underline; }
        .sub-link:hover { color:#1d4ed8; }
      `}</style>

      {/* Payment modal — rendered outside the card flow */}
      {showPaymentModal && (
        <PaymentModal
          plan={PLUS_PLAN}
          months={1}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
