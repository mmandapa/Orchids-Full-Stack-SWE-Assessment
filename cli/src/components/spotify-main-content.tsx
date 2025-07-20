import React, { useState, useEffect } from 'react';

const SpotifyMainContent = () => {
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      fetch('/api/db?table=recently_played')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch');
          }
          return response.json();
        })
        .then(data => {
          setRecentlyPlayed(data);
          setLoading(false);
        })
        .catch(error => {
          setError(error.toString());
          setLoading(false);
        });
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Recently Played</h2>
            <ul>
              {recentlyPlayed.length ? (
                recentlyPlayed.map(({ id, song_name, artist_name }) => (
                  <li key={id}>{song_name} by {artist_name}</li>
                ))
              ) : (
                <li>No recently played songs found.</li>
              )}
            </ul>
        </div>
    );
};

export default SpotifyMainContent;