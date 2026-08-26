"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ReturnRequest = {
  id: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  orderId: string;
  itemName: string;
  quantity: number;
  reason: string;
  status: string;
  resolution: string | null;
  refundAmount: number | null;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const REASON_LABELS: Record<string, string> = {
  DAMAGED: "Damaged",
  WRONG_ITEM: "Wrong Item",
  SIZE_ISSUE: "Size Issue",
  NOT_AS_DESCRIBED: "Not As Described",
  CHANGED_MIND: "Changed Mind",
};

function getStatusClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700";

    case "IN_REVIEW":
      return "bg-yellow-100 text-yellow-700";

    case "APPROVED":
      return "bg-green-100 text-green-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "COMPLETED":
      return "bg-gray-200 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default function RequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<ReturnRequest[]>([]);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Fetch requests from the API.
   *
   * Search, filtering, sorting and pagination are handled
   * by the server and PostgreSQL.
   */
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (status) {
        params.set("status", status);
      }

      if (reason) {
        params.set("reason", reason);
      }

      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", "10");

      /*
       * Build the URL without using a template literal.
       */
      const url =
        "/api/requests?" + params.toString();

      const response = await fetch(url, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message ||
            "Failed to fetch return requests."
        );
      }

      setRequests(result.data || []);

      setPagination(
        result.pagination || {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load return requests."
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    status,
    reason,
    sortBy,
    sortOrder,
    page,
  ]);

  /*
   * Debounce search.
   *
   * The API is not called on every keystroke.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  /*
   * Fetch whenever query parameters change.
   */
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /*
   * Clear all filters.
   */
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setReason("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  /*
   * Go to a request details page.
   */
  const openRequest = (id: number) => {
    router.push("/requests/" + id);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              ReturnDesk
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage customer return requests
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/requests/new")
            }
            className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
          >
            + New Return Request
          </button>
        </div>

        {/* Filters */}
        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Search */}
            <div className="lg:col-span-2">
              <label
                htmlFor="search"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Customer, order ID or reference..."
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <p className="mt-1 text-xs text-gray-400">
                Search updates automatically after you stop typing.
              </p>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Statuses
                </option>

                <option value="OPEN">
                  Open
                </option>

                <option value="IN_REVIEW">
                  In Review
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Reason
              </label>

              <select
                id="reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Reasons
                </option>

                <option value="DAMAGED">
                  Damaged
                </option>

                <option value="WRONG_ITEM">
                  Wrong Item
                </option>

                <option value="SIZE_ISSUE">
                  Size Issue
                </option>

                <option value="NOT_AS_DESCRIBED">
                  Not As Described
                </option>

                <option value="CHANGED_MIND">
                  Changed Mind
                </option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label
                htmlFor="sortBy"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Sort By
              </label>

              <select
                id="sortBy"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="createdAt">
                  Created Date
                </option>

                <option value="updatedAt">
                  Updated Date
                </option>

                <option value="customerName">
                  Customer Name
                </option>

                <option value="status">
                  Status
                </option>

                <option value="reason">
                  Reason
                </option>

                <option value="reference">
                  Reference
                </option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Order
              </label>

              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(
                    event.target.value as
                      | "asc"
                      | "desc"
                  );

                  setPage(1);
                }}
                className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="desc">
                  Newest / Z-A
                </option>

                <option value="asc">
                  Oldest / A-Z
                </option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchRequests}
              className="mt-2 text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        <section className="mt-6 rounded-xl border bg-white shadow-sm">

          {/* Results Header */}
          <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-semibold text-gray-900">
                Return Requests
              </h2>

              {!loading && (
                <p className="mt-1 text-sm text-gray-500">
                  {pagination.total} request
                  {pagination.total === 1
                    ? ""
                    : "s"}{" "}
                  found
                </p>
              )}
            </div>

            {!loading && pagination.total > 0 && (
              <p className="text-sm text-gray-500">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />

              <p className="text-sm text-gray-500">
                Loading requests...
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            requests.length === 0 && (
              <div className="p-10 text-center">
                <h3 className="font-semibold text-gray-900">
                  No requests found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or filters.
                </p>
              </div>
            )}

          {/* Requests */}
          {!loading && requests.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Reference
                      </th>

                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Customer
                      </th>

                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Order
                      </th>

                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Item
                      </th>

                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Reason
                      </th>

                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-6 py-3 font-semibold text-gray-700">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        onClick={() =>
                          openRequest(request.id)
                        }
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-semibold text-blue-600">
                          {request.reference}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {request.customerName}
                          </div>

                          <div className="text-xs text-gray-500">
                            {request.customerEmail}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {request.orderId}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-gray-900">
                            {request.itemName}
                          </div>

                          <div className="text-xs text-gray-500">
                            Qty: {request.quantity}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {REASON_LABELS[
                            request.reason
                          ] || request.reason}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
                              getStatusClass(
                                request.status
                              )
                            }
                          >
                            {STATUS_LABELS[
                              request.status
                            ] || request.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                          {formatDate(
                            request.createdAt
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y md:hidden">
                {requests.map((request) => (
                  <button
                    type="button"
                    key={request.id}
                    onClick={() =>
                      openRequest(request.id)
                    }
                    className="block w-full p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-blue-600">
                          {request.reference}
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {request.customerName}
                        </p>
                      </div>

                      <span
                        className={
                          "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                          getStatusClass(
                            request.status
                          )
                        }
                      >
                        {STATUS_LABELS[
                          request.status
                        ] || request.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">
                          Order
                        </p>

                        <p className="mt-1 font-medium text-gray-800">
                          {request.orderId}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Reason
                        </p>

                        <p className="mt-1 font-medium text-gray-800">
                          {REASON_LABELS[
                            request.reason
                          ] || request.reason}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">
                          Item
                        </p>

                        <p className="mt-1 font-medium text-gray-800">
                          {request.itemName} ×{" "}
                          {request.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      Created{" "}
                      {formatDate(
                        request.createdAt
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading &&
            !error &&
            pagination.totalPages > 0 && (
              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="text-sm text-gray-500">
                  Showing page {pagination.page} of{" "}
                  {pagination.totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(
                          current - 1,
                          1
                        )
                      )
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          current + 1,
                          pagination.totalPages
                        )
                      )
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}

