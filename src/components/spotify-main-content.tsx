"use client"

import { Play, User, RefreshCcw } from "lucide-react"
import { useEffect, useState } from "react"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
}

interface MusicCardProps {
  title: string
  artist: string
  image?: string
  size?: "small" | "medium" | "large"
  className?: string
  onPlay?: () => void
}

interface RecentlyPlayed {
  id: number;
  songTitle: string;
  artistName: string;
  playedAt: string;
}

interface MadeForYou {
  id: number;
  userId: number;
  playlistId: number;
  title: string;
  description: string;
  coverImage: string;
  createdAt: string;
}

interface PopularAlbum {
  id: number;
  title: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  totalTracks: number;
  popularity: number;
  createdAt: string;
}

function MusicCard({ title, artist, image, size = "medium", className = "", onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: "w-[180px] h-[180px]",
    medium: "w-full aspect-square",
    large: "w-full aspect-square"
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlay?.()
  }

  return (
    <div 
      className={`group cursor-pointer p-4 rounded-lg transition-all duration-300 hover:bg-[var(--color-interactive-hover)] border border-transparent hover:border-gray-600/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative ${sizeClasses[size]} mb-4`}>
        <div className="w-full h-full bg-[var(--color-muted)] rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-chart-1)] opacity-20 rounded-lg"></div>
          )}
        </div>
        
        {/* Play button overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div 
            onClick={handlePlayClick}
            className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 cursor-pointer"
          >
            <Play className="w-5 h-5 text-black fill-black ml-1" />
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-[var(--color-text-primary)] text-sm truncate">{title}</h3>
        <p className="text-[var(--color-text-secondary)] text-xs truncate">{artist}</p>
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  count?: number
}

function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="w-full aspect-square bg-[var(--color-muted)] rounded-lg mb-4"></div>
          <div className="h-4 bg-[var(--color-muted)] rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[var(--color-muted)] rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-[var(--color-text-secondary)] mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)] text-black hover:scale-105 transition-transform"
      >
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  )
}

interface SpotifyMainContentProps {
  onPlayTrack?: (track: Track) => void
}

export default function SpotifyMainContent({ onPlayTrack }: SpotifyMainContentProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([])
  const [madeForYou, setMadeForYou] = useState<MadeForYou[]>([])
  const [popularAlbums, setPopularAlbums] = useState<PopularAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching data...');
      
      const [recentlyPlayedRes, madeForYouRes, popularAlbumsRes] = await Promise.all([
        fetch('/api/db?table=recently_played'),
        fetch('/api/db?table=made_for_you'),
        fetch('/api/db?table=popular_albums')
      ]);

      const [recentlyPlayedData, madeForYouData, popularAlbumsData] = await Promise.all([
        recentlyPlayedRes.json(),
        madeForYouRes.json(),
        popularAlbumsRes.json()
      ]);

      setRecentlyPlayed(recentlyPlayedData.data || []);
      setMadeForYou(madeForYouData.data || []);
      setPopularAlbums(popularAlbumsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlayTrack = (item: any) => {
    if (!item) return;
    
    const track: Track = {
      id: item.id?.toString() || '0',
      title: 'songTitle' in item ? item.songTitle : item.title || 'Unknown Title',
      artist: 'artistName' in item ? item.artistName : item.artist || 'Unknown Artist',
      album: 'album' in item ? item.album : 'Unknown Album',
      albumArt: item.coverImage || '/api/placeholder/56/56',
      duration: item.duration || 180
    }
    onPlayTrack?.(track)
  }

  if (error) {
  return (
      <div className="flex-1 overflow-y-auto bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="p-6">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
          {loading ? (
            <LoadingSkeleton />
          ) : recentlyPlayed.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {recentlyPlayed.map((item) => (
              <MusicCard 
                  key={item.id}
                  title={item.songTitle}
                  artist={item.artistName}
                  image="https://v3.fal.media/files/panda/kvQ0deOgoUWHP04ajVH3A_output.png"
                onPlay={() => handlePlayTrack(item)}
              />
              ))}
            </div>
          ) : (
            <div className="text-center text-[var(--color-text-secondary)]">
              No recently played songs
        </div>
          )}
      </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Made For You</h2>
          {loading ? (
            <LoadingSkeleton />
          ) : madeForYou.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {madeForYou.map((item) => (
            <MusicCard 
                  key={item.id}
              title={item.title} 
                  artist={item.description || 'Custom Mix'}
                  image={item.coverImage || "https://v3.fal.media/files/kangaroo/HRayeBi01JIqfkCjjoenp_output.png"}
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
          ) : (
            <div className="text-center text-[var(--color-text-secondary)]">
              No personalized playlists available
            </div>
          )}
      </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Popular Albums</h2>
          {loading ? (
            <LoadingSkeleton />
          ) : popularAlbums.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {popularAlbums.map((item) => (
            <MusicCard 
                  key={item.id}
              title={item.title} 
              artist={item.artist}
                  image={item.coverImage || "https://v3.fal.media/files/elephant/C_rLsEbIUdbn6nQ0wz14S_output.png"}
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
          ) : (
            <div className="text-center text-[var(--color-text-secondary)]">
              No popular albums available
            </div>
          )}
      </section>
      </div>
    </div>
  )
}