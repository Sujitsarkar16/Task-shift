import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { listDocuments, createDocument } from '@/lib/db/database';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query: any = { userId };
    
    // Support filtering by isCompleted, priority, etc.
    if (searchParams.has('isCompleted')) query.isCompleted = searchParams.get('isCompleted');
    if (searchParams.has('priority')) query.priority = searchParams.get('priority');

    const todos = await listDocuments('todos', query);
    return NextResponse.json(todos);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const newTodo = await createDocument('todos', { ...body, userId });
    
    return NextResponse.json(newTodo, { status: 201 });
  } catch (error: any) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
