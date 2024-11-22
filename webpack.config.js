const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Entry point of your React app
  output: {
    path: path.resolve(__dirname, 'dist'), // Output folder
    filename: 'bundle.js', // Output bundle file
    clean: true, // Clean old files in /dist
  },
  mode: 'development', // Change to 'production' for production builds
  devServer: {
    static: './dist', // Serve files from the /dist folder
    port: 3000, // Development server port
    open: true, // Open browser on server start
    hot: true, // Hot module replacement
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Handle .js and .jsx files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Use your existing index.html
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'], // Allow imports without specifying .js/.jsx
  },
};
