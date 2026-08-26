"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  notes?: Note[];
};

type Note = {
  id: number;
  returnRequestId: number;
  body: string;
  createdAt: string;
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

const RESOLUTION_LABELS: Record<string, string> = {
  REFUND: "Refund",
  REPLACEMENT: "Replacement",
  STORE_CREDIT: "Store Credit",
};

function getStatusStyle(status: string) {
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

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RequestDetails() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [request, setRequest] = useState<ReturnRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const [showEdit, setShowEdit] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const fetchRequest = async () => {
    try {
      setError("");

      const response = await fetch(`/api/requests/${id}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message || "Failed to fetch return request."
        );
      }

      setRequest(result.data);

      setCustomerName(result.data.customerName);
      setCustomerEmail(result.data.customerEmail);
      setCustomerPhone(result.data.customerPhone ?? "");
      setOrderId(result.data.orderId);
      setItemName(result.data.itemName);
      setQuantity(String(result.data.quantity));
      setReason(result.data.reason);

      setResolution(result.data.resolution ?? "");
      setRefundAmount(
        result.data.refundAmount !== null
          ? String(result.data.refundAmount)
          : ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load return request."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          orderId,
          itemName,
          quantity: Number(quantity),
          reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message || "Failed to update request."
        );
      }

      setShowEdit(false);

      await fetchRequest();

      setSuccessMessage("Request details updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (
    newStatus: string,
    selectedResolution?: string,
    selectedRefundAmount?: string
  ) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const body: {
        status: string;
        resolution?: string;
        refundAmount?: number;
      } = {
        status: newStatus,
      };

      if (newStatus === "APPROVED") {
        body.resolution = selectedResolution;

        if (selectedResolution === "REFUND") {
          body.refundAmount = Number(selectedRefundAmount);
        }
      }

      const response = await fetch(`/api/requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message || "Failed to update request status."
        );
      }

      await fetchRequest();

      setSuccessMessage(
        `Request moved to ${STATUS_LABELS[newStatus] || newStatus}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update request status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!noteBody.trim()) {
      setError("Note cannot be empty.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/requests/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: noteBody.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message || "Failed to add note."
        );
      }

      setNoteBody("");

      await fetchRequest();

      setSuccessMessage("Note added successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add note."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to take this request off the desk?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message || "Failed to remove request."
        );
      }

      router.push("/requests");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove request."
      );

      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7ff] p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse rounded-[28px] border border-white/80 bg-white/80 p-8 shadow-xl">
            <div className="h-5 w-32 rounded bg-slate-100" />
            <div className="mt-6 h-10 w-72 rounded bg-slate-100" />
            <div className="mt-3 h-4 w-48 rounded bg-slate-100" />

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="h-28 rounded-2xl bg-slate-100" />
              <div className="h-28 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !request) {
    return (
      <main className="min-h-screen bg-[#f4f7ff] p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.push("/requests")}
            className="mb-5 font-semibold text-violet-600 hover:text-violet-800"
          >
            ← Back to requests
          </button>

          <div className="rounded-[28px] border border-rose-200 bg-white p-8 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 font-black text-rose-600">
              !
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              Unable to load request
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-[#f4f7ff] p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-white bg-white p-8 shadow-xl">
            <p className="text-slate-500">
              Return request not found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isLocked =
    request.status === "APPROVED" ||
    request.status === "REJECTED" ||
    request.status === "COMPLETED";

  const canEdit =
    request.status === "OPEN" ||
    request.status === "IN_REVIEW";

  const canRemove =
    request.status === "OPEN" ||
    request.status === "REJECTED";

  const notes = request.notes ?? [];

  const status = getStatusStyle(request.status);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7ff] text-slate-900">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-violet-300/20 blur-3xl" />

        <div className="absolute right-0 top-20 h-[32rem] w-[32rem] rounded-full bg-blue-300/20 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-300/10 blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 translate-y-1 rounded-2xl bg-violet-700/25 blur-sm" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 font-black text-white shadow-lg">
                R
              </div>
            </div>

            <div className="text-left">
              <p className="font-black tracking-tight text-slate-950">
                Return<span className="text-violet-600">Desk</span>
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Returns Platform
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600"
          >
            ← All Requests
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="mb-5 text-sm font-bold text-violet-600 transition hover:text-violet-800"
          >
            ← Back to requests
          </button>

          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#111827] via-[#312e81] to-[#4f46e5] p-6 shadow-2xl shadow-indigo-900/20 sm:p-8">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />

            <div className="absolute bottom-0 right-40 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-100 backdrop-blur-md">
                    Return Request
                  </span>

                  <span className="text-xs text-indigo-200/70">
                    #{request.id}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {request.reference}
                </h1>

                <p className="mt-2 text-sm text-indigo-100/70">
                  Created {formatDate(request.createdAt)}
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ring-1 ring-inset ${status.badge}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${status.dot}`}
                />

                {STATUS_LABELS[request.status] || request.status}
              </div>
            </div>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm">
            <p className="text-sm font-bold text-rose-700">
              {error}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                ✓
              </span>

              <p className="text-sm font-bold text-emerald-700">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Request information */}
            <section className="overflow-hidden rounded-[26px] border border-white/80 bg-white/85 shadow-xl shadow-slate-300/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-500">
                    Customer & order
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Request details
                  </h2>
                </div>

                {canEdit && (
                  <button
                    onClick={() => setShowEdit((value) => !value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600"
                  >
                    {showEdit ? "Cancel Edit" : "Edit Details"}
                  </button>
                )}
              </div>

              {showEdit && canEdit ? (
                <form
                  onSubmit={handleEdit}
                  className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"
                >
                  <EditInput
                    label="Customer Name"
                    value={customerName}
                    onChange={setCustomerName}
                    required
                  />

                  <EditInput
                    label="Customer Email"
                    value={customerEmail}
                    onChange={setCustomerEmail}
                    type="email"
                    required
                  />

                  <EditInput
                    label="Customer Phone"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                  />

                  <EditInput
                    label="Order ID"
                    value={orderId}
                    onChange={setOrderId}
                    required
                  />

                  <EditInput
                    label="Item"
                    value={itemName}
                    onChange={setItemName}
                    required
                  />

                  <EditInput
                    label="Quantity"
                    value={quantity}
                    onChange={setQuantity}
                    type="number"
                    required
                  />

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Reason
                    </label>

                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="DAMAGED">Damaged</option>
                      <option value="WRONG_ITEM">Wrong Item</option>
                      <option value="SIZE_ISSUE">Size Issue</option>
                      <option value="NOT_AS_DESCRIBED">
                        Not As Described
                      </option>
                      <option value="CHANGED_MIND">
                        Changed Mind
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <Info
                    label="Customer"
                    value={request.customerName}
                    icon="◉"
                  />

                  <Info
                    label="Email"
                    value={request.customerEmail}
                    icon="@"
                  />

                  <Info
                    label="Phone"
                    value={request.customerPhone || "—"}
                    icon="⌕"
                  />

                  <Info
                    label="Order ID"
                    value={request.orderId}
                    icon="#"
                  />

                  <Info
                    label="Item"
                    value={request.itemName}
                    icon="◆"
                  />

                  <Info
                    label="Quantity"
                    value={String(request.quantity)}
                    icon="×"
                  />

                  <Info
                    label="Reason"
                    value={
                      REASON_LABELS[request.reason] ||
                      request.reason
                    }
                    icon="!"
                  />

                  <Info
                    label="Resolution"
                    value={
                      request.resolution
                        ? RESOLUTION_LABELS[request.resolution] ||
                          request.resolution
                        : "—"
                    }
                    icon="✓"
                  />
                </div>
              )}

              {isLocked && (
                <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:mx-6">
                  <p className="text-xs font-medium leading-5 text-slate-500">
                    🔒 Customer and item details are locked because
                    this request has already been decided.
                  </p>
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="overflow-hidden rounded-[26px] border border-white/80 bg-white/85 shadow-xl shadow-slate-300/20 backdrop-blur-xl">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-500">
                  Internal communication
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Notes
                </h2>
              </div>

              <div className="p-5 sm:p-6">
                <form onSubmit={handleAddNote}>
                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="Write an internal note about this request..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      {noteBody.length}/2000
                    </span>

                    <button
                      type="submit"
                      disabled={
                        actionLoading || !noteBody.trim()
                      }
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? "Adding..." : "Add Note"}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  {notes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-7 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                        ✦
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-700">
                        No notes yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Add an internal note to keep the team updated.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-black text-white">
                              N
                            </div>

                            <div className="min-w-0">
                              <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                                {note.body}
                              </p>

                              <p className="mt-2 text-[11px] font-medium text-slate-400">
                                {formatDate(note.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Resolution summary */}
            <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#111827] via-[#312e81] to-[#4f46e5] p-6 text-white shadow-2xl shadow-indigo-900/20">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-200">
                  Resolution
                </p>

                <h2 className="mt-2 text-xl font-black">
                  {request.resolution
                    ? RESOLUTION_LABELS[request.resolution] ||
                      request.resolution
                    : "Pending decision"}
                </h2>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Refund amount
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {request.refundAmount !== null
                      ? `₹${request.refundAmount}`
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="rounded-[26px] border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-500">
                Workflow
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-950">
                Actions
              </h2>

              <div className="mt-5 space-y-4">
                {/* OPEN → IN_REVIEW */}
                {request.status === "OPEN" && (
                  <button
                    onClick={() => updateStatus("IN_REVIEW")}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Move to In Review →"}
                  </button>
                )}

                {/* IN_REVIEW */}
                {request.status === "IN_REVIEW" && (
                  <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 p-4">
                    <h3 className="font-black text-slate-900">
                      Approve request
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Select a resolution before approving this
                      request.
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                          Resolution
                        </label>

                        <select
                          value={resolution}
                          onChange={(e) =>
                            setResolution(e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                        >
                          <option value="">
                            Select resolution
                          </option>

                          <option value="REFUND">
                            Refund
                          </option>

                          <option value="REPLACEMENT">
                            Replacement
                          </option>

                          <option value="STORE_CREDIT">
                            Store Credit
                          </option>
                        </select>
                      </div>

                      {resolution === "REFUND" && (
                        <div>
                          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                            Refund Amount
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                              ₹
                            </span>

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={refundAmount}
                              onChange={(e) =>
                                setRefundAmount(e.target.value)
                              }
                              placeholder="0.00"
                              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-3 text-sm font-bold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          updateStatus(
                            "APPROVED",
                            resolution,
                            refundAmount
                          )
                        }
                        disabled={
                          actionLoading ||
                          !resolution ||
                          (resolution === "REFUND" &&
                            !refundAmount)
                        }
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {actionLoading
                          ? "Processing..."
                          : "✓ Approve Request"}
                      </button>
                    </div>

                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-violet-100" />
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        or
                      </span>
                      <div className="h-px flex-1 bg-violet-100" />
                    </div>

                    <button
                      onClick={() => updateStatus("REJECTED")}
                      disabled={actionLoading}
                      className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                  </div>
                )}

                {/* APPROVED */}
                {request.status === "APPROVED" && (
                  <button
                    onClick={() => updateStatus("COMPLETED")}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "✓ Mark as Completed"}
                  </button>
                )}

                {/* REMOVE */}
                {canRemove && (
                  <button
                    onClick={handleRemove}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    Take Off Desk
                  </button>
                )}

                {/* FINAL */}
                {(request.status === "REJECTED" ||
                  request.status === "COMPLETED") && (
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xs font-medium leading-5 text-slate-500">
                      This request is in a final state. No further
                      status changes are allowed.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Request metadata */}
            <section className="rounded-[26px] border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-500">
                Activity
              </p>

              <div className="mt-4 space-y-4">
                <MetaRow
                  label="Created"
                  value={formatDate(request.createdAt)}
                />

                <MetaRow
                  label="Last updated"
                  value={formatDate(request.updatedAt)}
                />

                <MetaRow
                  label="Request ID"
                  value={`#${request.id}`}
                />
              </div>
            </section>
          </aside>
        </div>

        <footer className="py-8 text-center">
          <p className="text-xs font-medium text-slate-400">
            ReturnDesk · Intelligent returns management
          </p>
        </footer>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-xs font-black text-violet-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
      />
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>

      <span className="text-right text-xs font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}
