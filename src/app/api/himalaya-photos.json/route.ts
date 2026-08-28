import { NextResponse } from "next/server";
import { listHimalayaPhotoUrls } from "@/data/himalaya-photos";

export const dynamic = "force-static";

export interface HimalayaPhotosResponse {
  photos: string[];
}

export async function GET() {
  try {
    const photos = await listHimalayaPhotoUrls();
    const body: HimalayaPhotosResponse = { photos };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Failed to list Himalaya photographs" },
      { status: 500 },
    );
  }
}
