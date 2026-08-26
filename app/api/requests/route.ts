import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "DAMAGED",
  "WRONG_ITEM",
  "SIZE_ISSUE",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
] as const;

const VALID_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

const REASON_MAP: Record<string, string> = {
  DAMAGED: "DAMAGED",
  Damaged: "DAMAGED",

  WRONG_ITEM: "WRONG_ITEM",
  "Wrong Item": "WRONG_ITEM",

  SIZE_ISSUE: "SIZE_ISSUE",
  "Size Issue": "SIZE_ISSUE",

  NOT_AS_DESCRIBED: "NOT_AS_DESCRIBED",
  "Not As Described": "NOT_AS_DESCRIBED",

  CHANGED_MIND: "CHANGED_MIND",
  "Changed Mind": "CHANGED_MIND",
};

function generateReference() {
  const timestamp = Date.now().toString().slice(-8);
  return `RET-${timestamp}`;
}

/* =========================================================
   POST /api/requests
========================================================= */

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

    const normalizedReason =
      REASON_MAP[String(reason)] || String(reason);

    if (
      !VALID_REASONS.includes(
        normalizedReason as (typeof VALID_REASONS)[number]
      )
    ) {
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

    const existingRequest =
      await prisma.returnRequest.findFirst({
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

    let reference = generateReference();

    while (
      await prisma.returnRequest.findUnique({
        where: { reference },
      })
    ) {
      reference = generateReference();
    }

    const returnRequest =
      await prisma.returnRequest.create({
        data: {
          reference,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          orderId,
          itemName,
          quantity,
          reason: normalizedReason as any,
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
    console.error(
      "Create return request error:",
      error
    );

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while creating the request.",
        },
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET /api/requests
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const rawStatus =
      searchParams.get("status")?.trim() || "";

    const rawReason =
      searchParams.get("reason")?.trim() || "";

    const sort =
      searchParams.get("sort") || "createdAt";

    const order =
      searchParams.get("order") || "desc";

    /* -----------------------------------------------------
       Normalize status
    ----------------------------------------------------- */

    const status = rawStatus.toUpperCase();

    if (
      status &&
      !VALID_STATUSES.includes(
        status as (typeof VALID_STATUSES)[number]
      )
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

    /* -----------------------------------------------------
       Normalize reason

       Frontend may send:

       Damaged

       or:

       DAMAGED

       Prisma requires:

       DAMAGED
    ----------------------------------------------------- */

    const reason = rawReason
      ? REASON_MAP[rawReason] || REASON_MAP[rawReason.toUpperCase()]
      : "";

    if (rawReason && !reason) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REASON",
            message: "The supplied reason is not valid.",
          },
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       Pagination
    ----------------------------------------------------- */

    const parsedPage = Number.parseInt(
      searchParams.get("page") || "1",
      10
    );

    const parsedPageSize =
      Number.parseInt(
        searchParams.get("pageSize") || "10",
        10
      );

    const page = Number.isNaN(parsedPage)
      ? 1
      : Math.max(parsedPage, 1);

    const pageSize = Number.isNaN(
      parsedPageSize
    )
      ? 10
      : Math.min(
          Math.max(parsedPageSize, 1),
          50
        );

    /* -----------------------------------------------------
       Allowed sorting fields
    ----------------------------------------------------- */

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "customerName",
      "status",
      "reason",
      "reference",
    ] as const;

    const safeSort =
      allowedSortFields.includes(
        sort as (typeof allowedSortFields)[number]
      )
        ? sort
        : "createdAt";

    const safeOrder =
      order === "asc" ? "asc" : "desc";

    /* -----------------------------------------------------
       Build filters
    ----------------------------------------------------- */

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
                customerEmail: {
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

      ...(status
        ? {
            status: status as any,
          }
        : {}),

      ...(reason
        ? {
            reason: reason as any,
          }
        : {}),
    };

    /* -----------------------------------------------------
       Fetch filtered requests
    ----------------------------------------------------- */

    const [requests, total] =
      await Promise.all([
        prisma.returnRequest.findMany({
          where,

          orderBy: {
            [safeSort]: safeOrder,
          },

          skip:
            (page - 1) * pageSize,

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

    /* -----------------------------------------------------
       Response
    ----------------------------------------------------- */

    return NextResponse.json({
      data: requests,

      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(
          total / pageSize
        ),
      },
    });
  } catch (error) {
    console.error(
      "List return requests error:",
      error
    );

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