const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const base = 'http://localhost:3001/api';

async function main() {
  try {
    // 1. Create a book
    const createRes = await fetch(`${base}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Book',
        authors: ['Author A'],
        category: 'Fiction',
        source: 'manual'
      })
    });
    if (!createRes.ok) throw new Error('Create failed: ' + createRes.status);
    const created = await createRes.json();
    console.log('Created:', created.id);
    const bookId = created.id;

    // 2. Get all books
    const allRes = await fetch(`${base}/books`);
    if (!allRes.ok) throw new Error('Get all failed');
    const all = await allRes.json();
    console.log('All count:', all.length);

    // 3. Update book title
    const updateRes = await fetch(`${base}/books/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Test Book' })
    });
    if (!updateRes.ok) throw new Error('Update failed');
    const updated = await updateRes.json();
    console.log('Updated title:', updated.title);

    // 4. Toggle favorite
    const favRes = await fetch(`${base}/books/${bookId}/favorite`, { method: 'PATCH' });
    if (!favRes.ok) throw new Error('Favorite toggle failed');
    const fav = await favRes.json();
    console.log('Favorite now:', fav.isFavorite);

    // 5. Change reading status
    const statusRes = await fetch(`${base}/books/${bookId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readingStatus: 'Reading' })
    });
    if (!statusRes.ok) throw new Error('Status update failed');
    const status = await statusRes.json();
    console.log('Status now:', status.readingStatus);

    // 6. Add rating
    const ratingRes = await fetch(`${base}/books/${bookId}/rating`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 4 })
    });
    if (!ratingRes.ok) throw new Error('Rating update failed');
    const rating = await ratingRes.json();
    console.log('Rating now:', rating.rating);

    // 7. Get statistics
    const statsRes = await fetch(`${base}/statistics`);
    if (!statsRes.ok) throw new Error('Statistics fetch failed');
    const stats = await statsRes.json();
    console.log('Statistics totalBooks:', stats.totalBooks);

    // 8. Get history for the book
    const histRes = await fetch(`${base}/books/${bookId}/history`);
    if (!histRes.ok) throw new Error('History fetch failed');
    const history = await histRes.json();
    console.log('History entries:', history.length);

    // 9. Delete the book
    const delRes = await fetch(`${base}/books/${bookId}`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error('Delete failed');
    console.log('Deleted book');

    console.log('All tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err.message);
    process.exit(1);
  }
}

main();
