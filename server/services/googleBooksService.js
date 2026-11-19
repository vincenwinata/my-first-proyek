// Use native Node.js fetch (v18+) with fallback
const getFetch = () => (typeof fetch === 'function' ? fetch : (...args) => import('node-fetch').then(({ default: f }) => f(...args)));
require('dotenv').config();

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

function formatBookItem(item) {
  const vol = item.volumeInfo || {};
  let cover = (vol.imageLinks && (vol.imageLinks.thumbnail || vol.imageLinks.smallThumbnail)) || null;
  if (cover && cover.startsWith('http://')) {
    cover = cover.replace('http://', 'https://');
  }

  // Format industry identifier (ISBN_13 preferred, fallback to ISBN_10)
  let isbn = null;
  if (vol.industryIdentifiers && Array.isArray(vol.industryIdentifiers)) {
    const isbn13 = vol.industryIdentifiers.find(id => id.type === 'ISBN_13');
    const isbn10 = vol.industryIdentifiers.find(id => id.type === 'ISBN_10');
    isbn = (isbn13 && isbn13.identifier) || (isbn10 && isbn10.identifier) || null;
  }

  return {
    googleVolumeId: item.id,
    title: vol.title || 'Tidak tersedia',
    authors: Array.isArray(vol.authors) ? vol.authors : (vol.authors ? [vol.authors] : []),
    category: (vol.categories && vol.categories[0]) || null,
    publisher: vol.publisher || null,
    publishedDate: vol.publishedDate || null,
    isbn,
    description: vol.description || null,
    coverUrl: cover,
  };
}

/**
 * Fetch raw items from Google Books for a given query string
 */
async function fetchFromGoogle(queryString) {
  const fetchClient = getFetch();
  const apiKeyParam = API_KEY ? `&key=${encodeURIComponent(API_KEY)}` : '';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryString)}&maxResults=30&printType=books&orderBy=relevance${apiKeyParam}`;

  try {
    const res = await fetchClient(url);
    if (!res.ok) {
      console.warn(`Google Books responded with HTTP ${res.status} for query: ${queryString}`);
      return [];
    }
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.warn(`Fetch error for query: ${queryString}`, err.message);
    return [];
  }
}

/**
 * Search Google Books volumes with smart author and title resolution.
 * @param {string} query Search keyword(s).
 * @param {string} [type='all'] 'all' | 'author' | 'title'
 * @returns {Promise<Array>}
 */
async function searchBooks(query, type = 'all') {
  if (!query || typeof query !== 'string') return [];

  let cleanQuery = query.trim();

  // Detect explicit author prefix in search query (e.g. "penulis: tere liye", "penulis tere liye", "author: tere liye")
  const authorPrefixMatch = cleanQuery.match(/^(?:penulis|author|oleh)\s*[:\-]?\s*(.+)$/i);
  let explicitAuthorSearch = false;

  if (authorPrefixMatch) {
    cleanQuery = authorPrefixMatch[1].trim();
    explicitAuthorSearch = true;
  }

  let rawItems = [];

  if (type === 'author' || explicitAuthorSearch) {
    // Specifically search by author
    const authorQuery = `inauthor:"${cleanQuery}"`;
    rawItems = await fetchFromGoogle(authorQuery);

    // If exact inauthor returned few results, try without quotes
    if (rawItems.length < 5) {
      const fallbackItems = await fetchFromGoogle(`inauthor:${cleanQuery}`);
      rawItems = rawItems.concat(fallbackItems);
    }
  } else if (type === 'title') {
    // Specifically search by title
    const titleQuery = `intitle:"${cleanQuery}"`;
    rawItems = await fetchFromGoogle(titleQuery);
    if (rawItems.length < 5) {
      const fallbackItems = await fetchFromGoogle(`intitle:${cleanQuery}`);
      rawItems = rawItems.concat(fallbackItems);
    }
  } else {
    // General search: query both inauthor and general query concurrently
    // This solves queries like "tere liye" where general query gets polluted by Hindi phrases
    const [authorItems, generalItems] = await Promise.all([
      fetchFromGoogle(`inauthor:"${cleanQuery}"`),
      fetchFromGoogle(cleanQuery),
    ]);

    // Prioritize author results first if any exist
    rawItems = authorItems.concat(generalItems);
  }

  // Deduplicate by Google Volume ID
  const seenIds = new Set();
  const uniqueItems = [];

  for (const item of rawItems) {
    if (item && item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }

  const formattedBooks = uniqueItems.map(formatBookItem);

  // Smart ranking:
  // 1. Books where an author matches the cleanQuery
  // 2. Books where the title matches the cleanQuery
  // 3. Other books
  const targetLower = cleanQuery.toLowerCase();

  formattedBooks.sort((a, b) => {
    const aAuthorMatch = a.authors.some(auth => auth.toLowerCase().includes(targetLower));
    const bAuthorMatch = b.authors.some(auth => auth.toLowerCase().includes(targetLower));

    if (aAuthorMatch && !bAuthorMatch) return -1;
    if (!aAuthorMatch && bAuthorMatch) return 1;

    const aTitleMatch = a.title.toLowerCase().includes(targetLower);
    const bTitleMatch = b.title.toLowerCase().includes(targetLower);

    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;

    return 0;
  });

  return formattedBooks;
}

module.exports = { searchBooks };
