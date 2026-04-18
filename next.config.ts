import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disable x-powered-by header
  poweredByHeader: false,
  // Enable React strict mode
  reactStrictMode: true,
  // Experimental features
  experimental: {
    // optimize package imports for better performance
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
