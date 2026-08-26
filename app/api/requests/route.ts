import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "DAMAGED",
  "WRONG_ITEM",
  "SIZE_ISSUE",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
] as const;

function generateReference() {
  const timestamp = Date.now().toString().slice(-8);
  return `RET-${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      orderId,
      itemName,
      quantity,
      reason,
    } = body;

    // Required field validation
    if (
      !customerName ||
      !customerEmail ||
      !orderId ||
      !itemName ||
      quantity === undefined ||
      !reason
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              "customerName, customerEmail, orderId, itemName, quantity and reason are required.",
          },
        },
        { status: 400 }
      );
    }

    // Quantity validation
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_QUANTITY",
            message: "Quantity must be a positive whole number.",
          },
        },
        { status: 400 }
      );
    }

    // Reason validation
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REASON",
            message: "The supplied return reason is not valid.",
          },
        },
        { status: 400 }
      );
    }

    // Check for an existing live request
    const existingRequest = await prisma.returnRequest.findFirst({
      where: {
        orderId,
        itemName,
        removedAt: null,
        status: {
          in: ["OPEN", "IN_REVIEW", "APPROVED"],
        },
      },
    });

    if (existingRequest) {
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

    // Generate a unique human-readable reference
    let reference = generateReference();

    while (
      await prisma.returnRequest.findUnique({
        where: { reference },
      })
    ) {
      reference = generateReference();
    }

    // Create request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        reference,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        orderId,
        itemName,
        quantity,
        reason,
        status: "OPEN",
      },
    });

    return NextResponse.json(
      {
        data: returnRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create return request error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while creating the request.",
        },
      },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const reason = searchParams.get("reason") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const page = Math.max(
      Number.parseInt(searchParams.get("page") || "1", 10),
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number.parseInt(searchParams.get("pageSize") || "10", 10),
        1
      ),
      50
    );

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "customerName",
      "status",
      "reason",
      "reference",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const where = {
      removedAt: null,

      ...(search
        ? {
            OR: [
              {
                customerName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                orderId: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                reference: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(status ? { status: status as any } : {}),

      ...(reason ? { reason: reason as any } : {}),
    };

    const [requests, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        orderBy: {
          [safeSortBy]: sortOrder,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          notes: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      }),

      prisma.returnRequest.count({
        where,
      }),
    ]);

    return NextResponse.json({
      data: requests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("List return requests error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while fetching return requests.",
        },
      },
      { status: 500 }
    );
  }
}