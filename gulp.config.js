module.exports = function () {

	var pngquant = require('imagemin-pngquant'),
		buildFolder = './build/',
		srcFolder = './src/';

	var config = {
		env: 'development',
		build: {
			html: buildFolder,
			css: buildFolder + 'css/',
			js: buildFolder + 'js/',
			img: buildFolder + 'images/',
			fonts: buildFolder + 'fonts/'
		},
		src: {
			html: srcFolder + 'html/index.html',
			scss: srcFolder + 'scss/styles.scss',
			js: srcFolder + 'js/app.js',
			img: srcFolder + 'images/**/*.*',
			sprite_src: srcFolder + 'sprite/src/*.png',
			sprite: srcFolder + 'sprite/',
			fonts: srcFolder + 'fonts/**/*.{eot,svg,ttf,otf,woff}'
		},
		watch: {
			html: srcFolder + 'html/**/*.html',
			scss: srcFolder + 'scss/**/*.scss',
			js: srcFolder + 'js/**/*.js',
			img: srcFolder + 'images/**/*.*',
			sprite: srcFolder + 'sprite/src/*.png',
			fonts: srcFolder + 'fonts/**/*.{eot,svg,ttf,otf,woff}'
		},
		clean: buildFolder + '*',
		autoprefixer: {
			browsers: ['last 10 versions']
		},
		browserSyncConfig: {
			server: {
				baseDir: buildFolder
			},
			host: 'localhost',
			port: 9000,
			open: true,
			debug: true
		},
		cssimport: {
			matchPattern: '*.css'
		},
		extender: {
			annotations: true,
			verbose: false
		},
		imagemin: {
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
			use: [pngquant()],
			interlaced: true
		},
		spritesmith: {
			imgName: 'sprite.png',
			imgPath: '../images/sprite.png',
			cssName: '_sprite.scss',
			algorithm: 'top-down'
		}
	};

	return config;
};
