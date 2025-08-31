(async function () {
  const root = document.getElementById('lastfm-recent');
  if (!root) return;

  const user = root.dataset.user;
  const limit = root.dataset.limit || '10';
  const API_KEY = '3803eb29b45b46fdbde7a9a266813efa';

  const enforceHTTPS = (u) => (u && u.startsWith('http://')) ? 'https://' + u.slice(7) : (u || '');
  const pickImage = (images) => {
    // images: [{size, #text}, ...] — pick largest non-empty, enforce https
    const nonEmpty = (images || []).filter(i => i && i['#text']).map(i => i['#text']);
    const chosen = nonEmpty[nonEmpty.length - 1] || ''; // last is usually biggest
    return enforceHTTPS(chosen);
  };

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', 'user.getRecentTracks');
  url.searchParams.set('user', user);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', limit);
  url.searchParams.set('extended', '1');  // richer metadata
  url.searchParams.set('autocorrect', '1');

  root.innerHTML = `<div class="lastfm-loading">Loading recent tracks…</div>`;

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const tracks = (data.recenttracks && data.recenttracks.track) || [];

    if (!tracks.length) {
      root.innerHTML = `<div class="lastfm-empty">No recent tracks.</div>`;
      return;
    }

    const html = tracks.map(t => {
      const name   = t.name;
      const artist = t.artist && (t.artist.name || t.artist['#text'] || t.artist);
      const url    = t.url;
      const img    = pickImage(t.image);
      const now    = !!t['@attr']?.nowplaying;   // "now playing" flag
      const dateTs = t.date?.uts ? Number(t.date.uts) * 1000 : null;

      const when = now
        ? 'Now playing'
        : (dateTs ? new Date(dateTs).toLocaleString() : '');

      return `
        <a class="lastfm-item" href="${url}" target="_blank" rel="noopener" title="${when}">
          <img class="lastfm-art" src="${img}" alt="">
          <div class="lastfm-meta">
            <div class="lastfm-title">
              ${name}
              ${now ? '<span class="lastfm-now">●</span>' : ''}
            </div>
            <div class="lastfm-artist">${artist}</div>
            ${!now && when ? `<div class="lastfm-plays">${when}</div>` : ''}
          </div>
        </a>
      `;
    }).join('');

    root.innerHTML = `<div class="lastfm-bar">${html}</div>`;
  } catch (e) {
    root.innerHTML = `<div class="lastfm-error">Failed to load Last.fm: ${e.message}</div>`;
  }
})();
