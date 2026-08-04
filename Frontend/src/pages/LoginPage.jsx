import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import useAuthStore from "../store/authStore";
import { initializeSocket, connectSocket } from "../lib/socket";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", data);
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      initializeSocket(accessToken);
      connectSocket();

      toast.success(t("login.toast.welcome", { firstName: user.firstName }));
      navigate("/portal");
    } catch (error) {
      toast.error(error.response?.data?.message || t("login.toast.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-slate-50">
      {/* Branding panel — hidden on small screens, the form still works standalone */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700">
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl animate-ambient-drift"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-emerald-300/20 blur-3xl animate-ambient-drift"
          style={{ animationDelay: "-6s" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center space-x-3 animate-fade-in-up">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">
              {t("login.brandName")}
            </span>
          </div>

          <div
            className="animate-fade-in-up max-w-md"
            style={{ animationDelay: "80ms" }}
          >
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              {t("login.brandName")}
            </h1>
            <p className="mt-4 text-lg text-emerald-50/90">
              {t("login.brandSubtitle")}
            </p>
          </div>

          <p
            className="text-sm text-emerald-100/70 animate-fade-in-up"
            style={{ animationDelay: "160ms" }}
          >
            © {new Date().getFullYear()} {t("login.brandName")}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile-only brand mark */}
          <div className="flex lg:hidden items-center space-x-3 mb-10 justify-center">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-800">
              {t("login.brandName")}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {t("login.heading")}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            {t("login.brandSubtitle")}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("login.label.email")}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                <input
                  type="email"
                  {...register("email", {
                    required: t("login.validation.emailRequired"),
                  })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm outline-none transition-all duration-200 focus:ring-4 ${
                    errors.email
                      ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                      : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-500"
                  }`}
                  placeholder={t("login.placeholder.email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("login.label.password")}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: t("login.validation.passwordRequired"),
                  })}
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border bg-white text-sm outline-none transition-all duration-200 focus:ring-4 ${
                    errors.password
                      ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                      : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-500"
                  }`}
                  placeholder={t("login.placeholder.password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <FiEye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <span>
                {loading ? t("login.button.loading") : t("login.button.submit")}
              </span>
              {!loading && (
                <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t("login.demo.heading")}
            </p>
            <div className="text-xs text-slate-600 space-y-1 font-mono">
              <p>{t("login.demo.admin")}</p>
              <p>{t("login.demo.doctor")}</p>
              <p>{t("login.demo.clerk")}</p>
              <p>{t("login.demo.cashier")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
