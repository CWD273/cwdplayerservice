function Error({ statusCode }) {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>{statusCode ? `Error ${statusCode}` : 'Error'}</h1>
      <p>Something went wrong.</p>
    </main>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode || err?.statusCode || 500;
  return { statusCode };
};

export default Error;
