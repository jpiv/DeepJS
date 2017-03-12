const path = require('path');
const HtmlWebpackPlugin = require('webpack-html-plugin');

module.exports = {
	entry: ['es6-shim', 'babel-polyfill', 'isomorphic-fetch', './app/index.jsx'],
	output: {
		filename: 'main.bundle.js',
		path: path.resolve('dist')
	},

	resolve: {
		extensions: ['.js', '.jsx'],
		alias: {
			'app': path.resolve('./app'),
			'core': path.resolve('./app/core'),
			'learning': path.resolve('./learning')
		}
	},

	module: {
		rules: [
			{
				test: /\.(js|jsx|scss)$/,
				loader: 'source-map-loader',
				enforce: 'pre'
			},	
			{
				test: /\.(js|jsx)$/,
				exclude: [path.resolve('node_modules')],
				loader: 'babel-loader',
				options: {
					presets: ['react', 'es2015', ['env', { module: false }], 'stage-0'],
					plugins: ['transform-decorators-legacy']
				}
			},
			{
				test: /\.(css|scss|sass)$/,
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: {
							modules: true,
							importLoaders: 1,
							camelCase: true,
							sourceMap: true
						}
					},
					'sass-loader',
					{
						loader: 'postcss-loader',
						options: {
							plugins() {
								return [require('autoprefixer')];
							}
						}
					}
				]
			},
			{
				test: /\.(png|jpg|jpeg)/,
				loader: 'url-loader',
				options: { limit: 40000 }
			},

		]
	},

	devtool: 'cheap-module-source-map',
	plugins: [new HtmlWebpackPlugin({
		template: 'index.ejs',
		inject: 'head'
	})]	
};