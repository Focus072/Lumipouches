/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@lumi/shared', '@lumi/db'],
};

module.exports = nextConfig;

