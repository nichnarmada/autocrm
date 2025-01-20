/** @type {import('next').NextConfig} */
const nextConfig = {
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
