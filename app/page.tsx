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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusStyle(status: string) {
  switch (status) {
    case "OPEN":
      return {
        badge: "bg-sky-50 text-sky-700 ring-sky-200",
        dot: "bg-sky-500",
      };

    case "IN_REVIEW":
      return {
        badge: "bg-violet-50 text-violet-700 ring-violet-200",
        dot: "bg-violet-500",
      };

    case "APPROVED":
      return {
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        dot: "bg-emerald-500",
      };

    case "REJECTED":
      return {
        badge: "bg-rose-50 text-rose-700 ring-rose-200",
        dot: "bg-rose-500",
      };

    case "COMPLETED":
      return {
        badge: "bg-slate-100 text-slate-700 ring-slate-200",
        dot: "bg-slate-500",
      };

    default:
      return {
        badge: "bg-slate-100 text-slate-600 ring-slate-200",
        dot: "bg-slate-400",
      };
  }
}

export default function Home() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState<ApiResponse["meta"]>();
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
      setMeta(result.meta);
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

  const total = meta?.total ?? requests.length;

  const openCount = requests.filter(
    (item) => item.status === "OPEN"
  ).length;

  const reviewCount = requests.filter(
    (item) => item.status === "IN_REVIEW"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7ff] text-slate-900">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="absolute right-0 top-20 h-[30rem] w-[30rem] rounded-full bg-blue-300/20 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-300/10 blur-3xl" />
      </div>

      {/* NAVBAR */}
      <header className="relative z-10 border-b border-white/50 bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* 3D Logo */}
            <div className="relative">
              <div className="absolute inset-0 translate-y-1 rounded-2xl bg-violet-700/30 blur-sm" />

              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-lg font-black text-white shadow-lg shadow-indigo-500/25">
                R
              </div>
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-950">
                Return<span className="text-violet-600">Desk</span>
              </h1>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Returns Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System operational
            </div>

            <a
              href="/requests/new"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
            >
              <span className="text-lg leading-none transition group-hover:rotate-90">
                +
              </span>
              New Return
            </a>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#111827] via-[#312e81] to-[#4f46e5] p-7 shadow-2xl shadow-indigo-900/15 sm:p-9">
            {/* Decorative circles */}
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />

            <div className="absolute -bottom-28 right-28 h-72 w-72 rounded-full bg-violet-400/10 blur-2xl" />

            <div className="relative max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
                Returns command center
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Welcome
                <br />
                <span className="bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">
                  Manage every return with confidence
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100/80">
                Track customer requests, review return reasons and move
                resolutions forward from one intelligent workspace.
              </p>
            </div>

            <div className="relative mt-7 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-wider text-indigo-200">
                  Total requests
                </p>

                <p className="mt-0.5 text-xl font-black text-white">
                  {total}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-wider text-indigo-200">
                  Active queue
                </p>

                <p className="mt-0.5 text-xl font-black text-white">
                  {openCount + reviewCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STAT CARDS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-xl transition group-hover:bg-violet-500/20" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Requests
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {total}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  All return activity
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl text-white shadow-lg shadow-indigo-500/20">
                ≡
              </div>
            </div>
          </div>

          {/* Open */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/10 blur-xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Open
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {openCount}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Waiting for review
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-xl text-white shadow-lg shadow-blue-500/20">
                ○
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  In Review
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {reviewCount}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Being processed
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xl text-white shadow-lg shadow-violet-500/20">
                ◷
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {completedCount}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Successfully resolved
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xl text-white shadow-lg shadow-emerald-500/20">
                ✓
              </div>
            </div>
          </div>
        </section>

        {/* FILTER CARD */}
        <section className="mb-5 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-950">
                  Return queue
                </h3>

                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                  LIVE
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Search and filter customer requests.
              </p>
            </div>

            {(search || status || reason) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setReason("");
                  setPage(1);
                }}
                className="text-xs font-bold text-violet-600 hover:text-violet-800"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search customer, order or reference..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            >
              <option value="">All reasons</option>

              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={label}>
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
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            >
              <option value="createdAt">Newest</option>
              <option value="customerName">Customer</option>
              <option value="status">Status</option>
              <option value="reason">Reason</option>
            </select>

            <button
              onClick={() =>
                setOrder(order === "desc" ? "asc" : "desc")
              }
              className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              title="Change sort direction"
            >
              {order === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white/85 shadow-2xl shadow-slate-300/25 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h3 className="font-bold text-slate-950">
                Recent requests
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Monitor your customer return pipeline.
              </p>
            </div>

            {!loading && !error && requests.length > 0 && (
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                Page {meta?.page ?? page}
              </div>
            )}
          </div>

          {loading && (
            <div className="space-y-5 p-7">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded-full bg-slate-100" />
                    <div className="h-3 w-64 rounded-full bg-slate-100" />
                  </div>

                  <div className="h-7 w-24 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-xl font-black text-rose-600">
                !
              </div>

              <h3 className="font-bold text-slate-950">
                Something went wrong
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                {error}
              </p>

              <button
                onClick={loadRequests}
                className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 text-2xl text-violet-600 shadow-inner">
                ⌕
              </div>

              <h3 className="font-bold text-slate-950">
                No requests found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try adjusting your filters or create your first return
                request.
              </p>

              <a
                href="/requests/new"
                className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
              >
                Create request
              </a>
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50/60">
                    <tr>
                      {[
                        "Request",
                        "Customer",
                        "Order",
                        "Item",
                        "Reason",
                        "Status",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {requests.map((item) => {
                      const style = statusStyle(item.status);

                      return (
                        <tr
                          key={item.id}
                          className="group transition duration-200 hover:bg-violet-50/30"
                        >
                          <td className="px-5 py-4">
                            <a
                              href={`/requests/${item.id}`}
                              className="font-bold text-slate-900 transition hover:text-violet-600"
                            >
                              {item.reference}
                            </a>

                            <p className="mt-1 text-[11px] font-medium text-slate-400">
                              ID #{item.id}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-sm" />

                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-black text-white shadow-md">
                                  {getInitials(item.customerName)}
                                </div>
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {item.customerName}
                                </p>

                                <p className="max-w-[190px] truncate text-xs text-slate-400">
                                  {item.customerEmail}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                              {item.orderId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {item.itemName}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Qty {item.quantity}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-slate-600">
                              {REASON_LABELS[item.reason] || item.reason}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black ring-1 ring-inset ${style.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                              />

                              {STATUS_LABELS[item.status] ||
                                item.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <a
                              href={`/requests/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600 hover:shadow-md"
                            >
                              View
                              <span className="transition group-hover:translate-x-0.5">
                                →
                              </span>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <p className="text-xs font-medium text-slate-400">
                    Page{" "}
                    <span className="font-bold text-slate-700">
                      {meta.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-700">
                      {meta.totalPages}
                    </span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => current - 1)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Previous
                    </button>

                    <button
                      disabled={page >= meta.totalPages}
                      onClick={() =>
                        setPage((current) => current + 1)
                      }
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* FOOTER */}
        <footer className="py-8 text-center">
          <p className="text-xs font-medium text-slate-400">
            ReturnDesk · Intelligent returns management
          </p>
        </footer>
      </div>
    </main>
  );
}
