import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedTransitions: Record<string, string[]> = {
  OPEN: ["IN_REVIEW"],
  IN_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

const validResolutions = [
  "REFUND",
  "REPLACEMENT",
  "STORE_CREDIT",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = Number(id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message: "Request ID must be a positive integer.",
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { status, resolution, refundAmount } = body;

    const existingRequest = await prisma.returnRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!existingRequest || existingRequest.removedAt !== null) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_NOT_FOUND",
            message: "Return request was not found.",
          },
        },
        { status: 404 }
      );
    }

    const currentStatus = existingRequest.status;

    // Validate target status
    if (
      ![
        "OPEN",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
      ].includes(status)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_STATUS",
            message: "The supplied status is not valid.",
          },
        },
        { status: 400 }
      );
    }

    // Validate lifecycle transition
    if (!allowedTransitions[currentStatus].includes(status)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message: `A request cannot move from ${currentStatus} to ${status}.`,
          },
        },
        { status: 409 }
      );
    }

    // Approval requires a valid resolution
    if (status === "APPROVED") {
      if (!validResolutions.includes(resolution)) {
        return NextResponse.json(
          {
            error: {
              code: "RESOLUTION_REQUIRED",
              message:
                "An approved request must have a resolution of Refund, Replacement or Store Credit.",
            },
          },
          { status: 400 }
        );
      }

      if (resolution === "REFUND") {
  const amount = Number(refundAmount);

  if (
    refundAmount === undefined ||
    refundAmount === null ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REFUND_AMOUNT",
          message:
            "A refund resolution requires a valid refund amount greater than zero.",
        },
      },
      { status: 400 }
    );
  }
}

      if (resolution !== "REFUND" && refundAmount !== undefined && refundAmount !== null) {
        return NextResponse.json(
          {
            error: {
              code: "REFUND_AMOUNT_NOT_ALLOWED",
              message:
                "Refund amount can only be recorded when the resolution is Refund.",
            },
          },
          { status: 400 }
        );
      }
    }

    // Resolution/refund amount can only be supplied while approving
    if (status !== "APPROVED" && (resolution !== undefined || refundAmount !== undefined)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_RESOLUTION_UPDATE",
            message:
              "Resolution and refund amount can only be supplied when approving a request.",
          },
        },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.returnRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status,
        ...(status === "APPROVED"
          ? {
              resolution,
              refundAmount:
                resolution === "REFUND"
                  ? Number(refundAmount)
                  : null,
            }
          : {}),
      },
    });

    return NextResponse.json({
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Update request status error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while updating the request status.",
        },
      },
      { status: 500 }
    );
  }
}