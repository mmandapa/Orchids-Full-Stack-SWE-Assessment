"use client"

import { Play, User } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchRecentlyPlayed, fetchMadeForYou, fetchPopularAlbums } from "@/lib/api"
import type { RecentlyPlayed, MadeForYou, PopularAlbum } from "@/lib/api"

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

interface SpotifyMainContentProps {
  onPlayTrack?: (track: Track) => void
}

export default function SpotifyMainContent({ onPlayTrack }: SpotifyMainContentProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([])
  const [madeForYou, setMadeForYou] = useState<MadeForYou[]>([])
  const [popularAlbums, setPopularAlbums] = useState<PopularAlbum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [recentlyPlayedData, madeForYouData, popularAlbumsData] = await Promise.all([
          fetchRecentlyPlayed(1), // Hardcoded user ID for demo
          fetchMadeForYou(1),     // Hardcoded user ID for demo
          fetchPopularAlbums()
        ]);

        setRecentlyPlayed(recentlyPlayedData);
        setMadeForYou(madeForYouData);
        setPopularAlbums(popularAlbumsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handlePlayTrack = (item: any) => {
    const track: Track = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      albumArt: item.image || '/api/placeholder/56/56',
      duration: item.duration
    }
    onPlayTrack?.(track)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-[var(--color-text-secondary)]">Loading...</div>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {recentlyPlayed.map((item) => (
                  <MusicCard
                    key={item.id}
                    title={`Song ${item.songId}`}
                    artist={`User ${item.userId}`}
                    image="https://v3.fal.media/files/panda/kvQ0deOgoUWHP04ajVH3A_output.png"
                    onPlay={() => handlePlayTrack(item)}
                  />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Made For You</h2>
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
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Popular Albums</h2>
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
            </section>
          </>
        )}
      </div>
    </div>
  )
}