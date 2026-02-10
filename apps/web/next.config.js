/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@orbitus/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
