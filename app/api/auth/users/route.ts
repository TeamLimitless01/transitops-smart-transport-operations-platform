import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations/auth";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    // Auth guard — only FLEET_MANAGER can create users
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.user.role !== "FLEET_MANAGER") {
      return NextResponse.json(
        { error: "Only Fleet Managers can create users" },
        { status: 403 }
      );
    }

    // Validate body
    const body = await req.json();
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { name, email, phone, password, role } = result.data;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[CREATE USER ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
