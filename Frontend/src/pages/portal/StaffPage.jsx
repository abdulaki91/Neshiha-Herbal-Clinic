import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiKey,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import StaffForm from "../../components/staff/StaffForm";
import { getSocket } from "../../lib/socket";
import {
  useStaff,
  useStaffStats,
  useDeleteStaff,
  useActivateStaff,
  useDeactivateStaff,
  useResetStaffPassword,
} from "../../hooks/useStaff";

const ROLE_BADGE = {
  super_admin: "bg-purple-100 text-purple-700",
  staff_manager: "bg-blue-100 text-blue-700",
  doctor: "bg-emerald-100 text-emerald-700",
  data_clerk: "bg-amber-100 text-amber-700",
  cashier: "bg-teal-100 text-teal-700",
};

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

const ResetPasswordModal = ({ member, onClose }) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const resetPassword = useResetStaffPassword();

  const strongEnough =
    password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  const matches = password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strongEnough) return toast.error(t("staffForm.passwordWeak"));
    if (!matches) return toast.error(t("staff.resetPassword.mismatch"));

    try {
      await resetPassword.mutateAsync({ id: member.id, password });
      toast.success(t("staff.resetPassword.success"));
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("staff.resetPassword.error"),
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {t("staff.resetPassword.title")}
            </h2>
            <p className="text-xs text-gray-500">
              {member.firstName} {member.lastName} · {member.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("staff.resetPassword.newPassword")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {t("staffForm.passwordHint")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("staff.resetPassword.confirmPassword")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            {confirm && !matches && (
              <p className="mt-1 text-xs text-red-500">
                {t("staff.resetPassword.mismatch")}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {t("staff.resetPassword.warning")}
          </p>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={resetPassword.isPending || !strongEnough || !matches}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {resetPassword.isPending
                ? t("common.saving")
                : t("staff.resetPassword.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StaffPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Real-time: another admin creating or updating a staff account should
  // reflect here without a manual reload
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: ["staff"] });
    socket.on("staff:created", invalidate);
    return () => socket.off("staff:created", invalidate);
  }, [qc]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const query = { page, pageSize: PAGE_SIZE };
  if (search) query.search = search;
  if (roleFilter) query.role = roleFilter;
  if (statusFilter) query.status = statusFilter;

  const { data, isLoading, isError } = useStaff(query);
  const { data: stats } = useStaffStats();
  const staff = data?.staff || [];
  const pagination = data?.pagination;

  const deleteStaff = useDeleteStaff();
  const activateStaff = useActivateStaff();
  const deactivateStaff = useDeactivateStaff();

  const isSuperAdmin = user?.role === "super_admin";

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const runAction = async (mutation, id, successKey, errorKey) => {
    try {
      await mutation.mutateAsync(id);
      toast.success(t(successKey));
    } catch (error) {
      toast.error(error.response?.data?.message || t(errorKey));
    }
  };

  const handleDelete = (member) => {
    if (
      !window.confirm(
        t("staff.deleteConfirm", {
          name: `${member.firstName} ${member.lastName}`,
        }),
      )
    )
      return;
    runAction(
      deleteStaff,
      member.id,
      "staff.toast.deleteSuccess",
      "staff.toast.deleteError",
    );
  };

  // The API returns totalPages; fall back to computing it from the item count
  const totalPages = Math.max(
    1,
    pagination?.totalPages ??
      Math.ceil((pagination?.totalItems ?? 0) / PAGE_SIZE),
  );

  const statCards = [
    {
      label: t("staff.stats.total"),
      value: stats?.total,
      icon: FiUsers,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: t("staff.stats.active"),
      value: stats?.active,
      icon: FiUserCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: t("staff.stats.inactive"),
      value: stats?.inactive,
      icon: FiUserX,
      color: "text-gray-600 bg-gray-100",
    },
    {
      label: t("staff.stats.doctors"),
      value: stats?.byRole?.doctors,
      icon: FiUsers,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("staff.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("staff.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
        >
          <FiPlus />
          <span>{t("staff.addButton")}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 border border-gray-100 flex items-center space-x-4"
            >
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {card.value ?? "—"}
                </p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("staff.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && applySearch()}
            onBlur={applySearch}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">{t("staff.filter.allRoles")}</option>
          {Object.keys(ROLE_BADGE).map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">{t("staff.filter.allStatuses")}</option>
          <option value="active">{t("staff.status.active")}</option>
          <option value="inactive">{t("staff.status.inactive")}</option>
          <option value="suspended">{t("staff.status.suspended")}</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-red-500 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
          {t("staff.loadError")}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t("staff.table.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t("staff.table.contact")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t("staff.table.role")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t("staff.table.status")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    {t("staff.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-700 text-sm font-bold">
                              {member.firstName?.[0]}
                              {member.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {member.firstName} {member.lastName}
                              {isSelf && (
                                <span className="ml-2 text-xs text-gray-400">
                                  ({t("staff.you")})
                                </span>
                              )}
                            </p>
                            {member.department && (
                              <p className="text-xs text-gray-500">
                                {member.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{member.email}</p>
                        <p className="text-xs text-gray-500">{member.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            ROLE_BADGE[member.role] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t(`roles.${member.role}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE[member.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t(`staff.status.${member.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setSelected(member);
                              setShowForm(true);
                            }}
                            title={t("common.edit")}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setResetTarget(member)}
                            title={t("staff.resetPassword.title")}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <FiKey className="w-4 h-4" />
                          </button>

                          {member.status === "active" ? (
                            <button
                              onClick={() =>
                                runAction(
                                  deactivateStaff,
                                  member.id,
                                  "staff.toast.deactivateSuccess",
                                  "staff.toast.deactivateError",
                                )
                              }
                              disabled={isSelf}
                              title={t("staff.deactivate")}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <FiUserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                runAction(
                                  activateStaff,
                                  member.id,
                                  "staff.toast.activateSuccess",
                                  "staff.toast.activateError",
                                )
                              }
                              title={t("staff.activate")}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <FiUserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(member)}
                              disabled={isSelf}
                              title={t("common.delete")}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {staff.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {t("staff.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {t("common.pagination.page")} {page} {t("common.pagination.of")}{" "}
                {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-40"
                >
                  {t("common.previous")}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-40"
                >
                  {t("common.next")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <StaffForm
          staff={selected}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelected(null);
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          member={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
};

export default StaffPage;
