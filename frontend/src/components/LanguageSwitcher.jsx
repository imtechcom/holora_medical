import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => toggleLanguage("en")}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
          i18n.language === "en"
            ? "bg-[#E06666] text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage("vi")}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
          i18n.language === "vi"
            ? "bg-[#E06666] text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        VI
      </button>
    </div>
  );
};

export default LanguageSwitcher;
