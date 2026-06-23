import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    imageSizes: [120, 360, 480, 720],
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
}

export default nextConfig
