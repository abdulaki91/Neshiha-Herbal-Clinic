import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiPhone, FiMail, FiCalendar, FiCheck, FiX, FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  useBookingRequests,
  useUpdateBookingStatus,
} from "../../hooks/useBookingRequests";

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  converted: "bg-gray-200 text-gray-700",
};

const BookingRequestsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const query = { page, pageSize: PAGE_SIZE };
  if (search) query.search = search;
  if (statusFilter) query.status = statusFilter;

  const { data, isLoading, isError } = useBookingRequests(query);
  const bookings = data?.items || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.pageSize) : 1;

  const updateStatus = useUpdateBookingStatus();

  const handleSetStatus = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(t("bookingRequests.statusUpdateSuccess"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("bookingRequests.statusUpdateError"));
    }
  };

  // The clinic's full patient registration (age, gender, allergies, ...)
  // needs more than this lightweight public form collects, so "convert"
  // hands off to the existing Patients page instead of auto-creating a
  // record here. The booking's name/phone/email travel along as router
  // state so the "Add Patient" form opens pre-filled — PatientsPage marks
  // this request "converted" itself once a patient is actually created
  // from it, not before.
  const handleConvert = (booking) => {
    const [firstName, ...rest] = booking.fullName.trim().split(/\s+/);
    navigate("/portal/patients", {
      state: {
        bookingPrefill: {
          firstName,
          lastName: rest.join(" "),
          phone: booking.phone,
        },
        bookingRequestId: booking.id,
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {t("bookingRequests.title")}
        </h1>
        <p className="text-gray-500 mt-1">{t("bookingRequests.subtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("bookingRequests.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        >
          <option value="">{t("bookingRequests.allStatuses")}</option>
          {["pending", "contacted", "confirmed", "declined", "converted"].map((s) => (
            <option key={s} value={s}>
              {t(`bookingRequests.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-red-500 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
          {t("bookingRequests.loadError")}
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
          {t("bookingRequests.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-gray-100 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-800">{booking.fullName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.status]}`}
                    >
                      {t(`bookingRequests.status.${booking.status}`)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1.5">
                      <FiPhone className="w-3.5 h-3.5" /> {booking.phone}
                    </span>
                    {booking.email && (
                      <span className="flex items-center gap-1.5">
                        <FiMail className="w-3.5 h-3.5" /> {booking.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5" />
                      {new Date(booking.preferredDate).toLocaleDateString()}
                      {booking.preferredTime && ` · ${t(`bookingRequests.time.${booking.preferredTime}`, booking.preferredTime)}`}
                    </span>
                  </div>
                  {booking.reason && (
                    <p className="text-sm text-gray-500 italic">"{booking.reason}"</p>
                  )}
                </div>

                {!["converted", "declined"].includes(booking.status) && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {booking.status === "pending" && (
                      <button
                        onClick={() => handleSetStatus(booking.id, "contacted")}
                        className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        {t("bookingRequests.markContacted")}
                      </button>
                    )}
                    <button
                      onClick={() => handleConvert(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      <FiUserPlus className="w-3.5 h-3.5" />
                      {t("bookingRequests.convert")}
                    </button>
                    <button
                      onClick={() => handleSetStatus(booking.id, "declined")}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      aria-label={t("bookingRequests.decline")}
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {booking.status === "converted" && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 flex-shrink-0">
                    <FiCheck className="w-4 h-4" /> {t("bookingRequests.status.converted")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            {t("common.pagination.page")} {page} {t("common.pagination.of")} {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-40"
            >
              {t("common.previous")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-40"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRequestsPage;
