import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "DAMAGED",
  "WRONG_ITEM",
  "SIZE_ISSUE",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
] as const;

const LIVE_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "APPROVED",
];

const LOCKED_STATUSES = [
  "APPROVED",
  "REJECTED",
  "COMPLETED",
];

const REMOVABLE_STATUSES = [
  "OPEN",
  "REJECTED",
];

function getRequestId(id: string) {
  const requestId = Number(id);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return null;
  }

  return requestId;
}

/* GET /api/requests/[id] */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = getRequestId(id);

    if (requestId === null) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message:
              "Request ID must be a positive integer.",
          },
        },
        { status: 400 }
      );
    }

    const returnRequest =
      await prisma.returnRequest.findFirst({
        where: {
          id: requestId,
          removedAt: null,
        },
        include: {
          notes: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!returnRequest) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_NOT_FOUND",
            message:
              "Return request not found.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: returnRequest,
    });
  } catch (error) {
    console.error(
      "GET /api/requests/[id] failed:",
      error
    );

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Unable to fetch the return request.",
        },
      },
      { status: 500 }
    );
  }
}

/* PATCH /api/requests/[id] */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = getRequestId(id);

    if (requestId === null) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message:
              "Request ID must be a positive integer.",
          },
        },
        { status: 400 }
      );
    }

    const existingRequest =
      await prisma.returnRequest.findUnique({
        where: {
          id: requestId,
        },
      });

    if (
      !existingRequest ||
      existingRequest.removedAt !== null
    ) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_NOT_FOUND",
            message:
              "Return request was not found.",
          },
        },
        { status: 404 }
      );
    }

    /*
     * Approved, Rejected and Completed requests
     * are locked.
     */
    if (
      LOCKED_STATUSES.includes(
        existingRequest.status
      )
    ) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_LOCKED",
            message:
              "Customer and item details cannot be edited after the request has been decided.",
          },
        },
        { status: 409 }
      );
    }

    /*
     * Only Open and In Review can be edited.
     */
    if (
      existingRequest.status !== "OPEN" &&
      existingRequest.status !== "IN_REVIEW"
    ) {
      return NextResponse.json(
        {
          error: {
            code: "EDIT_NOT_ALLOWED",
            message:
              "This request cannot be edited in its current state.",
          },
        },
        { status: 409 }
      );
    }

    let body: {
      customerName?: unknown;
      customerEmail?: unknown;
      customerPhone?: unknown;
      orderId?: unknown;
      itemName?: unknown;
      quantity?: unknown;
      reason?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message:
              "Request body must contain valid JSON.",
          },
        },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      orderId,
      itemName,
      quantity,
      reason,
    } = body;

    /*
     * At least one field must be supplied.
     */
    if (
      customerName === undefined &&
      customerEmail === undefined &&
      customerPhone === undefined &&
      orderId === undefined &&
      itemName === undefined &&
      quantity === undefined &&
      reason === undefined
    ) {
      return NextResponse.json(
        {
          error: {
            code: "NO_FIELDS",
            message:
              "At least one editable field must be supplied.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * Customer name.
     */
    if (
      customerName !== undefined &&
      (typeof customerName !== "string" ||
        customerName.trim() === "")
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CUSTOMER_NAME",
            message:
              "Customer name must be a non-empty string.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * Customer email.
     */
    if (
      customerEmail !== undefined &&
      (typeof customerEmail !== "string" ||
        customerEmail.trim() === "")
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CUSTOMER_EMAIL",
            message:
              "Customer email must be a non-empty string.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * Phone.
     */
    if (
      customerPhone !== undefined &&
      customerPhone !== null &&
      typeof customerPhone !== "string"
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CUSTOMER_PHONE",
            message:
              "Customer phone must be a string or null.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * Order ID.
     */
    if (
      orderId !== undefined &&
      (typeof orderId !== "string" ||
        orderId.trim() === "")
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ORDER_ID",
            message:
              "Order ID must be a non-empty string.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * Item.
     */
    if (
      itemName !== undefined &&
      (typeof itemName !== "string" ||
        itemName.trim() === "")
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ITEM_NAME",
            message:
              "Item name must be a non-empty string.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * Quantity.
     */
    if (quantity !== undefined) {
      if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_QUANTITY",
              message:
                "Quantity must be a positive whole number.",
            },
          },
          { status: 400 }
        );
      }
    }

    /*
     * Reason.
     */
    if (reason !== undefined) {
      if (
        typeof reason !== "string" ||
        !VALID_REASONS.includes(
          reason as (typeof VALID_REASONS)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_REASON",
              message:
                "The supplied return reason is not valid.",
            },
          },
          { status: 400 }
        );
      }
    }

    /*
     * Calculate the next order/item values.
     */
    const nextOrderId =
      typeof orderId === "string"
        ? orderId.trim()
        : existingRequest.orderId;

    const nextItemName =
      typeof itemName === "string"
        ? itemName.trim()
        : existingRequest.itemName;

    /*
     * Enforce one live request per order + item.
     */
    if (
      nextOrderId !== existingRequest.orderId ||
      nextItemName !== existingRequest.itemName
    ) {
      const duplicate =
        await prisma.returnRequest.findFirst({
          where: {
            id: {
              not: requestId,
            },
            orderId: nextOrderId,
            itemName: nextItemName,
            removedAt: null,
            status: {
              in: LIVE_STATUSES as any,
            },
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            error: {
              code: "LIVE_REQUEST_EXISTS",
              message:
                "A live return request already exists for this order and item.",
            },
          },
          { status: 409 }
        );
      }
    }

    /*
     * IMPORTANT:
     * Pass the fields directly to Prisma.
     *
     * This avoids the TypeScript error that can happen
     * when a generic object is passed to Prisma's typed
     * `data` property.
     */
    const updatedRequest =
      await prisma.returnRequest.update({
        where: {
          id: requestId,
        },
        data: {
          ...(typeof customerName === "string"
            ? {
                customerName:
                  customerName.trim(),
              }
            : {}),

          ...(typeof customerEmail === "string"
            ? {
                customerEmail:
                  customerEmail.trim(),
              }
            : {}),

          ...(customerPhone !== undefined
            ? {
                customerPhone:
                  typeof customerPhone === "string"
                    ? customerPhone.trim() || null
                    : null,
              }
            : {}),

          ...(typeof orderId === "string"
            ? {
                orderId: orderId.trim(),
              }
            : {}),

          ...(typeof itemName === "string"
            ? {
                itemName: itemName.trim(),
              }
            : {}),

          ...(typeof quantity === "number"
            ? {
                quantity,
              }
            : {}),

          ...(typeof reason === "string"
            ? {
                reason: reason as any,
              }
            : {}),
        },
      });

    return NextResponse.json({
      data: updatedRequest,
    });
  } catch (error) {
    console.error(
      "PATCH /api/requests/[id] failed:",
      error
    );

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while updating the request.",
        },
      },
      { status: 500 }
    );
  }
}

