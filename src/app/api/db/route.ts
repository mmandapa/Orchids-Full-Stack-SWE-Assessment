import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { recentlyPlayed, madeForYou, popularAlbums } from '../../../../db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'recently_played';
    
    let data;
    
    switch (table) {
      case 'recently_played':
        data = await db.select().from(recentlyPlayed).orderBy(desc(recentlyPlayed.playedAt)).limit(10);
        break;
      case 'made_for_you':
        data = await db.select().from(madeForYou).limit(10);
        break;
      case 'popular_albums':
        data = await db.select().from(popularAlbums).limit(10);
        break;
      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, data } = body;
    
    let result;
    
    switch (table) {
      case 'recently_played':
        result = await db.insert(recentlyPlayed).values(data);
        break;
      case 'made_for_you':
        result = await db.insert(madeForYou).values(data);
        break;
      case 'popular_albums':
        result = await db.insert(popularAlbums).values(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}