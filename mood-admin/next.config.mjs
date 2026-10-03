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
  // Pre-V3 dashboard routes -> the V3 founder dashboard (Oct 2026). The old page files stay so the new pages
  // can embed them as tabs (Revenue: subscribers / store / creators; Admin & Ops: access & config).
  async redirects() {
    return [
      { source: '/overview', destination: '/pulse', permanent: false },
      { source: '/growth', destination: '/activation', permanent: false },
      { source: '/acquisition', destination: '/activation', permanent: false },
      { source: '/onboarding', destination: '/activation', permanent: false },
      { source: '/engagement', destination: '/retention', permanent: false },
      { source: '/content', destination: '/workouts', permanent: false },
      { source: '/social', destination: '/pulse', permanent: false },
      { source: '/monetization', destination: '/revenue?tab=store', permanent: false },
      { source: '/subscribers', destination: '/revenue?tab=subscribers', permanent: false },
      { source: '/creators', destination: '/admin?tab=creators', permanent: false },
      { source: '/insights', destination: '/retention', permanent: false },
      { source: '/funnels', destination: '/activation', permanent: false },
      { source: '/features', destination: '/workouts', permanent: false },
      { source: '/access', destination: '/admin?tab=ops', permanent: false },
      { source: '/ops', destination: '/admin?tab=ops', permanent: false },
    ];
  },
};

export default nextConfig;
