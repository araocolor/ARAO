import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getInquiryByIdAdmin,
  createReply,
  updateInquiryStatus,
  updateReplyByAdmin,
  deleteReplyByAdmin,
} from "@/lib/consulting";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    return { error: "User email not found", status: 400 };
  }

  const profile = await syncProfile({
    email: user.emailAddresses[0].emailAddress,
    fullName: user.fullName,
  });

  if (!profile || profile.role !== "admin") {
    return { error: "Admin access required", status: 403 };
  }

  return { profile };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if ("error" in adminCheck) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;
    const result = await getInquiryByIdAdmin(id);

    if (!result) {
      return NextResponse.json(
        { message: "Inquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/consulting/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if ("error" in adminCheck) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;
    const body = await request.json() as { content?: string };

    if (!body.content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    const reply = await createReply(id, body.content);

    if (!reply) {
      return NextResponse.json(
        { message: "Failed to create reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/consulting/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if ("error" in adminCheck) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;
    const body = await request.json() as {
      status?: string;
      action?: "reply-edit" | "reply-delete";
      replyId?: string;
      content?: string;
    };

    if (body.action === "reply-edit") {
      if (!body.replyId || !body.content?.trim()) {
        return NextResponse.json(
          { message: "Reply id and content are required" },
          { status: 400 }
        );
      }

      const updatedReply = await updateReplyByAdmin(
        id,
        body.replyId,
        body.content.trim()
      );

      if (!updatedReply) {
        return NextResponse.json(
          { message: "Failed to update reply" },
          { status: 500 }
        );
      }

      return NextResponse.json({ reply: updatedReply });
    }

    if (body.action === "reply-delete") {
      if (!body.replyId) {
        return NextResponse.json(
          { message: "Reply id is required" },
          { status: 400 }
        );
      }

      const deleted = await deleteReplyByAdmin(id, body.replyId);

      if (!deleted) {
        return NextResponse.json(
          { message: "Failed to delete reply" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (
      !body.status ||
      !["pending", "in_progress", "resolved"].includes(body.status)
    ) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      );
    }

    if (body.status === "resolved") {
      return NextResponse.json(
        { message: "답변완료는 답변 작성 시 자동으로 처리됩니다." },
        { status: 400 }
      );
    }

    const updated = await updateInquiryStatus(
      id,
      body.status as "pending" | "in_progress"
    );

    if (!updated) {
      return NextResponse.json(
        { message: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    console.error("PATCH /api/admin/consulting/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
