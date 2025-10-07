/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtczfdkldixaptrskjwb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/imagenespagos/**',
      },
    ],
  },
};

export default nextConfig;
