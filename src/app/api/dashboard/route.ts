import { NextResponse } from "next/server";
import { getUserDashboardData } from "@/app/actions/profile";

export async function GET() {
  try {
    const result = await getUserDashboardData();

    if (!result.success) {
      if (result.error.includes("Unauthorized")) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }
      return NextResponse.json(
        { error: result.error },
        { status: 400 }, // Or 500 depending on error, but 400 is safer for now
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API /api/dashboard Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
