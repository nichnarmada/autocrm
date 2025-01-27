/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "njirsahdvpngmulpwpnb.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      }
    }
    config.resolve.extensions = [".js", ".jsx", ".ts", ".tsx"]
    return config
  },
}

module.exports = nextConfig
