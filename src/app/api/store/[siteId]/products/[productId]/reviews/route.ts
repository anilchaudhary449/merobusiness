import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Review from "@/models/Review";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ siteId: string; productId: string }> }
) {
  try {
    const { siteId, productId } = await params;
    await dbConnect();

    const reviews = await Review.find({ siteId, productId })
      .populate('userId', 'name firstName lastName')
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string; productId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please log in to leave a review." }, { status: 401 });
  }

  try {
    const { siteId, productId } = await params;
    const { rating, comment } = await req.json();

    if (!rating || !comment) {
      return NextResponse.json({ error: "Rating and comment are required." }, { status: 400 });
    }

    await dbConnect();

    const review = await Review.create({
      userId: (session.user as any).id,
      siteId,
      productId,
      rating,
      comment,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
