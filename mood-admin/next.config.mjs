/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Old dashboard routes → new consolidated locations
  async redirects() {
    return [
      { source: '/insights', destination: '/engagement', permanent: false },
      { source: '/retention', destination: '/engagement', permanent: false },
      { source: '/funnels', destination: '/growth', permanent: false },
      { source: '/features', destination: '/content', permanent: false },
      { source: '/access', destination: '/admin', permanent: false },
      { source: '/ops', destination: '/admin', permanent: false },
    ];
  },
};

export default nextConfig;
