/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export to the /out directory
  output: 'export',
  // This setting makes static export work correctly with relative paths
  // Only use if you're not using a custom domain
  basePath: '',
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server components since we're using client-side WebSocket connectivity
  reactStrictMode: true,
  
  // Disable ESLint during builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 