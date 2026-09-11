/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Photos are served directly from Cloudflare R2 (public bucket URL or
    // custom domain). Allow any https host so R2 / custom-domain URLs load.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
