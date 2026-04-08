/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@orbitus/shared', 'three', '@react-three/fiber'],
  output: 'standalone',
};

module.exports = nextConfig;
