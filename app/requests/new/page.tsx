"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  { value: "DAMAGED", label: "Damaged" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "SIZE_ISSUE", label: "Size Issue" },
  {
    value: "NOT_AS_DESCRIBED",
    label: "Not As Described",
  },
  { value: "CHANGED_MIND", label: "Changed Mind" },
];

export default function NewRequestPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!reason) {
      setError("Please select a return reason.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || null,
          orderId: orderId.trim(),
          itemName: itemName.trim(),
          quantity: parsedQuantity,
          reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message ||
            "Failed to create return request."
        );
      }

      setSuccess(
        "Return request created successfully."
      );

      /*
       * Send the agent to the newly-created request.
       */
      if (result?.data?.id) {
        setTimeout(() => {
          router.push(
            "/requests/" + result.data.id
          );
        }, 500);

        return;
      }

      router.push("/requests");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create return request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/requests")}
          className="mb-5 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to requests
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            New Return Request
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a return request for a customer order.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-5 shadow-sm sm:p-7"
        >
          {/* Customer */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the customer's contact details.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* Customer Name */}
            <div>
              <label
                htmlFor="customerName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Customer Name *
              </label>

              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="customerEmail"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Customer Email *
              </label>

              <input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(event) =>
                  setCustomerEmail(event.target.value)
                }
                placeholder="customer@example.com"
                required
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div className="sm:col-span-2">
              <label
                htmlFor="customerPhone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Customer Phone
              </label>

              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(event) =>
                  setCustomerPhone(event.target.value)
                }
                placeholder="Optional"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order */}
          <div className="my-7 border-t" />

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Order Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the order and item involved in the return.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* Order ID */}
            <div>
              <label
                htmlFor="orderId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Order ID *
              </label>

              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(event) =>
                  setOrderId(event.target.value)
                }
                placeholder="e.g. ORD-10025"
                required
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Quantity *
              </label>

              <input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                required
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Item */}
            <div className="sm:col-span-2">
              <label
                htmlFor="itemName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Item *
              </label>

              <input
                id="itemName"
                type="text"
                value={itemName}
                onChange={(event) =>
                  setItemName(event.target.value)
                }
                placeholder="e.g. Nike Air Max Shoes"
                required
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div className="sm:col-span-2">
              <label
                htmlFor="reason"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Return Reason *
              </label>

              <select
                id="reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                required
                className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">
                  Select a reason
                </option>

                {REASONS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference information */}
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">
              Reference number
            </p>

            <p className="mt-1 text-sm text-gray-500">
              A unique return reference will be generated
              automatically after the request is created.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => router.push("/requests")}
              disabled={loading}
              className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Return Request"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}