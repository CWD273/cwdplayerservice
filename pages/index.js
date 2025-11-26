export async function getServerSideProps(context) {
  const { id, src } = context.query;

  if (!id) {
    return { props: { error: 'Missing ?id parameter' } };
  }

  const catalogURL = src || 'https://cwdiptvb.github.io/admin/channel.json';

  try {
    const res = await fetch(catalogURL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status} ${res.statusText}`);
    const channels = await res.json();

    const channel = Array.isArray(channels)
      ? channels.find(c => c.id === id || c.name === id)
      : (channels && (channels.id === id || channels.name === id) ? channels : null);

    if (!channel) {
      return { props: { error: `Channel not found for id="${id}"` } };
    }

    // Build master playlist — include only present fields
    let playlist = '#EXTM3U\n';
    const attrs = [];
    if (channel.name) attrs.push(`NAME="${channel.name}"`);
    if (channel.codecs) attrs.push(`CODECS="${channel.codecs}"`);
    if (channel.resolution) attrs.push(`RESOLUTION=1280x${channel.resolution}`); // assume width if only height given
    if (channel.bdwh) attrs.push(`BANDWIDTH=${channel.bdwh}`);
    if (channel.bdwhavg) attrs.push(`AVERAGE-BANDWIDTH=${channel.bdwhavg}`);
    if (channel.fps) attrs.push(`FRAME-RATE=${channel.fps}`);

    if (attrs.length) playlist += `#EXT-X-STREAM-INF:${attrs.join(',')}\n`;

    let streamURL = channel.url;
    if (channel.proxy) {
      streamURL = `https://hlsr.vercel.app/api/proxy?url=${encodeURIComponent(streamURL)}`;
    }
    playlist += `${streamURL}\n`;

    // Serve raw .m3u8
    context.res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    context.res.setHeader('Cache-Control', 'no-store');
    context.res.write(playlist);
    context.res.end();

    return { props: {} };
  } catch (err) {
    return { props: { error: `Error: ${err.message}` } };
  }
}

export default function Home({ error }) {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Playlist service</h1>
      <p>{error || 'Serving playlist...'}</p>
      <p>Use ?id=your-channel-id (and optional ?src=custom-catalog-url)</p>
    </main>
  );
}
