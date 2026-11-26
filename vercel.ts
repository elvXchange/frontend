const target = process.env.RENDER_API_ORIGIN || process.env.VITE_API_BASE_URL;
if (!target)
  throw new Error('Set RENDER_API_ORIGIN to the HTTPS Render backend origin.');
const api = new URL(target);
if (api.protocol !== 'https:') throw new Error('Render API must use HTTPS.');
export const config = {
  buildCommand: 'npm run build',
  rewrites: ['/api/:path*', '/socket.io/:path*'].map((source) => ({
    source,
    destination: api.origin + source,
  })),
};
