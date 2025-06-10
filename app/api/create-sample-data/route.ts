import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createSampleData } from '@/lib/sample-data';

export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await createSampleData();
    
    if (result?.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Failed to create sample data', details: result?.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
