import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import ProductFAQ from "@/models/ProductFAQ";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ siteId: string; productId: string }> }
) {
  try {
    const { siteId, productId } = await params;
    await dbConnect();

    const faqs = await ProductFAQ.find({ siteId, productId }).sort({ createdAt: -1 });

    return NextResponse.json(faqs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Store admins can add FAQs via the builder, but customers might ask too.
// For now, this GET provides the data for the store display.
