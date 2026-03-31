import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  AlertTriangle,
  ClipboardList,
  Contact,
  Save,
  X,
  Edit3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  getMyProfileApi,
  updateMyProfileApi,
} from "../services/patientService";

const PatientProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "",
    date_of_birth: "",
    address: "",
    blood_group: "",
    allergies: "",
    medical_history: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProfileApi();
      if (res.data) {
        setProfileData({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          gender: res.data.gender || "",
          date_of_birth: res.data.date_of_birth || "",
          address: res.data.address || "",
          blood_group: res.data.blood_group || "",
          allergies: res.data.allergies || "",
          medical_history: res.data.medical_history || "",
          emergency_contact_name: res.data.emergency_contact_name || "",
          emergency_contact_phone: res.data.emergency_contact_phone || "",
        });
      }
      setError("");
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(
        err?.response?.data?.message || t("patient.errorLoadingProfile")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (role !== "patient") {
      navigate("/");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, role, navigate, fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!profileData.full_name?.trim()) {
      setError(t("auth.fullNameRequired"));
      return false;
    }
    if (!profileData.phone?.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await updateMyProfileApi(profileData);
      setSuccessMessage(t("patient.profileUpdatedSuccess"));
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || t("patient.errorUpdatingProfile");
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E06666]"></div>
      </div>
    );
  }

  const InputGroup = ({ label, icon: Icon, name, value, type = "text", placeholder, options }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-text-main flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-text-dim" />}
        {label}
      </label>
      {isEditing ? (
        options ? (
          <select
            name={name}
            value={value}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main focus:ring-2 focus:ring-[#E06666] outline-none transition-all"
          >
            <option value="">{t("common.selectOne")}</option>
            {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main focus:ring-2 focus:ring-[#E06666] outline-none transition-all"
          />
        )
      ) : (
        <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent text-text-main font-medium">
          {value || "---"}
        </div>
      )}
    </div>
  );

  const TextAreaGroup = ({ label, icon: Icon, name, value, placeholder }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-text-main flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-text-dim" />}
        {label}
      </label>
      {isEditing ? (
        <textarea
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          rows="3"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main focus:ring-2 focus:ring-[#E06666] outline-none transition-all resize-none"
        />
      ) : (
        <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent text-text-main font-medium min-h-[46px] whitespace-pre-wrap">
          {value || "---"}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#E06666] flex items-center justify-center text-white shadow-lg shadow-[#E06666]/30">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-main">{profileData.full_name}</h1>
              <p className="text-text-dim flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {profileData.email}
              </p>
              <div className="mt-2 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase transition-colors">
                  {t("common.patient")}
                </span>
                {profileData.blood_group && (
                  <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold transition-colors">
                    {profileData.blood_group}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {!isEditing ? (
               <button
                 onClick={() => setIsEditing(true)}
                 className="flex items-center gap-2 px-6 py-2.5 bg-[#E06666] text-white rounded-xl font-bold hover:bg-[#D55555] transition shadow-md"
               >
                 <Edit3 className="w-4 h-4" />
                 {t("common.edit")}
               </button>
             ) : (
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => { setIsEditing(false); fetchProfile(); }}
                   className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-text-main rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                 >
                   <X className="w-4 h-4" />
                   {t("common.cancel")}
                 </button>
                 <button
                   onClick={handleSubmit}
                   disabled={submitting}
                   className="flex items-center gap-2 px-6 py-2.5 bg-[#E06666] text-white rounded-xl font-bold hover:bg-[#D55555] transition shadow-md disabled:opacity-50"
                 >
                   {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : <Save className="w-4 h-4" />}
                   {t("common.save")}
                 </button>
               </div>
             )}
          </div>
        </div>
        
        {/* Abstract background shape */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E06666]/5 rounded-full blur-2xl"></div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800 dark:text-green-300 font-medium">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 dark:text-red-300 font-medium">{error}</span>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Personal */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
          <h2 className="text-lg font-black text-text-main uppercase tracking-widest flex items-center gap-3 border-b border-gray-50 dark:border-slate-700 pb-4 mb-2">
            <User className="w-5 h-5 text-[#E06666]" />
            {t("patient.personalInformation")}
          </h2>
          
          <InputGroup label={t("admin.fullName")} icon={User} name="full_name" value={profileData.full_name} placeholder="John Doe" />
          <InputGroup label={t("admin.phone")} icon={Phone} name="phone" value={profileData.phone} placeholder="+84 ..." />
          <InputGroup label={t("patient.dateOfBirth")} icon={Calendar} name="date_of_birth" value={profileData.date_of_birth} type="date" />
          <InputGroup 
            label={t("patient.gender")} 
            icon={User} 
            name="gender" 
            value={profileData.gender} 
            options={[
              { val: "male", label: t("admin.genderMale") },
              { val: "female", label: t("admin.genderFemale") },
              { val: "other", label: t("admin.genderOther") }
            ]} 
          />
          <InputGroup label={t("patient.address")} icon={MapPin} name="address" value={profileData.address} placeholder="123 Street..." />
        </div>

        {/* Section 2: Medical */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
            <h2 className="text-lg font-black text-text-main uppercase tracking-widest flex items-center gap-3 border-b border-gray-50 dark:border-slate-700 pb-4 mb-2">
              <ClipboardList className="w-5 h-5 text-[#E06666]" />
              {t("patient.medicalInformation")}
            </h2>
            
            <InputGroup 
              label={t("admin.bloodGroup")} 
              icon={Droplets} 
              name="blood_group" 
              value={profileData.blood_group} 
              options={["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(v => ({ val: v, label: v }))} 
            />
            <TextAreaGroup label={t("admin.allergies")} icon={AlertTriangle} name="allergies" value={profileData.allergies} placeholder={t("admin.allergiesPlaceholder")} />
            <TextAreaGroup label={t("admin.medicalHistory")} icon={ClipboardList} name="medical_history" value={profileData.medical_history} placeholder={t("admin.medicalHistoryPlaceholder")} />
          </div>

          {/* Section 3: Emergency */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
            <h2 className="text-lg font-black text-text-main uppercase tracking-widest flex items-center gap-3 border-b border-gray-50 dark:border-slate-700 pb-4 mb-2">
              <Contact className="w-5 h-5 text-[#E06666]" />
              {t("patient.emergencyContact")}
            </h2>
            
            <InputGroup label={t("patient.emergencyContactName")} icon={User} name="emergency_contact_name" value={profileData.emergency_contact_name} placeholder="Emergency Name" />
            <InputGroup label={t("patient.emergencyContactPhone")} icon={Phone} name="emergency_contact_phone" value={profileData.emergency_contact_phone} placeholder="+84 ..." />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
