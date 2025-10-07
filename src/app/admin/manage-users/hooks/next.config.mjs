/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Añadimos la IP de la advertencia a los orígenes permitidos
    allowedDevOrigins: ["192.168.40.95"],
  },
};

export default nextConfig;
