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
    description: '',
    status: 'active'
  });

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {isEditMode ? t('specialty.editTitle') : t('specialty.addTitle')}
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            {isEditMode ? t('specialty.editSubtitle') : t('specialty.addSubtitle')}
          </p>

          {/* Message */}
          {message && (
            <div className={`p-3 mb-4 rounded-md text-sm ${
              message.includes('success') || message.includes('Success')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {t('specialty.basicInfo')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('specialty.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('specialty.namePlaceholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('specialty.code')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder={t('specialty.codePlaceholder')}
                    disabled={isEditMode}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('specialty.status')}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">{t('common.active')}</option>
                    <option value="inactive">{t('common.inactive')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {t('specialty.description')}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('specialty.descriptionLabel')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('specialty.descriptionPlaceholder')}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {saving ? t('common.saving') : (isEditMode ? t('common.update') : t('common.create'))}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
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
