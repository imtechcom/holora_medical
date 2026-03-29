import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-100 text-center py-6 mt-10">
      <p className="text-sm text-gray-500">
        {t("footer.copyright")}
      </p>
    </footer>
  );
};

export default Footer;