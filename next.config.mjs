/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    webpack: (config) => {
        config.externals.push("pino-pretty", "lokijs", "encoding");
        return config;
    },
    sassOptions: {
        logger: {
            warn: function (message) {
                if (message.includes('legacy-js-api')) return
                console.warn(message)
            },
        },
        modules: true,
        includePaths: ['./app'],
    },
    pageExtensions: ["js", "jsx", "ts", "tsx"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ramicoin.com",
                port: "", // Leave empty unless using a specific port
                pathname: "/**", // Allow any path from the specified hostname
            },
        ],
    },
};

export default nextConfig;

