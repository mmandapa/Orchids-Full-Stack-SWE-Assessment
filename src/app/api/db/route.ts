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
        data = await db
          .select()
          .from(recentlyPlayed)
          .orderBy(desc(recentlyPlayed.playedAt))
          .limit(10);
        break;

      case 'made_for_you':
        data = await db
          .select()
          .from(madeForYou)
          .orderBy(desc(madeForYou.createdAt))
          .limit(10);
        break;

      case 'popular_albums':
        data = await db
          .select()
          .from(popularAlbums)
          .orderBy(desc(popularAlbums.popularity))
          .limit(10);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid table parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { table, data } = await request.json();

    switch (table) {
      case 'recently_played':
        await db.insert(recentlyPlayed).values({
          songTitle: data.songTitle,
          artistName: data.artistName,
          playedAt: new Date()
        });
        break;

      case 'made_for_you':
        await db.insert(madeForYou).values({
          userId: data.userId,
          playlistId: data.playlistId,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          createdAt: new Date()
        });
        break;

      case 'popular_albums':
        await db.insert(popularAlbums).values({
          title: data.title,
          artist: data.artist,
          coverImage: data.coverImage,
          releaseDate: new Date(data.releaseDate),
          totalTracks: data.totalTracks,
          popularity: data.popularity,
          createdAt: new Date()
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid table parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: 'Data added successfully' });
  } catch (error) {
    console.error('Error adding data:', error);
    return NextResponse.json(
      { error: 'Failed to add data' },
      { status: 500 }
    );
  }
}