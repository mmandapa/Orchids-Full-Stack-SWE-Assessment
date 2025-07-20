"use client"

import { Play, User } from "lucide-react"
import { useState, useEffect } from "react"

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
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([])
  const [madeForYou, setMadeForYou] = useState<any[]>([])
  const [popularAlbums, setPopularAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from database dynamically
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get all available tables
        const tablesResponse = await fetch('/api/db/tables')
        let tables: string[] = []
        
        if (tablesResponse.ok) {
          const json = await tablesResponse.json()
          tables = json.tables || []
        }
        
        // If no tables exist, show fallback data
        if (tables.length === 0) {
          setRecentlyPlayed([])
          setMadeForYou([])
          setPopularAlbums([])
          setLoading(false)
          return
        }
        
        // Fetch data from ALL tables (no filtering by name)
        const allData: { [key: string]: any[] } = {}
        
        for (const table of tables) {
          try {
            const dataResponse = await fetch(`/api/db?table=${encodeURIComponent(table)}`)
            if (dataResponse.ok) {
              const data = await dataResponse.json()
              allData[table] = data.data || []
            }
          } catch (error) {
            console.error(`Error fetching from table ${table}:`, error)
            allData[table] = []
          }
        }
        
        // Collect ALL music data from ALL tables dynamically
        const allMusicData: any[] = []
        
        for (const [tableName, data] of Object.entries(allData)) {
          if (data.length > 0) {
            // Check if this table has music-related columns
            const firstRow = data[0]
            const hasMusicData = firstRow && (
              firstRow.title || firstRow.song_name || firstRow.track_name ||
              firstRow.artist || firstRow.artist_name ||
              firstRow.album || firstRow.album_name || firstRow.albumname ||
              firstRow.name // Generic name field
            )
            
            if (hasMusicData) {
              // Map the data to a consistent structure
              const mappedData = data.map(item => ({
                title: item.title || item.song_name || item.track_name || item.albumname || item.name || 'Unknown Track',
                artist: item.artist || item.artist_name || 'Unknown Artist',
                image: item.cover_image || item.album_cover || item.image_url || item.image || "https://via.placeholder.com/300x300/1db954/ffffff?text=Music",
                id: item.id || Math.random().toString(),
                ...item // Keep all original fields
              }))
              
              allMusicData.push(...mappedData)
              console.log(`Found music data in table ${tableName}:`, mappedData.length, 'items')
            }
          }
        }
        
        console.log('Total music items found:', allMusicData.length)
        console.log('Sample data:', allMusicData.slice(0, 2))
        
        // Distribute ALL music data dynamically across the three sections
        if (allMusicData.length > 0) {
          // Split data into three sections evenly
          const chunkSize = Math.ceil(allMusicData.length / 3)
          const recentlyPlayedData = allMusicData.slice(0, chunkSize)
          const madeForYouData = allMusicData.slice(chunkSize, chunkSize * 2)
          const popularAlbumsData = allMusicData.slice(chunkSize * 2)
          
          console.log('Distributing music data across sections:')
          console.log('Recently played:', recentlyPlayedData.length, 'items')
          console.log('Made for you:', madeForYouData.length, 'items')
          console.log('Popular albums:', popularAlbumsData.length, 'items')
          
          setRecentlyPlayed(recentlyPlayedData)
          setMadeForYou(madeForYouData)
          setPopularAlbums(popularAlbumsData)
        } else {
          // No music data found, use fallbacks
          console.log('No music data found, using fallbacks')
          setRecentlyPlayed([])
          setMadeForYou([])
          setPopularAlbums([])
        }
        
        setLoading(false)
        
      } catch (error) {
        console.error('Error fetching data:', error)
        // Always show fallback data on error
        setRecentlyPlayed([])
        setMadeForYou([])
        setPopularAlbums([])
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Always render all three sections, using fallback if empty

  // Fallback data if database is empty or fails
  const fallbackRecentlyPlayed = [
    { 
      id: "1",
      title: "Liked Songs", 
      artist: "320 songs",
      album: "Your Music",
      image: "https://v3.fal.media/files/panda/kvQ0deOgoUWHP04ajVH3A_output.png",
      duration: 180
    },
    { 
      id: "2",
      title: "Discover Weekly", 
      artist: "Spotify",
      album: "Weekly Mix",
      image: "https://v3.fal.media/files/kangaroo/HRayeBi01JIqfkCjjoenp_output.png",
      duration: 210
    },
    { 
      id: "3",
      title: "Release Radar", 
      artist: "Spotify",
      album: "New Releases",
      image: "https://v3.fal.media/files/panda/q7hWJCgH2Fy4cJdWqAzuk_output.png",
      duration: 195
    },
    { 
      id: "4",
      title: "Daily Mix 1", 
      artist: "Spotify",
      album: "Daily Mix",
      image: "https://v3.fal.media/files/elephant/N5qDbXOpqAlIcK7kJ4BBp_output.png",
      duration: 225
    },
    { 
      id: "5",
      title: "Chill Hits", 
      artist: "Spotify",
      album: "Chill Collection",
      image: "https://v3.fal.media/files/rabbit/tAQ6AzJJdlEZW-y4eNdxO_output.png",
      duration: 240
    },
    { 
      id: "6",
      title: "Top 50 - Global", 
      artist: "Spotify",
      album: "Global Charts",
      image: "https://v3.fal.media/files/kangaroo/0OgdfDAzLEbkda0m7uLJw_output.png",
      duration: 205
    }
  ]

  const fallbackMadeForYou = [
    { 
      id: "7",
      title: "Discover Weekly", 
      artist: "Your weekly mixtape of fresh music",
      album: "Weekly Discovery",
      image: "https://v3.fal.media/files/kangaroo/HRayeBi01JIqfkCjjoenp_output.png",
      duration: 210
    },
    { 
      id: "8",
      title: "Release Radar", 
      artist: "Catch all the latest music from artists you follow",
      album: "New Music Friday",
      image: "https://v3.fal.media/files/panda/q7hWJCgH2Fy4cJdWqAzuk_output.png",
      duration: 195
    },
    { 
      id: "9",
      title: "Daily Mix 1", 
      artist: "Billie Eilish, Lorde, Clairo and more",
      album: "Alternative Mix",
      image: "https://v3.fal.media/files/elephant/N5qDbXOpqAlIcK7kJ4BBp_output.png",
      duration: 225
    },
    { 
      id: "10",
      title: "Daily Mix 2", 
      artist: "Arctic Monkeys, The Strokes, Tame Impala and more",
      album: "Indie Rock Mix",
      image: "https://v3.fal.media/files/rabbit/tAQ6AzJJdlEZW-y4eNdxO_output.png",
      duration: 240
    },
    { 
      id: "11",
      title: "Daily Mix 3", 
      artist: "Taylor Swift, Olivia Rodrigo, Gracie Abrams and more",
      album: "Pop Mix",
      image: "https://v3.fal.media/files/rabbit/b11V_uidRMsa2mTr5mCfz_output.png",
      duration: 190
    },
    { 
      id: "12",
      title: "On Repeat", 
      artist: "The songs you can't get enough of",
      album: "Your Favorites",
      image: "https://v3.fal.media/files/rabbit/mVegWQYIe0yj8NixTQQG-_output.png",
      duration: 220
    }
  ]

  const fallbackPopularAlbums = [
    { 
      id: "13",
      title: "Midnights", 
      artist: "Taylor Swift",
      album: "Midnights",
      image: "https://v3.fal.media/files/elephant/C_rLsEbIUdbn6nQ0wz14S_output.png",
      duration: 275
    },
    { 
      id: "14",
      title: "Harry's House", 
      artist: "Harry Styles",
      album: "Harry's House",
      image: "https://v3.fal.media/files/panda/kvQ0deOgoUWHP04ajVH3A_output.png",
      duration: 245
    },
    { 
      id: "15",
      title: "Un Verano Sin Ti", 
      artist: "Bad Bunny",
      album: "Un Verano Sin Ti",
      image: "https://v3.fal.media/files/kangaroo/HRayeBi01JIqfkCjjoenp_output.png",
      duration: 265
    },
    { 
      id: "16",
      title: "Renaissance", 
      artist: "Beyoncé",
      album: "Renaissance",
      image: "https://v3.fal.media/files/elephant/N5qDbXOpqAlIcK7kJ4BBp_output.png",
      duration: 290
    },
    { 
      id: "17",
      title: "SOUR", 
      artist: "Olivia Rodrigo",
      album: "SOUR",
      image: "https://v3.fal.media/files/rabbit/tAQ6AzJJdlEZW-y4eNdxO_output.png",
      duration: 215
    },
    { 
      id: "18",
      title: "Folklore", 
      artist: "Taylor Swift",
      album: "Folklore",
      image: "https://v3.fal.media/files/rabbit/b11V_uidRMsa2mTr5mCfz_output.png",
      duration: 285
    },
    { 
      id: "19",
      title: "Fine Line", 
      artist: "Harry Styles",
      album: "Fine Line",
      image: "https://v3.fal.media/files/panda/q7hWJCgH2Fy4cJdWqAzuk_output.png",
      duration: 255
    },
    { 
      id: "20",
      title: "After Hours", 
      artist: "The Weeknd",
      album: "After Hours",
      image: "https://v3.fal.media/files/kangaroo/0OgdfDAzLEbkda0m7uLJw_output.png",
      duration: 270
    }
  ]

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

  // Use database data if available, otherwise fallback to static data
  const displayRecentlyPlayed = recentlyPlayed.length > 0 ? recentlyPlayed : fallbackRecentlyPlayed
  const displayMadeForYou = madeForYou.length > 0 ? madeForYou : fallbackMadeForYou
  const displayPopularAlbums = popularAlbums.length > 0 ? popularAlbums : fallbackPopularAlbums

  // Render recently played songs
  const renderRecentlyPlayed = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-800/40 rounded-md p-4 animate-pulse">
              <div className="w-full aspect-square bg-neutral-700 rounded-md mb-4"></div>
              <div className="h-4 bg-neutral-700 rounded mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {fallbackRecentlyPlayed.map((item, index) => (
            <MusicCard
              key={index}
              title={item.title}
              artist={item.artist}
              image={item.image}
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
      );
    }

    // If we have database data, use it
    if (recentlyPlayed.length > 0) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {recentlyPlayed.map((item, index) => (
            <MusicCard
              key={index}
              title={item.title || item.song_name || item.track_name || item.albumname || item.name || 'Unknown Track'}
              artist={item.artist || item.artist_name || 'Unknown Artist'}
              image={item.image || item.cover_image || item.album_cover || item.image_url || "https://via.placeholder.com/300x300/1db954/ffffff?text=Music"}
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
      );
    }

    // Fallback to static data
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {fallbackRecentlyPlayed.map((item, index) => (
          <MusicCard
            key={index}
            title={item.title}
            artist={item.artist}
            image={item.image}
            onPlay={() => handlePlayTrack(item)}
          />
        ))}
      </div>
    );
  };

  // Render made for you playlists
  const renderMadeForYou = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-800/40 rounded-md p-4 animate-pulse">
              <div className="w-full aspect-square bg-neutral-700 rounded-md mb-4"></div>
              <div className="h-4 bg-neutral-700 rounded mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {fallbackMadeForYou.map((item, index) => (
            <MusicCard
              key={index}
              title={item.title || item.song_name || item.track_name || item.albumname || item.name || 'Unknown Track'}
              artist={item.artist || item.artist_name || 'Unknown Artist'}
              image={item.image || item.cover_image || item.album_cover || item.image_url || "https://via.placeholder.com/300x300/1db954/ffffff?text=Music"}
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
      );
    }

    // If we have database data, use it
    if (madeForYou.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {madeForYou.map((item, index) => (
            <MusicCard
              key={index}
              title={item.title || item.song_name || item.track_name || item.albumname || item.name || 'Unknown Track'}
              artist={item.artist || item.artist_name || 'Unknown Artist'}
              image={item.image || item.cover_image || item.album_cover || item.image_url || "https://via.placeholder.com/300x300/1db954/ffffff?text=Music"}
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
      );
    }

    // Fallback to static data
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {fallbackMadeForYou.map((item, index) => (
          <MusicCard
            key={index}
            title={item.title}
            artist={item.artist}
            image={item.image}
            onPlay={() => handlePlayTrack(item)}
          />
        ))}
      </div>
    );
  };

  // Render popular albums
  const renderPopularAlbums = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-800/40 rounded-md p-4 animate-pulse">
              <div className="w-full aspect-square bg-neutral-700 rounded-md mb-4"></div>
              <div className="h-4 bg-neutral-700 rounded mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {fallbackPopularAlbums.map((album, index) => (
            <div key={index} className="bg-neutral-800/40 rounded-md p-4 hover:bg-neutral-800/60 transition-colors group">
              <div className="relative">
                <img 
                  src={album.image} 
                  alt={album.title} 
                  className="w-full aspect-square object-cover rounded-md mb-4"
                />
                <button className="absolute bottom-6 right-2 bg-green-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4 text-black" />
                </button>
              </div>
              <h3 className="font-semibold truncate">{album.title}</h3>
              <p className="text-sm text-neutral-400 truncate">{album.artist}</p>
            </div>
          ))}
        </div>
      );
    }

    // If we have database data, use it
    if (popularAlbums.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {popularAlbums.map((album, index) => (
            <div key={index} className="bg-neutral-800/40 rounded-md p-4 hover:bg-neutral-800/60 transition-colors group">
              <div className="relative">
                <img 
                  src={album.cover_image || album.album_cover || album.image_url || album.image || "https://via.placeholder.com/300x300/1db954/ffffff?text=Album"} 
                  alt={album.title || album.album_name || album.name} 
                  className="w-full aspect-square object-cover rounded-md mb-4"
                />
                <button className="absolute bottom-6 right-2 bg-green-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4 text-black" />
                </button>
              </div>
              <h3 className="font-semibold truncate">{album.title || album.album_name || album.name}</h3>
              <p className="text-sm text-neutral-400 truncate">{album.artist || album.artist_name}</p>
            </div>
          ))}
        </div>
      );
    }

    // Fallback to static data
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {fallbackPopularAlbums.map((album, index) => (
          <div key={index} className="bg-neutral-800/40 rounded-md p-4 hover:bg-neutral-800/60 transition-colors group">
            <div className="relative">
              <img 
                src={album.image} 
                alt={album.title} 
                className="w-full aspect-square object-cover rounded-md mb-4"
              />
              <button className="absolute bottom-6 right-2 bg-green-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-4 w-4 text-black" />
              </button>
            </div>
            <h3 className="font-semibold truncate">{album.title}</h3>
            <p className="text-sm text-neutral-400 truncate">{album.artist}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Good afternoon</h1>
          </div>
          <div className="w-8 h-8 bg-[var(--color-muted)] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </div>
        </div>

        {/* Recently Played */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Recently played</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-neutral-800/40 rounded-md p-4 animate-pulse">
                <div className="w-full aspect-square bg-neutral-700 rounded-md mb-4"></div>
                <div className="h-4 bg-neutral-700 rounded mb-2"></div>
                <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Made For You */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Made For You</h2>
            <button className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] transition-colors">
              Show all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-neutral-800/40 rounded-md p-4 animate-pulse">
                <div className="w-full aspect-square bg-neutral-700 rounded-md mb-4"></div>
                <div className="h-4 bg-neutral-700 rounded mb-2"></div>
                <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Albums */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Popular albums</h2>
            <button className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] transition-colors">
              Show all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-neutral-800/40 rounded-md p-4 animate-pulse">
                <div className="w-full aspect-square bg-neutral-700 rounded-md mb-4"></div>
                <div className="h-4 bg-neutral-700 rounded mb-2"></div>
                <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-[var(--color-text-secondary)]">Showing fallback content</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Good afternoon</h1>
        </div>
        <div className="w-8 h-8 bg-[var(--color-muted)] rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </div>
      </div>

      {/* Recently Played */}
      <section className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Recently played</h2>
        </div>
        {renderRecentlyPlayed()}
      </section>

      {/* Made For You */}
      <section className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Made For You</h2>
          <button className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] transition-colors">
            Show all
          </button>
        </div>
        {renderMadeForYou()}
      </section>

      {/* Popular Albums */}
      <section className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Popular albums</h2>
          <button className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] transition-colors">
            Show all
          </button>
        </div>
        {renderPopularAlbums()}
      </section>

      <style jsx>{`
        .scrollbar-hide {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-scrollbar: hidden;
        }
        
        .scrollbar-hide {
          /* Hide scrollbar for IE, Edge and Firefox */
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}