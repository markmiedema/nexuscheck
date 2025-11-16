/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression

  // Logging (helps debug production issues)
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Type checking and linting during build
  typescript: {
    // ⚠️ Only enable if you want to allow production builds despite type errors
    // ignoreBuildErrors: false,
  },
  eslint: {
    // ⚠️ Only enable if you want to allow production builds despite ESLint errors
    // ignoreDuringBuilds: false,
  },

  // Environment variables validation (optional but recommended)
  // Validates required env vars exist at build time
  env: {
    // Add any public env vars you want to validate here
  },
}

module.exports = nextConfig
