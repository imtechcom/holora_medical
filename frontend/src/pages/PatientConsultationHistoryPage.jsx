import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { resolveApiUrl } from "../services/api";
import { consultationService } from "../services/consultationService";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_LABEL_KEYS = {
  pending: "patient.consultationsPage.status.pending",
  in_progress: "patient.consultationsPage.status.inProgress",
  completed: "patient.consultationsPage.status.completed",
};

const formatDateTime = (value, locale) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PatientConsultationHistoryPage = () => {
  const { t, i18n } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [mobileDetailTab, setMobileDetailTab] = useState("info");

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await consultationService.getPatientHistory();
      setConsultations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
      setError(err.response?.data?.message || err.message || t("patient.consultationsPage.errors.loadHistory"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    setSelectedId(id);
    setDetailData(null);
    setReplyError("");
    setLoadingDetail(true);
    setMobileDetailTab("info");
    try {
      const res = await consultationService.getConsultationDetails(id);
      setDetailData(res.data);
    } catch (err) {
      console.error("Failed to fetch consultation detail:", err);
      setReplyError(err.response?.data?.message || err.message || t("patient.consultationsPage.errors.loadDetail"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setDetailData(null);
    setReplyText("");
    setReplyError("");
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      setReplyError("");
      await consultationService.addResponse(selectedId, {
        content: replyText,
        complete: false,
      });

      setReplyText("");
      const res = await consultationService.getConsultationDetails(selectedId);
      setDetailData(res.data);
    } catch (err) {
      console.error("Failed to send consultation response:", err);
      setReplyError(err.response?.data?.message || err.message || t("patient.consultationsPage.errors.sendReply"));
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const pending = consultations.filter((c) => c.status === "pending").length;
    const inProgress = consultations.filter((c) => c.status === "in_progress").length;
    const completed = consultations.filter((c) => c.status === "completed").length;
    return {
      total: consultations.length,
      pending,
      inProgress,
      completed,
    };
  }, [consultations]);

  const getStatusLabel = (status) => t(STATUS_LABEL_KEYS[status] || "patient.consultationsPage.status.unknown");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-4 text-white shadow-lg sm:p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("patient.zone")}</p>
            <h1 className="mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-3xl md:text-4xl">
              {t("patient.consultationsPage.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {t("patient.consultationsPage.heroDescription")}
            </p>
            <Link
              to="/patient/consultations/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <Plus className="h-4 w-4" />
              {t("patient.consultationsPage.newRequestAction")}
            </Link>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              {t("patient.consultationsPage.summaryTitle")}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/75">{t("patient.consultationsPage.totalLabel")}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("patient.consultationsPage.pendingLabel")}</p>
            <CalendarDays className="hidden h-5 w-5 flex-shrink-0 text-amber-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("patient.consultationsPage.inProgressLabel")}</p>
            <MessageSquare className="hidden h-5 w-5 flex-shrink-0 text-sky-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("patient.consultationsPage.completedLabel")}</p>
            <Stethoscope className="hidden h-5 w-5 flex-shrink-0 text-emerald-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.completed}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{t("patient.consultationsPage.listTitle")}</h2>
            <p className="text-sm text-text-dim">{t("patient.consultationsPage.listDescription")}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Mobile card list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-dim sm:hidden">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("patient.consultationsPage.loading")}
          </div>
        ) : consultations.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-dim sm:hidden">{t("patient.consultationsPage.empty")}</p>
        ) : (
          <div className="divide-y divide-border-main/50 sm:hidden">
            {consultations.map((item) => (
              <div key={item.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 flex-1 text-sm font-semibold text-text-main">{item.chief_complaint}</p>
                  <span className={`inline-flex flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-text-dim">{item.doctor_name || t("patient.consultationsPage.unassignedDoctor")}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-dim">{formatDateTime(item.created_at, i18n.language)}</p>
                  <button
                    onClick={() => handleOpenDetail(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E06666] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#cc5b5b]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t("patient.consultationsPage.viewAction")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-x-auto px-2 pb-2 sm:block md:px-5 md:pb-5">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.reason")}</th>
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.doctor")}</th>
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.createdAt")}</th>
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.status")}</th>
                <th className="px-3 py-4 text-right">{t("patient.consultationsPage.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("patient.consultationsPage.loading")}
                    </span>
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    {t("patient.consultationsPage.empty")}
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr key={item.id} className="border-t border-border-main/70 text-sm">
                    <td className="px-3 py-4">
                      <p className="max-w-[320px] truncate font-semibold text-text-main" title={item.chief_complaint}>
                        {item.chief_complaint}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-text-main">
                      {item.doctor_name || t("patient.consultationsPage.unassignedDoctor")}
                    </td>
                    <td className="px-3 py-4 text-text-dim">{formatDateTime(item.created_at, i18n.language)}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(item.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#E06666] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#cc5b5b]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {t("patient.consultationsPage.viewAction")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:px-3 backdrop-blur-sm">
          <div className="flex h-[95svh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-border-main bg-bg-surface shadow-2xl sm:h-[90vh] sm:rounded-2xl md:flex-row dark:bg-slate-900">
            {loadingDetail ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-text-dim">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("patient.consultationsPage.loadingDetail")}
                </span>
              </div>
            ) : detailData ? (
              <>
                {/* Mobile tab bar */}
                <div className="flex items-stretch border-b border-border-main bg-bg-surface md:hidden dark:bg-slate-900">
                  <button
                    onClick={handleCloseDetail}
                    className="flex items-center justify-center border-r border-border-main px-4 text-2xl text-text-dim transition active:bg-slate-100 dark:active:bg-slate-800"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <button
                    onClick={() => setMobileDetailTab("info")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3.5 text-sm font-semibold transition ${
                      mobileDetailTab === "info" ? "border-[#E06666] text-[#E06666]" : "border-transparent text-text-dim"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    {t("patient.consultationsPage.caseTitle")}
                  </button>
                  <button
                    onClick={() => setMobileDetailTab("chat")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3.5 text-sm font-semibold transition ${
                      mobileDetailTab === "chat" ? "border-[#E06666] text-[#E06666]" : "border-transparent text-text-dim"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t("patient.consultationsPage.chatTitle")}
                  </button>
                </div>
                <div className={`${mobileDetailTab !== "info" ? "hidden md:block" : ""} w-full overflow-y-auto border-r border-border-main bg-[linear-gradient(180deg,#fff6f6_0%,#fffdfd_100%)] p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/80 md:w-1/3`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#E06666]">{t("patient.consultationsPage.caseTitle")}</h3>
                  </div>

                  {/* Status + doctor info */}
                  <div className="mt-4 rounded-xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-dim">{t("patient.consultationsPage.columns.status")}</p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[detailData.status] || "bg-slate-100 text-slate-700"}`}>
                        {getStatusLabel(detailData.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-dim">{t("patient.consultationsPage.columns.doctor")}</p>
                      {detailData.doctor_name ? (
                        <p className="mt-0.5 text-sm font-medium text-text-main">🩺 {detailData.doctor_name}</p>
                      ) : (
                        <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t("patient.consultationsPage.waitingDoctor") || "Đang chờ bác sĩ tiếp nhận..."}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm font-semibold text-text-dim">{t("patient.consultationsPage.fields.reason")}</p>
                    <p className="mt-1 text-sm text-text-main">{detailData.chief_complaint || "-"}</p>

                    <p className="mt-4 text-sm font-semibold text-text-dim">{t("patient.consultationsPage.fields.symptoms")}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-text-main">{detailData.symptoms || "-"}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-2 text-sm font-semibold text-text-dim">
                      {t("patient.consultationsPage.fields.images", { count: detailData.images?.length || 0 })}
                    </p>
                    {detailData.images?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {detailData.images.map((img, idx) => (
                          <a key={idx} href={resolveApiUrl(img.image_url)} target="_blank" rel="noreferrer">
                            <img src={resolveApiUrl(img.image_url)} alt="symptom" className="h-28 sm:h-24 w-full cursor-pointer rounded-lg border border-border-main object-cover transition hover:opacity-80" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-text-dim">{t("patient.consultationsPage.emptyImages")}</p>
                    )}
                  </div>
                </div>

                <div className={`${mobileDetailTab !== "chat" ? "hidden md:flex" : "flex"} w-full flex-col bg-bg-surface dark:bg-slate-900 md:w-2/3`}>
                  <div className="flex w-full items-center justify-between border-b border-border-main px-6 py-4 shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold text-text-main">
                      <MessageSquare className="h-5 w-5 text-[#E06666]" />
                      {t("patient.consultationsPage.chatTitle")}
                    </h3>
                    <button onClick={handleCloseDetail} className="hidden rounded-full border border-border-main bg-bg-app px-3 py-1 text-sm font-semibold text-text-main transition hover:bg-slate-100 dark:hover:bg-slate-800 md:block">
                      {t("common.close")}
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg-app p-4 sm:p-6 dark:bg-slate-950/50">
                    {detailData.responses?.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center">
                        <p className="mb-2 text-sm italic text-text-dim">{t("patient.consultationsPage.emptyChatTitle")}</p>
                        <p className="text-xs text-text-dim">{t("patient.consultationsPage.emptyChatHint")}</p>
                      </div>
                    ) : (
                      detailData.responses?.map((msg) => {
                        const iAmSending = msg.responder_role === "patient";

                        return (
                          <div key={msg.id} className={`flex w-full ${iAmSending ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                                iAmSending
                                  ? "rounded-tr-none bg-[#E06666] text-white"
                                  : "rounded-tl-none border border-border-main bg-bg-surface text-text-main"
                              }`}
                            >
                              <div className={`mb-1 text-[10px] font-bold uppercase ${iAmSending ? "text-red-100" : "text-text-dim"}`}>
                                {iAmSending ? t("patient.consultationsPage.meLabel") : msg.responder_name} • {formatDateTime(msg.created_at, i18n.language)}
                              </div>
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {detailData.status !== "completed" ? (
                    <form onSubmit={handleSubmitResponse} className="border-t border-border-main bg-bg-surface px-3 py-3 sm:p-4 dark:bg-slate-900">
                      {replyError && (
                        <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                          {replyError}
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t("patient.consultationsPage.replyPlaceholder")}
                          className="flex-1 resize-none rounded-xl border border-border-main bg-white p-3 text-sm text-text-main outline-none focus:border-[#E06666] focus:ring-1 focus:ring-[#F7CACA] dark:bg-slate-900"
                          rows="2"
                          required
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-[#E06666] p-3 font-semibold text-white shadow-md transition hover:bg-[#d85a5a] disabled:opacity-50 sm:gap-2 sm:px-5 sm:py-2.5"
                        >
                          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                          <span className="hidden sm:inline">{submitting ? t("patient.consultationsPage.sending") : t("patient.consultationsPage.sendAction")}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="border-t border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold italic text-emerald-700">
                      {t("patient.consultationsPage.completedNotice")}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-red-500">{t("patient.consultationsPage.errors.emptyDetail")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientConsultationHistoryPage;
