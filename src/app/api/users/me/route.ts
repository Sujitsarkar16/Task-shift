import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase, serializeDocument, updateDocument } from '@/lib/db/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      $or: [{ userId }, { email: session?.user?.email }],
    });

    if (!user) {
      // Return session data as fallback
      return NextResponse.json({
        id: userId,
        email: session?.user?.email,
        name: session?.user?.name,
        image: session?.user?.image,
        theme: 'light',
        reminderLeadDays: 3,
      });
    }

    return NextResponse.json(serializeDocument(user));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Only allow safe fields to be updated
    const allowed = ['displayName', 'name', 'theme', 'defaultView', 'reminderLeadDays'];
    const filtered: any = {};
    for (const key of allowed) {
      if (key in body) filtered[key] = body[key];
    }

    const db = await getDatabase();

    // Use the existing updateDocument helper with a raw $set
    const now = new Date();
    const set: Record<string, any> = { updatedAt: now };
    for (const key of Object.keys(filtered)) set[key] = filtered[key];

    const result = await db.collection('users').findOneAndUpdate(
      { $or: [{ userId }, { email: session?.user?.email }] },
      { $set: set },
      { returnDocument: 'after', upsert: false, includeResultMetadata: false },
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDocument(result));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
