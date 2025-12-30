/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@lumi/shared', '@lumi/db'],
};

module.exports = nextConfig;

