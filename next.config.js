/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // This setting makes static export work correctly with relative paths
  // Only use if you're not using a custom domain
  basePath: '',
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server components since we're using client-side WebSocket connectivity
  reactStrictMode: true,
}

module.exports = nextConfig 