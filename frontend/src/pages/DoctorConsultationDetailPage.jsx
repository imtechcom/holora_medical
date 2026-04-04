import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, AlertCircle, ArrowLeft, Brain, Calendar, CheckCircle,
  ChevronDown, ChevronUp, Clock, Eye, EyeOff, FileText, Image,
  Loader2, Lock, MessageSquare, RefreshCw, Send, Shield,
  Sparkles, Stethoscope, TrendingUp, User, XCircle,
} from "lucide-react";
import { consultationService } from "../services/consultationService";
import { aiService } from "../services/aiService";
import { createPrescriptionApi, getPrescriptionsByConsultationApi, updatePrescriptionApi, issuePrescriptionApi, cancelPrescriptionApi } from "../services/prescriptionService";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import PrescriptionFormModal from "../components/PrescriptionFormModal";
import PrescriptionCard from "../components/PrescriptionCard";
import PrescriptionDetailModal from "../components/PrescriptionDetailModal";

/* ─────────── Design Tokens (shared system) ──────────────── */
const C_STATUS = {
  pending:     { label: "Pending",     color: "amber",   icon: Clock },
  in_progress: { label: "In Progress", color: "sky",     icon: TrendingUp },
  completed:   { label: "Completed",   color: "emerald", icon: CheckCircle },
};

const PILL = {
  amber:   "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-700/40",
  emerald: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-700/40",
  sky:     "bg-sky-100/80 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-900/25 dark:text-sky-300 dark:ring-sky-700/40",
  blue:    "bg-blue-100/80 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-900/25 dark:text-blue-300 dark:ring-blue-700/40",
  purple:  "bg-purple-100/80 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-900/25 dark:text-purple-300 dark:ring-purple-700/40",
  red:     "bg-red-100/80 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/25 dark:text-red-300 dark:ring-red-700/40",
  slate:   "bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-600/40",
};

const GLASS = "backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/40 shadow-lg shadow-black/[0.03]";
const GLASS_CARD = `rounded-2xl ${GLASS}`;

const REVIEW_STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "amber", icon: Eye },
  approved:       { label: "Approved · Shared", color: "emerald", icon: CheckCircle },
  approved_watch: { label: "Approved · Watch · Shared", color: "sky", icon: Eye },
  not_standard:   { label: "Not Standard", color: "red", icon: XCircle },
  revoked:        { label: "Revoked", color: "slate", icon: Lock },
};

