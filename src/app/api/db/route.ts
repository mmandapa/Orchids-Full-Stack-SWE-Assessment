import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const userId = searchParams.get('userId');

    if (!table) {
      return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
    }

    let data;
    switch (table) {
      case 'recently_played':
        data = await db.query.recentlyPlayed.findMany({
          where: userId ? eq(schema.recentlyPlayed.userId, parseInt(userId)) : undefined,
          orderBy: (fields) => [fields.playedAt.desc()],
          limit: 50,
        });
        break;

      case 'made_for_you':
        data = await db.query.madeForYou.findMany({
          where: userId ? eq(schema.madeForYou.userId, parseInt(userId)) : undefined,
          orderBy: (fields) => [fields.createdAt.desc()],
        });
        break;

      case 'popular_albums':
        data = await db.query.popularAlbums.findMany({
          orderBy: (fields) => [fields.popularity.desc()],
          limit: 20,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, data } = body;

    if (!table || !data) {
      return NextResponse.json({ error: 'Table and data parameters are required' }, { status: 400 });
    }

    let result;
    switch (table) {
      case 'recently_played':
        result = await db.insert(schema.recentlyPlayed).values(data);
        break;

      case 'made_for_you':
        result = await db.insert(schema.madeForYou).values(data);
        break;

      case 'popular_albums':
        result = await db.insert(schema.popularAlbums).values(data);
        break;

      default:
        return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 