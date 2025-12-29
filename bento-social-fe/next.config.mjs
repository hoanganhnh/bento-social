/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'plus.unsplash.com',
      'images.unsplash.com',
      'i.pinimg.com',
      'i.pravatar.cc',
      'localhost',
      'dns.bento.showcase.ptit.io',
      'statics.cdn.ptit.io',
      'picsum.photos',
    ],
  },
  output: 'standalone',
};

export default nextConfig;
