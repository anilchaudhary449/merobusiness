import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/mongoose';
import SupportTicket from '@/models/SupportTicket';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    if (!['OPEN', 'RESOLVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();
    const user = session.user as any;

    const query = user.role === 'SUPER_ADMIN' ? { _id: id } : { _id: id, adminId: user.id };
    const ticket = await SupportTicket.findOneAndUpdate(
      query,
      { status },
      { new: true }
    );

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
