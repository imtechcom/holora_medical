import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { googleAuthApi, loginApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const googleBtnRef = useRef(null);

  const handleGoogleCredential = useCallback(
    async (response) => {
      try {
        setErrorMessage("");
        setLoading(true);

        const data = await googleAuthApi({
          credential: response.credential,
        });

        login({
          token: data.token,
          user: data.user,
        });

        navigate("/");
      } catch (error) {
        setErrorMessage(
          error?.response?.data?.message || t("auth.googleAuthFailed")
        );
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, t]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || !googleBtnRef.current || !window.google?.accounts?.id) {
      return;
    }

    googleBtnRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 360,
    });
  }, [handleGoogleCredential]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await loginApi(formData);

      login({
        token: data.token,
        user: data.user,
      });

      navigate("/");
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || t("auth.loginFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FFF5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#E06666]">Holora Medical</h1>
          <p className="text-gray-500 mt-2">{t("auth.signIn")}</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">{t("auth.email")}</label>
            <input
              type="email"
              name="email"
              placeholder={t("auth.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("auth.password")}</label>
            <input
              type="password"
              name="password"
              placeholder={t("auth.passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#E06666] py-3 font-semibold text-white transition hover:bg-[#d85a5a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "..." : t("auth.submitLogin")}
          </button>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span>{t("auth.orContinueWith")}</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <div className="flex justify-center">
            <div ref={googleBtnRef}></div>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-[#E06666] hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;