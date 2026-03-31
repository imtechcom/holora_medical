import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("specialty.managementTitle")}
        </h1>
        <p className="text-gray-600 mt-2">{t("specialty.managementSubtitle")}</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAddSpecialty}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + {t("specialty.addNew")}
          </button>
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToRoot}
        className={`mb-4 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition ${
          draggingId
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-gray-50 text-gray-500"
        }`}
      >
        Drop here to move specialty to root level
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            {t("common.loading")}...
          </div>
        ) : treeRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("specialty.noSpecialties")}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.name")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.code")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.description")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.doctorCount")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.status")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {treeRows.map((specialty) => (
                <tr
                  key={specialty.id}
                  draggable={!isDropping}
                  onDragStart={() => setDraggingId(specialty.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetId(specialty.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnSpecialty(specialty.id);
                  }}
                  className={`border-b transition ${
                    dropTargetId === specialty.id ? "bg-blue-50" : "hover:bg-gray-50"
                  } ${draggingId === specialty.id ? "opacity-50" : ""}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div
                      style={{ paddingLeft: `${specialty.depth * 20}px` }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-gray-400 cursor-grab">⋮⋮</span>
                      {specialty.depth > 0 ? <span className="text-gray-400">└</span> : <span className="text-gray-400">•</span>}
                      <span>{specialty.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {specialty.parent_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {specialty.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {specialty.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {specialty.doctor_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      specialty.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {specialty.status === "active"
                        ? t("common.active")
                        : t("common.inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleEditSpecialty(specialty)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title={t("common.edit")}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(specialty.id)}
                      className="px-3 py-1 text-white rounded transition-colors bg-red-500 hover:bg-red-600"
                      title={t("common.delete")}
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t("specialty.confirmDelete")}
            </h3>

            {deleteSuggestion && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">This specialty has {deleteSuggestion.doctorCount} doctor(s).</p>
                <p className="mt-1">Please move doctors to another leaf specialty before deleting.</p>

                <label className="block mt-3 mb-1 text-xs font-semibold uppercase tracking-wide">
                  Suggested target leaf specialty
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full rounded border border-amber-300 bg-white px-3 py-2 text-sm"
                >
                  {deleteSuggestion.suggestions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent_name ? `${item.parent_name} > ${item.name}` : item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteSuggestion(null);
                  setReassignTargetId("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  if (deleteSuggestion) {
                    handleReassignAndDelete();
                    return;
                  }

                  const specialty = specialties.find(
                    (s) => s.id === showDeleteConfirm
                  );
                  handleDeleteSpecialty(showDeleteConfirm, specialty?.doctor_count);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
