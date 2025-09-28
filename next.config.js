const withTM = require('next-transpile-modules')(['canvas']);
const webpack = require('webpack');

module.exports = withTM({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env': {
            fs: 'empty',
          },
        })
      );
    }

    // Add CSS support with PostCSS loader for Tailwind CSS
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf2json'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost', 
        port: '3000',
        pathname: '/profile/**',
      },
    ],
  },
});