/* ─────────── Helpers ────────────────────────────────────── */
const fmtDateTime = (v, lng) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(lng === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const calcAge = (dob) => {
  if (!dob) return "—";
  return Math.max(0, new Date().getFullYear() - new Date(dob).getFullYear());
};

/* ─────────── Sub-components ─────────────────────────────── */
const Pulse = ({ className }) => <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;

const RiskBadge = ({ level, t: _t }) => {
  const map = {
    low:    { label: _t("doctor.consultationDetail.risk.low",    { defaultValue: "Low Risk" }),    cls: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-300" },
    medium: { label: _t("doctor.consultationDetail.risk.medium", { defaultValue: "Medium Risk" }), cls: "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/20 dark:text-amber-300" },
    high:   { label: _t("doctor.consultationDetail.risk.high",   { defaultValue: "High Risk" }),   cls: "bg-red-100/80 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/20 dark:text-red-300 animate-pulse" },
  };
  const cfg = map[level];
  if (!cfg) return null;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
};

/* ══════════════════════════════════════════════════════════
   DoctorConsultationDetailPage
   Bento Grid · Glassmorphism · Progressive Disclosure
   ══════════════════════════════════════════════════════════ */
const DoctorConsultationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { role } = useAuth();

  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyType, setReplyType] = useState("message");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reopenSubmitting, setReopenSubmitting] = useState(false);
  const [requestAILoading, setRequestAILoading] = useState(null);
  const [confirmAiImageId, setConfirmAiImageId] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: "approved", note: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showRxForm, setShowRxForm] = useState(false);
  const [editingRx, setEditingRx] = useState(null);
  const [viewRxDetail, setViewRxDetail] = useState(null);

  const sLabel = (status) => {
    const key = status === "in_progress" ? "inProgress" : status;
    return t(`doctor.consultationsPage.status.${key}`, { defaultValue: C_STATUS[status]?.label || status });
  };

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await consultationService.getConsultationDetails(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.consultationDetail.errors.loadFailed", { defaultValue: "Failed to load" }));
    } finally { setLoading(false); }
  }, [id, t]);

  const fetchAiData = useCallback(async () => {
    try {
      const res = await aiService.getAnalysisForConsultation(id);
      setAiData(res.data || []);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { fetchDetail(); fetchAiData(); }, [fetchDetail, fetchAiData]);

  /* ── Prescriptions ── */
  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await getPrescriptionsByConsultationApi(id);
      setPrescriptions(res.data || []);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  /* ── AI request ── */
  const startRequestAI = async (imageId) => {
    setRequestAILoading(imageId);
    try {
      await aiService.requestImageAnalysis(id, imageId);
      await fetchAiData();
      const interval = setInterval(async () => {
        const currentRes = await aiService.getAnalysisForConsultation(id);
        const updated = currentRes.data.find(a => a.consultation_image_id === imageId);
        if (updated && updated.request_status !== "processing" && updated.request_status !== "queued") {
          setAiData(currentRes.data);
          clearInterval(interval);
        } else {
          setAiData(currentRes.data);
        }
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRequestAILoading(null);
      setConfirmAiImageId(null);
    }
  };

  /* ── Review submit ── */
  const handleSubmitReview = async (requestId) => {
    setReviewSubmitting(true);
    try {
      await aiService.reviewAIResult(requestId, { review_status: reviewForm.status, review_note: reviewForm.note });
      setReviewingRequestId(null);
      await fetchAiData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setReviewSubmitting(false); }
  };

  /* ── Reply ── */
  const handleReplySubmit = async (e, markComplete = false) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await consultationService.addResponse(id, { content: replyText, response_type: replyType, complete: markComplete });
      setReplyText("");
      setReplyType("message");
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setIsSubmitting(false); }
  };

  /* ── Reopen ── */
  const handleReopenCase = async () => {
    setReopenSubmitting(true);
    try {
      await consultationService.reopenConsultation(id);
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setReopenSubmitting(false); }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Pulse className="h-10 w-32" />
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 animate-pulse">
          <Pulse className="h-3 w-20 mb-4 !bg-slate-700" />
          <Pulse className="h-8 w-64 mb-3 !bg-slate-700" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[1,2,3,4].map(i => <Pulse key={i} className="h-16 !bg-white/5 !rounded-xl" />)}
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-5"><Pulse className="h-64 rounded-2xl" /><Pulse className="h-48 rounded-2xl" /></div>
          <div className="lg:col-span-7 space-y-5"><Pulse className="h-80 rounded-2xl" /><Pulse className="h-20 rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate("/doctor/consultations")}
          className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", { defaultValue: "Back" })}
        </button>
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const st = C_STATUS[data.status] || C_STATUS.pending;
  const StIcon = st.icon;
  const completedAI = aiData.filter(a => a.request_status === "completed");

  return (
    <div className="mx-auto max-w-7xl space-y-5">

      {/* ── Back ── */}
      <button onClick={() => navigate("/doctor/consultations")}
        className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app">
        <ArrowLeft className="h-4 w-4" />
        {t("doctor.consultationDetail.backToList", { defaultValue: "All Consultations" })}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900/40 p-6 text-white shadow-2xl sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE4YzEgMSAxIDMgMCA0bC0yIDJjLTEgMS0zIDEtNCAwbC0yLTJjLTEtMS0xLTMgMC00bDItMmMxLTEgMy0xIDQgMGwyIDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> {t("doctor.zone", { defaultValue: "Doctor Zone" })}
            </p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-300">
              #{data.id}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("doctor.consultationDetail.title", { defaultValue: "Consultation Details" })}
            </h1>
            <span className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold ${PILL[st.color] || ""}`}>
              <StIcon className="h-4 w-4" /> {sLabel(data.status)}
            </span>
          </div>

          {/* Bento mini-stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: User, label: t("doctor.consultationDetail.patient", { defaultValue: "Patient" }), value: data.patient_name || "—" },
              { icon: Calendar, label: t("doctor.consultationDetail.created", { defaultValue: "Created" }), value: fmtDateTime(data.created_at, lng) },
              { icon: Brain, label: t("doctor.consultationDetail.aiAnalysis", { defaultValue: "AI Analysis" }), value: `${completedAI.length} / ${data.images?.length || 0}` },
              { icon: MessageSquare, label: t("doctor.consultationDetail.responses", { defaultValue: "Responses" }), value: String(data.responses?.length || 0) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <item.icon className="h-3 w-3 text-cyan-400" /> {item.label}
                </div>
                <p className="mt-1 text-sm font-bold text-white truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: Main content ── */}
      <div className="grid gap-5 lg:grid-cols-12">

        {/* ── LEFT COLUMN (5 cols): Patient + Images + AI ── */}
        <div className="space-y-5 lg:col-span-5">

          {/* Patient Info Card */}
          <div className={`${GLASS_CARD} p-6`}>
            <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
              <User className="h-5 w-5 text-cyan-500" />
              {t("doctor.consultationDetail.patientInfo", { defaultValue: "Patient Information" })}
            </h2>
            <div className="mt-5 space-y-4">
              {[
                { label: t("doctor.consultationDetail.patientName", { defaultValue: "Name" }), value: data.patient_name },
                { label: t("doctor.consultationDetail.ageGender", { defaultValue: "Age / Gender" }), value: `${calcAge(data.date_of_birth)} ${t("doctor.consultationDetail.yearsOld", { defaultValue: "years" })} / ${data.gender || "—"}` },
                { label: t("doctor.consultationDetail.medicalHistory", { defaultValue: "Medical History" }), value: data.medical_history || t("doctor.consultationDetail.notAvailable", { defaultValue: "Not available" }) },
                { label: t("doctor.consultationDetail.allergies", { defaultValue: "Allergies" }), value: data.allergies || t("doctor.consultationDetail.notAvailable", { defaultValue: "Not available" }) },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">{row.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-main">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chief Complaint Card */}
          <div className={`${GLASS_CARD} p-6`}>
            <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
              <Stethoscope className="h-5 w-5 text-rose-500" />
              {t("doctor.consultationDetail.symptoms", { defaultValue: "Symptoms" })}
            </h2>
            <div className="mt-4 rounded-xl border-l-4 border-rose-400 bg-rose-50/50 p-4 dark:bg-rose-900/10">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{data.chief_complaint}</p>
            </div>
            {data.symptoms && (
              <div className="mt-3 rounded-xl bg-bg-app/50 p-4 dark:bg-slate-800/50">
                <p className="text-sm leading-relaxed text-text-main">{data.symptoms}</p>
              </div>
            )}
          </div>

          {/* Linked Appointment */}
          {data.appointment_id && (
            <div className={`${GLASS_CARD} overflow-hidden`}>
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-3 dark:from-violet-900/20 dark:to-purple-900/20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  {t("doctor.consultationDetail.linkedAppointment", { defaultValue: "Linked Appointment" })}
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-text-dim mb-3">
                  {t("doctor.consultationDetail.appointmentRef", { defaultValue: "This consultation was created from appointment" })}
                  {" "}<span className="font-mono font-bold text-violet-600 dark:text-violet-400">#{data.appointment_id}</span>
                </p>
                <button onClick={() => navigate(`/doctor/appointments/${data.appointment_id}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-600">
                  {t("doctor.consultationDetail.viewAppointment", { defaultValue: "View Appointment" })}
                </button>
              </div>
            </div>
          )}

          {/* ── IMAGES & AI ANALYSIS ── */}
          {data.images && data.images.length > 0 && (
            <div className={`${GLASS_CARD} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
                  <Image className="h-5 w-5 text-indigo-500" />
                  {t("doctor.consultationDetail.clinicalImages", { defaultValue: "Clinical Images" })}
                </h2>
                <button onClick={fetchAiData}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-main/60 px-2.5 py-1.5 text-[11px] font-semibold text-text-dim transition hover:bg-bg-app">
                  <RefreshCw className="h-3 w-3" /> {t("common.refresh", { defaultValue: "Refresh" })}
                </button>
              </div>

              <div className="space-y-4">
                {data.images.map((img, idx) => {
                  const aiResult = aiData?.find(a => a.consultation_image_id === img.id);
                  const isProcessing = aiResult?.request_status === "processing" || aiResult?.request_status === "queued";
                  const isCompleted = aiResult?.request_status === "completed";
                  const isFailed = aiResult?.request_status === "failed";
                  const reviewStatus = aiResult?.doctor_review_status || "pending_review";
                  const reviewCfg = REVIEW_STATUS_CONFIG[reviewStatus];
                  const ReviewIcon = reviewCfg?.icon || Eye;
                  const isReviewing = reviewingRequestId === aiResult?.request_id;
                  const isExpanded = expandedImage === idx;

                  return (
                    <div key={idx} className="rounded-xl border border-border-main/50 overflow-hidden dark:border-slate-700/50">
                      {/* Image Header */}
                      <div className="flex items-center justify-between bg-bg-app/60 px-4 py-2.5 dark:bg-slate-800/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-dim">
                          {t("doctor.consultationDetail.imageNum", { defaultValue: "Image" })} #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {isProcessing && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {t("doctor.consultationDetail.aiProcessing", { defaultValue: "AI analyzing..." })}
                            </span>
                          )}
                          {isCompleted && <RiskBadge level={aiResult.risk_level} t={t} />}
                          {isFailed && (
                            <span className="text-[10px] font-semibold text-red-500">
                              {t("doctor.consultationDetail.aiFailed", { defaultValue: "AI Error" })}
                            </span>
                          )}
                          {!aiResult && (
                            <span className="text-[10px] text-text-dim">
                              {t("doctor.consultationDetail.notAnalyzed", { defaultValue: "Not analyzed" })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Image + Preprocessed side by side */}
                      <div className="grid grid-cols-2 divide-x divide-border-main/30 dark:divide-slate-700/30">
                        {/* Original */}
                        <div>
                          <div className="bg-slate-50/60 px-3 py-1.5 text-center border-b border-border-main/30 dark:bg-slate-900/30">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
                              {t("doctor.consultationDetail.original", { defaultValue: "Original" })}
                            </span>
                          </div>
                          <div className="aspect-square overflow-hidden bg-bg-app dark:bg-slate-800 group">
                            <img src={img.image_url} alt={`Image ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          </div>
                        </div>
                        {/* Preprocessed (Phase 2) */}
                        <div>
                          <div className="bg-violet-50/60 px-3 py-1.5 text-center border-b border-border-main/30 dark:bg-violet-900/10 flex items-center justify-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                              {t("doctor.consultationDetail.preprocessed", { defaultValue: "Preprocessed" })}
                            </span>
                            <span className="rounded bg-violet-200/80 px-1.5 py-0.5 text-[7px] font-bold uppercase text-violet-700 dark:bg-violet-800/40 dark:text-violet-300">
                              {t("doctor.consultationDetail.comingSoon", { defaultValue: "Soon" })}
                            </span>
                          </div>
                          <div className="aspect-square flex flex-col items-center justify-center bg-violet-50/30 dark:bg-violet-900/5 gap-2 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20">
                              <Brain className="h-5 w-5 text-violet-500" />
                            </div>
                            <p className="text-[9px] font-bold text-violet-600 dark:text-violet-300">
                              {t("doctor.consultationDetail.preprocess", { defaultValue: "Image Preprocessing" })}
                            </p>
                            <p className="text-[8px] text-violet-400 text-center leading-relaxed">
                              {t("doctor.consultationDetail.preprocessDesc", { defaultValue: "Denoise · Histogram · Contrast" })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-2 divide-x divide-border-main/30 dark:divide-slate-700/30 border-t border-border-main/30 text-[10px]">
                        {/* Preprocessing metrics */}
                        <div className="px-3 py-2.5 bg-violet-50/30 dark:bg-violet-900/5">
                          <p className="font-bold text-[9px] uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">
                            {t("doctor.consultationDetail.preprocessMetrics", { defaultValue: "Preprocess (Phase 2)" })}
                          </p>
                          <div className="space-y-1 text-text-dim">
                            {["Noise (dB)", "Contrast", "Sharpness", "Method"].map(m => (
                              <div key={m} className="flex justify-between"><span>{m}</span><span className="font-mono text-violet-300">—</span></div>
                            ))}
                          </div>
                        </div>
                        {/* AI metrics */}
                        <div className="px-3 py-2.5 bg-indigo-50/30 dark:bg-indigo-900/5">
                          <p className="font-bold text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                            {t("doctor.consultationDetail.aiMetrics", { defaultValue: "AI Analysis" })}
                          </p>
                          <div className="space-y-1 text-text-dim">
                            <div className="flex justify-between">
                              <span>{t("doctor.consultationDetail.riskLevel", { defaultValue: "Risk" })}</span>
                              {isCompleted ? <span className="font-bold font-mono uppercase">{aiResult.risk_level || "—"}</span> : <span className="font-mono text-indigo-200">—</span>}
                            </div>
                            <div className="flex justify-between">
                              <span>{t("doctor.consultationDetail.confidence", { defaultValue: "Confidence" })}</span>
                              {isCompleted ? <span className="font-bold font-mono">{aiResult.confidence_score}%</span> : <span className="font-mono text-indigo-200">—</span>}
                            </div>
                            <div className="flex justify-between">
                              <span>{t("doctor.consultationDetail.finding", { defaultValue: "Finding" })}</span>
                              {isCompleted ? <span className="font-mono text-emerald-600 font-bold">✓</span> : <span className="font-mono text-indigo-200">—</span>}
                            </div>
                            <div className="flex justify-between">
                              <span>{t("doctor.consultationDetail.suggestion", { defaultValue: "Suggestion" })}</span>
                              {isCompleted ? <span className="font-mono text-emerald-600 font-bold">✓</span> : <span className="font-mono text-indigo-200">—</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="border-t border-border-main/30 bg-bg-app/40 dark:bg-slate-900/30">
                        <div className="flex items-center gap-2 px-4 py-2.5">
                          {!aiResult && (
                            <button onClick={() => setConfirmAiImageId(img.id)}
                              disabled={requestAILoading === img.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:from-purple-600 hover:to-indigo-700 disabled:opacity-60">
                              {requestAILoading === img.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                              {t("doctor.consultationDetail.runAI", { defaultValue: "Run AI Analysis" })}
                            </button>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="inline h-3 w-3 mr-1" />
                              {t("doctor.consultationDetail.aiComplete", { defaultValue: "AI analysis complete" })}
                            </span>
                          )}
                          {isProcessing && (
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                              {t("doctor.consultationDetail.processing", { defaultValue: "Processing..." })}
                            </span>
                          )}
                          {isFailed && (
                            <span className="text-[10px] font-semibold text-red-500">
                              {t("doctor.consultationDetail.analysisFailed", { defaultValue: "Analysis failed" })}
                            </span>
                          )}
                        </div>

                        {/* Doctor Review Section */}
                        {isCompleted && role !== "patient" && (
                          <div className="border-t border-border-main/30 px-4 py-3">
                            {!isReviewing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${PILL[reviewCfg?.color || "amber"]}`}>
                                  <ReviewIcon className="h-3 w-3" />
                                  {t(`doctor.consultationDetail.review.${reviewStatus}`, { defaultValue: reviewCfg?.label || reviewStatus })}
                                </span>
                                {aiResult.shared_with_patient === 1 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100/60 px-2 py-0.5 text-[9px] font-semibold text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                    <Eye className="h-2.5 w-2.5" /> {t("doctor.consultationDetail.patientViewing", { defaultValue: "Patient viewing" })}
                                  </span>
                                )}
                                <button onClick={() => {
                                  setReviewingRequestId(aiResult.request_id);
                                  setReviewForm({ status: reviewStatus === "pending_review" ? "approved" : reviewStatus, note: aiResult.review_note || "" });
                                }}
                                  className="ml-auto text-[10px] font-bold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400">
                                  {reviewStatus === "pending_review"
                                    ? t("doctor.consultationDetail.addReview", { defaultValue: "+ Review" })
                                    : t("doctor.consultationDetail.editReview", { defaultValue: "Edit" })}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
                                  {t("doctor.consultationDetail.reviewAIResult", { defaultValue: "Review AI Result" })}
                                </p>
                                <select value={reviewForm.status} onChange={(e) => setReviewForm(f => ({ ...f, status: e.target.value }))}
                                  className="w-full rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-xs text-text-main dark:bg-slate-800">
                                  <option value="approved">{t("doctor.consultationDetail.review.approved", { defaultValue: "Approved – Share" })}</option>
                                  <option value="approved_watch">{t("doctor.consultationDetail.review.approved_watch", { defaultValue: "Approved – Watch – Share" })}</option>
                                  <option value="not_standard">{t("doctor.consultationDetail.review.not_standard", { defaultValue: "Not Standard – Don't Share" })}</option>
                                  <option value="revoked">{t("doctor.consultationDetail.review.revoked", { defaultValue: "Revoke Access" })}</option>
                                  <option value="pending_review">{t("doctor.consultationDetail.review.pending_review", { defaultValue: "Pending Review" })}</option>
                                </select>
                                <textarea value={reviewForm.note} onChange={(e) => setReviewForm(f => ({ ...f, note: e.target.value }))}
                                  placeholder={t("doctor.consultationDetail.reviewNotePlaceholder", { defaultValue: "Doctor's note (optional)..." })}
                                  rows="2"
                                  className="w-full resize-none rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-xs text-text-main dark:bg-slate-800" />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setReviewingRequestId(null)}
                                    className="rounded-lg border border-border-main px-3 py-1.5 text-xs font-semibold text-text-dim transition hover:bg-bg-app">
                                    {t("common.cancel", { defaultValue: "Cancel" })}
                                  </button>
                                  <button onClick={() => handleSubmitReview(aiResult.request_id)}
                                    disabled={reviewSubmitting}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                                    {reviewSubmitting ? t("common.saving", { defaultValue: "Saving..." }) : t("common.save", { defaultValue: "Save" })}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expandable AI Detail */}
                      {isCompleted && (
                        <div className="border-t border-border-main/30">
                          <button onClick={() => setExpandedImage(isExpanded ? null : idx)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-50/30 dark:text-indigo-400 dark:hover:bg-indigo-900/10">
                            <span className="flex items-center gap-1.5">
                              <Brain className="h-3.5 w-3.5" />
                              {t("doctor.consultationDetail.aiDetails", { defaultValue: "AI Findings & Recommendations" })}
                            </span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3">
                              <div className="rounded-xl bg-indigo-50/50 p-4 dark:bg-indigo-900/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                                  {t("doctor.consultationDetail.finding", { defaultValue: "Finding" })}
                                </p>
                                <p className="text-sm leading-relaxed text-text-main">{aiResult.result_summary}</p>
                              </div>
                              <div className="rounded-xl bg-emerald-50/50 p-4 dark:bg-emerald-900/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                                  {t("doctor.consultationDetail.recommendation", { defaultValue: "Recommendation" })}
                                </p>
                                <p className="text-sm leading-relaxed text-text-main">{aiResult.recommendation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

          {/* ── Prescriptions Section ── */}
          {(role === "doctor" || role === "super_admin" || role === "admin") && (
            <div className={`${GLASS_CARD} overflow-hidden`}>
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-6 py-4 dark:from-emerald-900/20 dark:to-teal-900/20">
                <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
                  <Stethoscope className="h-5 w-5 text-emerald-500" />
                  {t("prescription.sectionTitle", { defaultValue: "Toa thuốc" })}
                  {prescriptions.length > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">{prescriptions.length}</span>
                  )}
                </h2>
                {data.status !== "completed" && (
                  <button
                    onClick={() => { setEditingRx(null); setShowRxForm(true); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t("prescription.createBtn", { defaultValue: "Kê toa" })}
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {prescriptions.length === 0 ? (
                  <p className="text-center text-sm text-text-dim py-4">
                    {t("prescription.empty", { defaultValue: "Chưa có toa thuốc nào." })}
                  </p>
                ) : (
                  prescriptions.map((rx) => (
                    <PrescriptionCard
                      key={rx.id}
                      prescription={rx}
                      showActions
                      onViewDetail={(p) => setViewRxDetail(p)}
                      onEdit={(p) => { setEditingRx(p); setShowRxForm(true); }}
                      onIssue={async (rxId) => {
                        try { await issuePrescriptionApi(rxId); await fetchPrescriptions(); } catch { /* silent */ }
                      }}
                      onCancel={async (rxId) => {
                        try { await cancelPrescriptionApi(rxId); await fetchPrescriptions(); } catch { /* silent */ }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

        {/* ── RIGHT COLUMN (7 cols): AI Summary + Chat ── */}
        <div className="space-y-5 lg:col-span-7">

          {/* AI Summary Card */}
          {completedAI.length > 0 && (
            <div className={`${GLASS_CARD} overflow-hidden`}>
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-6 py-4 dark:from-indigo-900/20 dark:to-purple-900/20">
                <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
                  <Brain className="h-5 w-5 text-indigo-500" />
                  {t("doctor.consultationDetail.aiReport", { defaultValue: "AI Analysis Report" })}
                </h2>
                <p className="mt-1 text-xs text-text-dim">
                  {t("doctor.consultationDetail.aiReportDesc", { defaultValue: "Summary of AI model analysis across all images" })}
                </p>
              </div>
              <div className="p-6 space-y-4">
                {completedAI.map((res, i) => (
                  <div key={i} className="rounded-xl border border-border-main/50 bg-bg-app/40 p-4 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-text-main">
                        {t("doctor.consultationDetail.imageId", { defaultValue: "Image" })} #{res.consultation_image_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-dim">{res.confidence_score}%</span>
                        <RiskBadge level={res.risk_level} t={t} />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-text-main mb-2">
                      <span className="font-bold">{t("doctor.consultationDetail.finding", { defaultValue: "Finding" })}:</span> {res.result_summary}
                    </p>
                    <div className="rounded-lg bg-indigo-50/60 p-3 dark:bg-indigo-900/10">
                      <p className="text-sm leading-relaxed text-indigo-700 dark:text-indigo-300">
                        <span className="font-bold">{t("doctor.consultationDetail.suggestion", { defaultValue: "Suggestion" })}:</span> {res.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CHAT INTERFACE ── */}
          <div className={`${GLASS_CARD} flex flex-col overflow-hidden`} style={{ minHeight: "500px" }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-6 py-4 dark:from-cyan-900/20 dark:to-teal-900/20">
              <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
                <MessageSquare className="h-5 w-5 text-cyan-500" />
                {t("doctor.consultationDetail.chatTitle", { defaultValue: "Diagnosis & Consultation History" })}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: "500px" }}>
              {data.responses && data.responses.length > 0 ? (
                data.responses.map((resp) => {
                  const isDoctor = resp.responder_role === "doctor" || resp.responder_role === "admin" || resp.responder_role === "super_admin";
                  return (
                    <div key={resp.id} className={`flex flex-col max-w-[85%] ${isDoctor ? "ml-auto items-end" : "items-start"}`}>
                      <span className="text-[10px] text-text-dim mb-1 font-semibold">
                        {resp.responder_name} · {new Date(resp.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        isDoctor
                          ? resp.response_type === "diagnosis"
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm"
                          : "bg-bg-app text-text-main dark:bg-slate-700/60"
                      }`}>
                        {resp.response_type === "diagnosis" && (
                          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1">
                            <Activity className="h-3 w-3" /> {t("doctor.consultationDetail.msgType.diagnosis", { defaultValue: "Medical Conclusion" })}
                          </div>
                        )}
                        {resp.response_type === "recommendation" && (
                          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                            {t("doctor.consultationDetail.msgType.recommendation", { defaultValue: "Recommendation" })}
                          </div>
                        )}
                        {resp.response_type === "prescription_note" && (
                          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                            {t("doctor.consultationDetail.msgType.prescription", { defaultValue: "Prescription Note" })}
                          </div>
                        )}
                        <p className="whitespace-pre-line leading-relaxed">{resp.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-text-dim">
                  <MessageSquare className="h-10 w-10 text-text-dim/30 mb-3" />
                  <p className="text-sm">{t("doctor.consultationDetail.noMessages", { defaultValue: "No messages yet." })}</p>
                </div>
              )}
            </div>

            {/* Reply Form */}
            {data.status !== "completed" ? (
              <form className="border-t border-border-main/40 bg-bg-app/40 p-4 dark:bg-slate-800/40">
                {(role === "doctor" || role === "super_admin" || role === "admin") && (
                  <div className="mb-3">
                    <select value={replyType} onChange={(e) => setReplyType(e.target.value)}
                      className="rounded-xl border border-border-main/60 bg-bg-surface px-3 py-2 text-xs font-medium text-text-main dark:bg-slate-800">
                      <option value="message">{t("doctor.consultationDetail.replyType.message", { defaultValue: "Message" })}</option>
                      <option value="diagnosis">{t("doctor.consultationDetail.replyType.diagnosis", { defaultValue: "Diagnosis (Conclusion)" })}</option>
                      <option value="recommendation">{t("doctor.consultationDetail.replyType.recommendation", { defaultValue: "Recommendation" })}</option>
                      <option value="prescription_note">{t("doctor.consultationDetail.replyType.prescription", { defaultValue: "Prescription Note" })}</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <textarea required rows="2" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder={role === "patient"
                      ? t("doctor.consultationDetail.patientPlaceholder", { defaultValue: "Type your question..." })
                      : t("doctor.consultationDetail.doctorPlaceholder", { defaultValue: "Type your response..." })
                    }
                    className="flex-1 resize-none rounded-xl border border-border-main/60 bg-bg-surface px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-cyan-400/40 dark:bg-slate-800" />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  {(role === "doctor" || role === "super_admin" || role === "admin") && (
                    <button type="button" onClick={(e) => handleReplySubmit(e, true)}
                      disabled={isSubmitting || !replyText.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t("doctor.consultationDetail.sendComplete", { defaultValue: "Send & Complete" })}
                    </button>
                  )}
                  <button type="button" onClick={(e) => handleReplySubmit(e, false)}
                    disabled={isSubmitting || !replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-cyan-500/20 transition hover:bg-cyan-600 disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" />
                    {isSubmitting
                      ? t("common.sending", { defaultValue: "Sending..." })
                      : t("doctor.consultationDetail.send", { defaultValue: "Send" })
                    }
                  </button>
                </div>
              </form>
            ) : (
              /* Completed state */
              <div className="border-t border-border-main/40 bg-emerald-50/50 p-5 dark:bg-emerald-900/10">
                <p className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                  {t("doctor.consultationDetail.caseCompleted", { defaultValue: "This consultation has been marked as completed." })}
                </p>
                {(role === "doctor" || role === "super_admin" || role === "admin") && (
                  <div className="flex justify-center">
                    <button type="button" onClick={handleReopenCase} disabled={reopenSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50/60 px-5 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/15 dark:text-amber-300 disabled:opacity-50">
                      <RefreshCw className={`h-4 w-4 ${reopenSubmitting ? "animate-spin" : ""}`} />
                      {reopenSubmitting
                        ? t("common.processing", { defaultValue: "Processing..." })
                        : t("doctor.consultationDetail.reopenCase", { defaultValue: "Reopen Case" })
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Confirm Modal ── */}
      <ConfirmModal
        isOpen={confirmAiImageId !== null}
        title={t("doctor.consultationDetail.aiConfirmTitle", { defaultValue: "Send image to Holora AI for analysis?" })}
        description={t("doctor.consultationDetail.aiConfirmDesc", { defaultValue: "This may take a few seconds as the image is sent to the AI model service for processing." })}
        badgeLabel="Holora AI"
        tone="info"
        confirmLabel={t("doctor.consultationDetail.aiConfirmBtn", { defaultValue: "Run Analysis" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        onConfirm={() => startRequestAI(confirmAiImageId)}
        onClose={() => setConfirmAiImageId(null)}
      />

      {/* ── Prescription Form Modal ── */}
      <PrescriptionFormModal
        isOpen={showRxForm}
        onClose={() => { setShowRxForm(false); setEditingRx(null); }}
        patientName={data?.patient_name}
        initialData={editingRx}
        onSubmit={async (formData) => {
          if (editingRx) {
            await updatePrescriptionApi(editingRx.id, formData);
          } else {
            await createPrescriptionApi({
              ...formData,
              consultation_id: Number(id),
              patient_id: data?.patient_id,
            });
          }
          await fetchPrescriptions();
        }}
      />

      {/* ── Prescription Detail Modal ── */}
      <PrescriptionDetailModal
        isOpen={viewRxDetail !== null}
        onClose={() => setViewRxDetail(null)}
        prescriptionData={viewRxDetail}
      />
    </div>
  );
};

export default DoctorConsultationDetailPage;
