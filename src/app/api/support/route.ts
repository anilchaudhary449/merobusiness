import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/mongoose';
import SupportTicket from '@/models/SupportTicket';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PREPARED_QUESTIONS, FAQ_TRIGGER_PREFIX } from '@/lib/constants/support';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = session.user as any;

    if (user.role === 'SUPER_ADMIN') {
      // Super-admin sees all open/recent tickets, populated with admin info
      const tickets = await SupportTicket.find()
        .populate('adminId', 'name email phone businessName panNumber')
        .sort({ lastMessageAt: -1 })
        .limit(50);
      return NextResponse.json(tickets);
    } else {
      // Regular admin sees their own ticket
      let ticket = await SupportTicket.findOne({ adminId: user.id });
      if (!ticket) {
        // Create initial ticket if doesn't exist
        ticket = await SupportTicket.create({
          adminId: user.id,
          status: 'OPEN',
          messages: [],
        });
      }
      return NextResponse.json(ticket);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { text, ticketId } = await req.json();
    if (!text) return NextResponse.json({ error: 'Message text is required' }, { status: 400 });

    const user = session.user as any;

    let ticket;
    if (user.role === 'SUPER_ADMIN') {
      if (!ticketId) return NextResponse.json({ error: 'Ticket ID is required for super-admin replies' }, { status: 400 });
      ticket = await SupportTicket.findById(ticketId);
    } else {
      ticket = await SupportTicket.findOne({ adminId: user.id });
      if (!ticket) {
        ticket = new SupportTicket({ adminId: user.id, messages: [] });
      }
    }

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    ticket.messages.push({
      senderId: user.id,
      text,
      createdAt: new Date(),
    });
    ticket.lastMessageAt = new Date();
    ticket.status = 'OPEN'; // Default to open for new messages

    // Automated FAQ logic
    if (text.startsWith(FAQ_TRIGGER_PREFIX)) {
      const faqId = text.replace(FAQ_TRIGGER_PREFIX, '');
      const faq = PREPARED_QUESTIONS.find(f => f.id === faqId);
      
      if (faq) {
        // Find a super-admin to act as the responder
        const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
        if (superAdmin) {
          // Replace the trigger message with a cleaner Admin message
          ticket.messages[ticket.messages.length - 1].text = `[Need Help] ${faq.q}`;
          
          // Add automated reply
          ticket.messages.push({
            senderId: superAdmin._id.toString(),
            text: `[MeroBusiness Assistant] ${faq.a}`,
            createdAt: new Date(),
          });
          ticket.status = 'RESOLVED';
        }
      }
    }

    await ticket.save();

    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
