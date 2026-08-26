"use client";

import { useEffect, useState } from "react";

type ReturnRequest = {
  id: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  itemName: string;
  quantity: number;
  reason: string;
  status: string;
  resolution?: string | null;
  refundAmount?: number | null;
  createdAt: string;
};

type ApiResponse = {
  data: ReturnRequest[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
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

export default function Home() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequests();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, status, reason, sort, order, page]);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (reason) params.set("reason", reason);

      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("pageSize", "10");

      const response = await fetch(`/api/requests?${params.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        throw new Error(
          body?.error?.message || "Failed to load return requests."
        );
      }

      const result: ApiResponse = await response.json();

      setRequests(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load return requests."
      );
    } finally {
      setLoading(false);
    }
  }

  function statusClass(currentStatus: string) {
    switch (currentStatus) {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ReturnDesk
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer return requests
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search customer, order or reference..."
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All reasons</option>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="createdAt">Newest</option>
              <option value="customerName">Customer</option>
              <option value="status">Status</option>
              <option value="reason">Reason</option>
            </select>

            <button
              onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Sort: {order === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          {loading && (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading return requests...
            </div>
          )}

          {!loading && error && (
            <div className="p-10 text-center">
              <p className="font-medium text-red-600">{error}</p>

              <button
                onClick={loadRequests}
                className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="p-10 text-center text-sm text-gray-500">
              No return requests found.
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Reason</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {requests.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium">
                        {item.reference}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium">
                          {item.customerName}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.customerEmail}
                        </div>
                      </td>

                      <td className="px-4 py-4">{item.orderId}</td>

                      <td className="px-4 py-4">
                        {item.itemName}
                        <span className="ml-1 text-gray-500">
                          × {item.quantity}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {REASON_LABELS[item.reason] || item.reason}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            item.status
                          )}`}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={`/requests/${item.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}