import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import specialtyService from '../../services/specialtyService';

const SpecialtyFormPage = () => {
  const { t } = useTranslation();
  const { specialtyId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!specialtyId;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_id: '',
    description: '',
    status: 'active'
  });

  const [allSpecialties, setAllSpecialties] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch specialty data if in edit mode
  const fetchSpecialty = useCallback(async () => {
    try {
      setLoading(true);
      const response = await specialtyService.getSpecialtyById(specialtyId);
      const specialty = response.data;
      setFormData({
        name: specialty.name || '',
        code: specialty.code || '',
        parent_id: specialty.parent_id || '',
        description: specialty.description || '',
        status: specialty.status || 'active'
      });
    } catch (error) {
      setMessage(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [specialtyId, t]);

  useEffect(() => {
    if (isEditMode) {
      fetchSpecialty();
    }
  }, [isEditMode, fetchSpecialty]);

  useEffect(() => {
    const fetchAllSpecialties = async () => {
      try {
        const response = await specialtyService.getAllSpecialties();
        setAllSpecialties(response.data || []);
      } catch (error) {
        console.error("Error fetching specialties list:", error);
      }
    };

    fetchAllSpecialties();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('specialty.nameRequired');
    }

    if (!formData.code.trim()) {
      newErrors.code = t('specialty.codeRequired');
    }

    if (formData.code.trim() && !/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = t('specialty.codeInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage(t('common.pleaseFixErrors'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        parent_id: formData.parent_id || null,
        description: formData.description.trim(),
        status: formData.status
      };

      if (isEditMode) {
        await specialtyService.updateSpecialty(specialtyId, payload);
        setMessage(t('specialty.updateSuccess'));
      } else {
        await specialtyService.createSpecialty(payload);
        setMessage(t('specialty.createSuccess'));
      }

      setTimeout(() => {
        navigate('/admin/specialties');
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/specialties');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E06666]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-bg-surface rounded-2xl shadow-sm p-6 dark:bg-slate-800">
          {/* Header */}
          <h1 className="text-2xl font-bold text-[#E06666] mb-1">
            {isEditMode ? t('specialty.editTitle') : t('specialty.addTitle')}
          </h1>
          <p className="text-text-dim text-sm mb-6">
            {isEditMode ? t('specialty.editSubtitle') : t('specialty.addSubtitle')}
          </p>

          {/* Message */}
          {message && (
            <div className={`p-3 mb-4 rounded-md text-sm ${
              message.includes('success') || message.includes('Success')
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-border-main">
                {t('specialty.basicInfo')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    {t('specialty.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('specialty.namePlaceholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 bg-bg-app dark:bg-slate-700 ${
                      errors.name ? 'border-red-500' : 'border-border-main'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    {t('specialty.code')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder={t('specialty.codePlaceholder')}
                    disabled={isEditMode}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 bg-bg-app dark:bg-slate-700 ${
                      errors.code ? 'border-red-500' : 'border-border-main'
                    } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    {t('specialty.status')}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-700"
                  >
                    <option value="active">{t('common.active')}</option>
                    <option value="inactive">{t('common.inactive')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Parent Specialty
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-700"
                  >
                    <option value="">None (Root specialty)</option>
                    {allSpecialties
                      .filter((item) => !isEditMode || String(item.id) !== String(specialtyId))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.parent_name ? `${item.parent_name} > ${item.name}` : item.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Description */}
            <div>
              <h2 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-border-main">
                {t('specialty.description')}
              </h2>

              <div>
                <label className="block text-sm font-medium text-text-main mb-2">
                  {t('specialty.descriptionLabel')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('specialty.descriptionPlaceholder')}
                  rows="4"
                  className="w-full px-4 py-2 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-700"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-border-main">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#E06666] hover:bg-[#D55555] disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {saving ? t('common.saving') : (isEditMode ? t('common.update') : t('common.create'))}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 border border-border-main text-text-main hover:bg-bg-app disabled:opacity-50 font-medium py-2 px-4 rounded-lg transition dark:hover:bg-slate-700"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyFormPage;
