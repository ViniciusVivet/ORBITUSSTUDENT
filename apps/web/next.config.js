/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@orbitus/shared', 'three', '@react-three/fiber'],
  // output: 'standalone' e usado apenas para Docker; remover para Vercel
};

module.exports = nextConfig;
