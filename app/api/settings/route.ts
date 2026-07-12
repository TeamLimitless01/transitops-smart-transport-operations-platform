import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPermissions, savePermissions } from "@/lib/permissions";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const permissions = getPermissions();
    const settings = getSystemSettings();
    return NextResponse.json({ permissions, settings });
  } catch (error) {
    console.error("[GET SETTINGS ERROR]", error);
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
      return NextResponse.json({ error: "Access denied — Fleet Managers only" }, { status: 403 });
    }

    const body = await req.json();

    if (body.permissions || body.settings) {
      if (body.permissions) {
        savePermissions(body.permissions);
      }
      if (body.settings) {
        saveSystemSettings(body.settings);
      }
    } else {
      savePermissions(body);
    }

    return NextResponse.json({
      success: true,
      permissions: getPermissions(),
      settings: getSystemSettings(),
    });
  } catch (error: any) {
    console.error("[POST SETTINGS ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

