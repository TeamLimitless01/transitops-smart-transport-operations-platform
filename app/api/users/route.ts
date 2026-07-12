import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations/auth";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.user.role !== "FLEET_MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        driver: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET USERS ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.user.role !== "FLEET_MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

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

    const { name, email, phone, password, role, licenseNumber, licenseCategory, licenseExpiryDate } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userAndDriver = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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

      if (role === "DRIVER") {
        await tx.driver.create({
          data: {
            userId: newUser.id,
            name,
            contactNumber: phone || "",
            licenseNumber: licenseNumber!,
            licenseCategory: licenseCategory!,
            licenseExpiryDate: new Date(licenseExpiryDate!),
          },
        });
      }

      return {
        ...newUser,
        driver: role === "DRIVER" ? { status: "AVAILABLE" } : null,
      };
    });

    return NextResponse.json(userAndDriver, { status: 201 });
  } catch (error) {
    console.error("[CREATE USER ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
