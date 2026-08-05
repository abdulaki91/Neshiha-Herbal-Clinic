import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

/**
 * Shared admin list shell for every content-collection resource
 * (Testimonials, Success Stories, FAQs, Team Members, Partners, Banners,
 * Services) — search, status filter, pagination, up/down reorder, a
 * draft/published toggle, delete confirmation, and an add/edit modal slot.
 * Each resource supplies its own `renderItem` (how a row's content looks)
 * and `FormComponent` (the create/edit modal) — everything else is shared.
 */
const ContentCollectionList = ({
  title,
  subtitle,
  addButtonLabel,
  searchPlaceholder,
  useListHook,
  useDeleteHook,
  useSetStatusHook,
  useReorderHook,
  renderItem,
  getItemLabel,
  FormComponent,
  searchable = true,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const PAGE_SIZE = 10;

  const query = { page, pageSize: PAGE_SIZE };
  if (search) query.search = search;
  if (statusFilter) query.status = statusFilter;

  const { data, isLoading, isError } = useListHook(query);
  const items = data?.items || [];
  const pagination = data?.pagination;
  const totalPages = pagination
    ? Math.ceil(pagination.totalItems / pagination.pageSize)
    : 1;

  const deleteMutation = useDeleteHook();
  const setStatusMutation = useSetStatusHook();
  const reorderMutation = useReorderHook();

  const openCreate = () => {
    setSelected(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const label = getItemLabel ? getItemLabel(item) : "";
    if (!window.confirm(t("contentAdmin.common.deleteConfirm", { label }))) return;
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success(t("contentAdmin.common.deleteSuccess"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.common.deleteError"));
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === "published" ? "draft" : "published";
    try {
      await setStatusMutation.mutateAsync({ id: item.id, status: nextStatus });
      toast.success(t("contentAdmin.common.statusUpdateSuccess"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.common.statusUpdateError"));
    }
  };

  const handleReorder = async (item, direction) => {
    try {
      await reorderMutation.mutateAsync({ id: item.id, direction });
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.common.reorderError"));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 shadow-md text-sm font-semibold"
        >
          <FiPlus />
          <span>{addButtonLabel}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        )}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        >
          <option value="">{t("contentAdmin.common.allStatuses")}</option>
          <option value="published">{t("contentAdmin.common.published")}</option>
          <option value="draft">{t("contentAdmin.common.draft")}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-red-500 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
          {t("contentAdmin.common.loadError")}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
          {t("contentAdmin.common.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm shadow-slate-200/60 border border-gray-100 p-4 flex items-center gap-4"
            >
              <div className="flex flex-col flex-shrink-0">
                <button
                  onClick={() => handleReorder(item, "up")}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-emerald-600 disabled:opacity-25 disabled:cursor-not-allowed transition"
                  aria-label={t("contentAdmin.common.moveUp")}
                >
                  <FiChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReorder(item, "down")}
                  disabled={index === items.length - 1}
                  className="text-gray-400 hover:text-emerald-600 disabled:opacity-25 disabled:cursor-not-allowed transition"
                  aria-label={t("contentAdmin.common.moveDown")}
                >
                  <FiChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">{renderItem(item)}</div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleStatus(item)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                    item.status === "published"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item.status === "published"
                    ? t("contentAdmin.common.published")
                    : t("contentAdmin.common.draft")}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  aria-label={t("common.edit")}
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  aria-label={t("common.delete")}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
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

      {showForm && (
        <FormComponent
          item={selected}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ContentCollectionList;
