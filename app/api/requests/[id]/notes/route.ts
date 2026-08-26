import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        reference: true,
        removedAt: true,
      },
    });

    if (!returnRequest || returnRequest.removedAt !== null) {
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

    const notes = await prisma.note.findMany({
      where: {
        returnRequestId: requestId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      data: notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching notes.",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        reference: true,
        removedAt: true,
      },
    });

    if (!returnRequest || returnRequest.removedAt !== null) {
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

    const body = await request.json();
    const noteBody =
      typeof body.body === "string" ? body.body.trim() : "";

    if (!noteBody) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_NOTE",
            message: "Note body cannot be empty.",
          },
        },
        { status: 400 }
      );
    }

    if (noteBody.length > 2000) {
      return NextResponse.json(
        {
          error: {
            code: "NOTE_TOO_LONG",
            message: "Note cannot exceed 2000 characters.",
          },
        },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        returnRequestId: requestId,
        body: noteBody,
      },
    });

    return NextResponse.json(
      {
        data: note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create note error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while creating the note.",
        },
      },
      { status: 500 }
    );
  }
}