/* DELETE /api/requests/[id] */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = getRequestId(id);

    if (requestId === null) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message:
              "Request ID must be a positive integer.",
          },
        },
        { status: 400 }
      );
    }

    const existingRequest =
      await prisma.returnRequest.findUnique({
        where: {
          id: requestId,
        },
      });

    if (
      !existingRequest ||
      existingRequest.removedAt !== null
    ) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_NOT_FOUND",
            message:
              "Return request was not found.",
          },
        },
        { status: 404 }
      );
    }

    /*
     * Only Open and Rejected can be removed.
     */
    if (
      !REMOVABLE_STATUSES.includes(
        existingRequest.status
      )
    ) {
      return NextResponse.json(
        {
          error: {
            code: "REMOVAL_NOT_ALLOWED",
            message:
              "Only Open or Rejected requests can be taken off the desk.",
          },
        },
        { status: 409 }
      );
    }

    /*
     * Soft delete.
     *
     * The database record remains.
     */
    const removedRequest =
      await prisma.returnRequest.update({
        where: {
          id: requestId,
        },
        data: {
          removedAt: new Date(),
        },
        select: {
          id: true,
          reference: true,
          status: true,
          removedAt: true,
        },
      });

    return NextResponse.json({
      data: removedRequest,
    });
  } catch (error) {
    console.error(
      "DELETE /api/requests/[id] failed:",
      error
    );

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while removing the request.",
        },
      },
      { status: 500 }
    );
  }
}