import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, GripVertical, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import specialtyService from "../../services/specialtyService";

const SpecialtiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [specialtyTree, setSpecialtyTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteSuggestion, setDeleteSuggestion] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isDropping, setIsDropping] = useState(false);

  // Fetch specialties on mount
  const fetchSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await specialtyService.getAllSpecialties();
      setSpecialties(res.data || []);
      setSpecialtyTree(res.tree || []);
    } catch (err) {
      setError(err.response?.data?.message || t("specialty.fetchError"));
      console.error("Error fetching specialties:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const handleAddSpecialty = () => {
    navigate("/admin/specialties/new");
  };

  const handleEditSpecialty = (specialty) => {
    navigate(`/admin/specialties/${specialty.id}/edit`);
  };

  const handleDeleteSpecialty = async (id, doctorCount) => {
    try {
      setError("");
      setSuccess("");
      const response = await specialtyService.deleteSpecialty(id);
      if (response) {
        setSuccess(t("specialty.deleteSuccess"));
        setShowDeleteConfirm(null);
        setDeleteSuggestion(null);
        setReassignTargetId("");
        fetchSpecialties();
      }
    } catch (err) {
      const responseData = err.response?.data;
      const errorMsg = responseData?.message || t("specialty.deleteError");

      if (responseData?.code === "SPECIALTY_HAS_DOCTORS") {
        const suggestions = responseData?.data?.suggested_leaf_specialties || [];
        setDeleteSuggestion({
          doctorCount: responseData?.data?.doctor_count || doctorCount || 0,
          suggestions,
        });
        setReassignTargetId(suggestions[0]?.id || "");
      } else {
        setError(errorMsg);
        setDeleteSuggestion(null);
        setReassignTargetId("");
      }
    }
  };

  const handleReassignAndDelete = async () => {
    if (!showDeleteConfirm || !reassignTargetId) {
      setError("Please select a target specialty to transfer doctors");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await specialtyService.reassignAndDeleteSpecialty(showDeleteConfirm, reassignTargetId);
      setSuccess("Doctors were transferred and specialty deleted successfully");
      setShowDeleteConfirm(null);
      setDeleteSuggestion(null);
      setReassignTargetId("");
      fetchSpecialties();
    } catch (err) {
      setError(err.response?.data?.message || t("specialty.deleteError"));
    }
  };

  // Filter specialties based on search
  const filteredSpecialties = specialties.filter(
    (specialty) =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (specialty.parent_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIdSet = new Set(filteredSpecialties.map((item) => item.id));

  const flattenTreeRows = (nodes, depth = 0) => {
    let result = [];

    nodes.forEach((node) => {
      if (filteredIdSet.has(node.id)) {
        result.push({ ...node, depth });
      }

      if (node.children?.length) {
        result = result.concat(flattenTreeRows(node.children, depth + 1));
      }
    });

    return result;
  };

  const treeRows = flattenTreeRows(specialtyTree);

  const findNodeById = (nodes, targetId) => {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.id === targetId) return node;
      if (node.children?.length) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const collectDescendantIds = (node, output = new Set()) => {
    if (!node?.children?.length) return output;
    node.children.forEach((child) => {
      output.add(child.id);
      collectDescendantIds(child, output);
    });
    return output;
  };

  const moveSpecialty = async (specialtyId, newParentId) => {
    if (!specialtyId) return;

    try {
      setIsDropping(true);
      setError("");
      setSuccess("");

      await specialtyService.updateSpecialtyParent(specialtyId, newParentId);
      setSuccess("Hierarchy updated successfully");
      await fetchSpecialties();
    } catch (err) {
      setError(err.response?.data?.message || t("specialty.updateError"));
    } finally {
      setIsDropping(false);
      setDraggingId(null);
      setDropTargetId(null);
    }
  };

  const handleDropOnSpecialty = async (targetId) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    const draggingNode = findNodeById(specialtyTree, draggingId);
    const descendants = collectDescendantIds(draggingNode);
    if (descendants.has(targetId)) {
      setError("Cannot move a parent under its own child");
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    await moveSpecialty(draggingId, targetId);
  };

  const handleDropToRoot = async () => {
    if (!draggingId) return;
    await moveSpecialty(draggingId, null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-main">{t("specialty.managementTitle")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSpecialties}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-sm text-text-dim hover:bg-bg-app dark:bg-slate-800 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleAddSpecialty}
            className="flex items-center gap-1.5 rounded-lg bg-[#E06666] px-4 py-2 text-sm font-medium text-white hover:bg-[#D55555] transition"
          >
            <Plus className="h-4 w-4" />
            {t("specialty.addNew")}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder={t("common.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-800/60"
        />
      </div>

      {/* Root drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToRoot}
        className={`rounded-xl border-2 border-dashed px-4 py-3 text-sm transition ${
          draggingId
            ? "border-[#E06666]/50 bg-[#FFF5F5] text-[#E06666] dark:bg-[#E06666]/10"
            : "border-border-main bg-bg-app text-text-dim dark:bg-slate-800/40"
        }`}
      >
        {t("specialty.dropToRoot") || "Drop here to move specialty to root level"}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("specialty.name")}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Parent</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("specialty.code")}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("specialty.description")}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("specialty.doctorCount")}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("specialty.status")}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-text-dim">{t("common.loading")}…</td>
                </tr>
              ) : treeRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-text-dim">{t("specialty.noSpecialties")}</td>
                </tr>
              ) : (
                treeRows.map((specialty) => (
                  <tr
                    key={specialty.id}
                    draggable={!isDropping}
                    onDragStart={() => setDraggingId(specialty.id)}
                    onDragEnd={() => { setDraggingId(null); setDropTargetId(null); }}
                    onDragOver={(e) => { e.preventDefault(); setDropTargetId(specialty.id); }}
                    onDrop={(e) => { e.preventDefault(); handleDropOnSpecialty(specialty.id); }}
                    className={`transition ${
                      dropTargetId === specialty.id
                        ? "bg-[#FFF5F5] dark:bg-[#E06666]/10"
                        : "hover:bg-bg-app dark:hover:bg-slate-700/50"
                    } ${draggingId === specialty.id ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-4 text-sm font-medium text-text-main">
                      <div style={{ paddingLeft: `${specialty.depth * 20}px` }} className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-text-dim" />
                        {specialty.depth > 0
                          ? <span className="text-text-dim">└</span>
                          : <span className="text-text-dim">•</span>}
                        <span>{specialty.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-dim">{specialty.parent_name || "—"}</td>
                    <td className="px-5 py-4 text-sm">
                      <code className="rounded bg-bg-app px-2 py-0.5 font-mono text-xs text-text-dim dark:bg-slate-700">
                        {specialty.code}
                      </code>
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-4 text-sm text-text-dim">{specialty.description || "—"}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {specialty.doctor_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        specialty.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-bg-app text-text-dim dark:bg-slate-700"
                      }`}>
                        {specialty.status === "active" ? t("common.active") : t("common.inactive")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditSpecialty(specialty)}
                          title={t("common.edit")}
                          className="rounded-lg border border-border-main p-1.5 text-text-dim hover:border-[#E06666]/50 hover:bg-[#E06666]/10 hover:text-[#E06666] transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(specialty.id)}
                          title={t("common.delete")}
                          className="rounded-lg border border-border-main p-1.5 text-text-dim hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-bold text-text-main">{t("specialty.confirmDelete")}</h3>

            {deleteSuggestion && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400">
                <p className="font-semibold">This specialty has {deleteSuggestion.doctorCount} doctor(s).</p>
                <p className="mt-1">Please move doctors to another leaf specialty before deleting.</p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide">
                  Suggested target leaf specialty
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main dark:bg-slate-700"
                >
                  {deleteSuggestion.suggestions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent_name ? `${item.parent_name} > ${item.name}` : item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(null); setDeleteSuggestion(null); setReassignTargetId(""); }}
                className="rounded-xl border border-border-main px-4 py-2 text-sm text-text-main hover:bg-bg-app dark:hover:bg-slate-700 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  if (deleteSuggestion) { handleReassignAndDelete(); return; }
                  const specialty = specialties.find((s) => s.id === showDeleteConfirm);
                  handleDeleteSpecialty(showDeleteConfirm, specialty?.doctor_count);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                {deleteSuggestion ? "Transfer & Delete" : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtiesPage;
