import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: false,
    browserToTerminal: 'error',
  },
  images: {
    imageSizes: [120, 360, 480, 720],
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
}

export default nextConfig
