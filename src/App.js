import React, { useState, useEffect } from 'react';
import './App.css';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w300';
const MOVIES_PER_PAGE = 20;

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YWM5NmEwNjMwZjMyNDhlMzhjMGJmNWYyMzZjZDNjNCIsIm5iZiI6MTc1OTI2MjI5Ny45NDEsInN1YiI6IjY4ZGMzNjU5Yzk5OTEzZThkMGJiMTg0NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.e-obDjOTiojqLTKBRl5yB-1VGivZ13Xb-xewbAjaiNU'
  }
};

function MovieCard({ movie }) {
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const imageUrl = movie.poster_path 
    ? `${IMAGE_BASE_URL}${movie.poster_path}` 
    : 'placeholder.jpg';

  return (
    <div className="movie-card">
      <div className="poster-container">
        <img src={imageUrl} alt={`${movie.title} Poster`} className="movie-poster" />
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="release-date">Release Date: {movie.release_date}</p>
        <p className="rating">Rating: {rating}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortValue, setSortValue] = useState('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, sortValue, allMovies]);

  const fetchMovies = async () => {
    const totalPagesToFetch = 10;
    const fetchPromises = [];

    for (let page = 1; page <= totalPagesToFetch; page++) {
      const url = `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${page}`;
      fetchPromises.push(
        fetch(url, options)
          .then(res => res.json())
          .then(data => data.results)
      );
    }

    try {
      const resultsArrays = await Promise.all(fetchPromises);
      const movies = resultsArrays.flat();
      setAllMovies(movies);
      setFilteredMovies(movies);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load movies.');
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let currentMovies = [...allMovies];

    if (searchTerm) {
      currentMovies = currentMovies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortValue !== 'none') {
      currentMovies.sort((a, b) => {
        if (sortValue.startsWith('release_date')) {
          const dateA = new Date(a.release_date);
          const dateB = new Date(b.release_date);
          return sortValue.endsWith('asc') ? dateA - dateB : dateB - dateA;
        } else if (sortValue.startsWith('rating')) {
          const ratingA = a.vote_average;
          const ratingB = b.vote_average;
          return sortValue.endsWith('asc') ? ratingA - ratingB : ratingB - ratingA;
        }
        return 0;
      });
    }

    setFilteredMovies(currentMovies);
    setCurrentPage(1);
  };

  const changePage = (direction) => {
    setCurrentPage(prev => prev + direction);
  };

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const start = (currentPage - 1) * MOVIES_PER_PAGE;
  const end = start + MOVIES_PER_PAGE;
  const moviesToDisplay = filteredMovies.slice(start, end);

  return (
    <div className="app-container">
      <div className="header-box">
        <h1 className="movie-explorer-title">Movie Explorer</h1>
        <div className="search-bar-box">
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={sortValue} onChange={(e) => setSortValue(e.target.value)}>
            <option value="none">Sort By</option>
            <option value="release_date_asc">Release Date (Asc)</option>
            <option value="release_date_desc">Release Date (Desc)</option>
            <option value="rating_asc">Rating (Asc)</option>
            <option value="rating_desc">Rating (Desc)</option>
          </select>
        </div>
      </div>

      <div className="movie-grid-container">
        {loading && <p className="no-results">Loading movies...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && moviesToDisplay.length === 0 && filteredMovies.length === 0 && (
          <p className="no-results">No movies found matching your criteria.</p>
        )}
        {!loading && !error && moviesToDisplay.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      <div className="pagination-container">
        <button
          onClick={() => changePage(-1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span id="page-display">
          {totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'Page 0 of 0'}
        </span>
        <button
          onClick={() => changePage(1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}