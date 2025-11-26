import Head from 'next/head';

export async function getServerSideProps(context) {
  const { id, src } = context.query;

  if (!id) return { props: { error: 'Missing ?id parameter' } };

  const catalogURL = src || 'https://cwdiptvb.github.io/admin/channel.json';

  try {
    const res = await fetch(catalogURL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status} ${res.statusText}`);
    const channels = await res.json();

    const channel = Array.isArray(channels)
      ? channels.find(c => c.id === id || c.name === id)
      : (channels && (channels.id === id || channels.name === id) ? channels : null);

    if (!channel) return { props: { error: `Channel not found for id="${id}"` } };

    // Always force proxy to avoid CORS/mixed content issues
    let streamURL = `https://hlsr.vercel.app/api/proxy?url=${encodeURIComponent(channel.url)}`;

    return {
      props: {
        title: channel.name || id,
        streamURL,
      },
    };
  } catch (err) {
    return { props: { error: `Error: ${err.message}` } };
  }
}

export default function Play({ error, title, streamURL }) {
  if (error) {
    return (
      <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1>Error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <link
          rel="stylesheet"
          href="https://vjs.zencdn.net/7.20.3/video-js.css"
        />
      </Head>
      <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1 style={{ marginBottom: 12 }}>{title}</h1>
        <video
          id="player"
          className="video-js vjs-default-skin"
          controls
          autoPlay
          preload="auto"
          style={{ width: '100%', maxWidth: 960, aspectRatio: '16/9' }}
        />
      </main>

      <script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var url = ${JSON.stringify(streamURL)};
              var video = document.getElementById('player');

              console.log("Attempting to play stream:", url);

              if (video.canPlayType('application/vnd.apple.mpegurl')) {
                console.log("Native HLS supported (Safari). Setting src directly.");
                video.src = url;
              } else if (window.Hls && window.Hls.isSupported()) {
                console.log("Using hls.js to attach stream.");
                var hls = new Hls({ debug: true });
                hls.on(Hls.Events.ERROR, function(event, data) {
                  console.error("HLS.js error:", data);
                });
                hls.loadSource(url);
                hls.attachMedia(video);
              } else {
                console.error("HLS not supported in this browser.");
                var p = document.createElement('p');
                p.textContent = 'HLS not supported in this browser.';
                document.body.appendChild(p);
              }
            })();
          `,
        }}
      />
    </>
  );
      }
