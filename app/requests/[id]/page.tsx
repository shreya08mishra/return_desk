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

  /*
   * Fetch the complete request.
   *
   * IMPORTANT:
   * The status API returns the updated request without notes.
   * Therefore after every status change we fetch the complete request
   * again so request.notes is always available.
   */
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

  /*
   * Update request details.
   */
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

  /*
   * Change request status.
   *
   * The server remains the source of truth for allowed transitions.
   */
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

      /*
       * DO NOT do:
       *
       * setRequest(result.data)
       *
       * because the status endpoint doesn't return notes.
       *
       * Instead fetch the complete request again.
       */
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

  /*
   * Add a note.
   */
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

  /*
   * Remove request from the desk.
   *
   * This does NOT delete the database record.
   */
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
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border bg-white p-8">
            <p className="text-gray-500">
              Loading request...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !request) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => router.push("/requests")}
            className="mb-4 text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to requests
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-semibold text-red-800">
              Unable to load request
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border bg-white p-8">
            <p className="text-gray-500">
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/requests")}
            className="mb-4 text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to requests
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {request.reference}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Created {formatDate(request.createdAt)}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                request.status
              )}`}
            >
              {STATUS_LABELS[request.status] || request.status}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              {successMessage}
            </p>
          </div>
        )}

        {/* Request information */}
        <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Request Details
            </h2>

            {canEdit && (
              <button
                onClick={() => setShowEdit((value) => !value)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                {showEdit ? "Cancel Edit" : "Edit Details"}
              </button>
            )}
          </div>

          {showEdit && canEdit ? (
            <form
              onSubmit={handleEdit}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Customer Name
                </label>

                <input
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Customer Email
                </label>

                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) =>
                    setCustomerEmail(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Customer Phone
                </label>

                <input
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Order ID
                </label>

                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Item
                </label>

                <input
                  value={itemName}
                  onChange={(e) =>
                    setItemName(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Reason
                </label>

                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
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
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {actionLoading
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Info
                label="Customer"
                value={request.customerName}
              />

              <Info
                label="Email"
                value={request.customerEmail}
              />

              <Info
                label="Phone"
                value={request.customerPhone || "—"}
              />

              <Info
                label="Order ID"
                value={request.orderId}
              />

              <Info
                label="Item"
                value={request.itemName}
              />

              <Info
                label="Quantity"
                value={String(request.quantity)}
              />

              <Info
                label="Reason"
                value={
                  REASON_LABELS[request.reason] ||
                  request.reason
                }
              />

              <Info
                label="Resolution"
                value={
                  request.resolution
                    ? RESOLUTION_LABELS[request.resolution] ||
                      request.resolution
                    : "—"
                }
              />

              <Info
                label="Refund Amount"
                value={
                  request.refundAmount !== null
                    ? `₹${request.refundAmount}`
                    : "—"
                }
              />

              <Info
                label="Last Updated"
                value={formatDate(request.updatedAt)}
              />
            </div>
          )}

          {isLocked && (
            <p className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Customer and item details are locked because this
              request has already been decided.
            </p>
          )}
        </section>

        {/* Actions */}
        <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Actions
          </h2>

          <div className="flex flex-col gap-4">
            {/* OPEN → IN_REVIEW */}
            {request.status === "OPEN" && (
              <button
                onClick={() => updateStatus("IN_REVIEW")}
                disabled={actionLoading}
                className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-fit"
              >
                {actionLoading
                  ? "Processing..."
                  : "Move to In Review"}
              </button>
            )}

            {/* IN_REVIEW → APPROVED */}
            {request.status === "IN_REVIEW" && (
              <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Approve Request
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Select a resolution before approving.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Resolution
                    </label>

                    <select
                      value={resolution}
                      onChange={(e) =>
                        setResolution(e.target.value)
                      }
                      className="w-full rounded-lg border bg-white px-3 py-2"
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
                      <label className="mb-1 block text-sm font-medium">
                        Refund Amount
                      </label>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={refundAmount}
                        onChange={(e) =>
                          setRefundAmount(e.target.value)
                        }
                        placeholder="Enter amount"
                        className="w-full rounded-lg border bg-white px-3 py-2"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
                    className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Approve Request"}
                  </button>

                  <button
                    onClick={() => updateStatus("REJECTED")}
                    disabled={actionLoading}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            )}

            {/* APPROVED → COMPLETED */}
            {request.status === "APPROVED" && (
              <button
                onClick={() => updateStatus("COMPLETED")}
                disabled={actionLoading}
                className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-fit"
              >
                {actionLoading
                  ? "Processing..."
                  : "Mark as Completed"}
              </button>
            )}

            {/* OPEN / REJECTED → REMOVE */}
            {canRemove && (
              <button
                onClick={handleRemove}
                disabled={actionLoading}
                className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:w-fit"
              >
                Take Off Desk
              </button>
            )}

            {/* FINAL STATES */}
            {(request.status === "REJECTED" ||
              request.status === "COMPLETED") && (
              <p className="text-sm text-gray-500">
                This request is in a final state. No further
                status changes are allowed.
              </p>
            )}
          </div>
        </section>

        {/* Notes */}
        <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Notes
          </h2>

          <form
            onSubmit={handleAddNote}
            className="mt-4"
          >
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Write a note about this request..."
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            />

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-gray-500">
                {noteBody.length}/2000
              </span>

              <button
                type="submit"
                disabled={
                  actionLoading || !noteBody.trim()
                }
                className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Adding..." : "Add Note"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            {notes.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No notes have been added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border bg-gray-50 p-4"
                  >
                    <p className="whitespace-pre-wrap text-sm text-gray-800">
                      {note.body}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}