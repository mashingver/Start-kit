const gulp = require("gulp");
const del = require("del");
const browserSync = require("browser-sync").create();
const extender = require("gulp-html-extend");
const $ = require("gulp-load-plugins")({lazy: true});
const pngquant = require("imagemin-pngquant");
const svgSprite = require("gulp-svg-sprite");

const buildFolder = "./build/";
const srcFolder = "./src/";

const config = {
  env: "development",
  build: {
    html: buildFolder,
    css: buildFolder + "css/",
    js: buildFolder + "js/",
    images: buildFolder + "images/",
    favicons: buildFolder,
    fonts: buildFolder + "fonts/"
  },
  src: {
    html: srcFolder + "html/**/*.html",
    scss: srcFolder + "scss/styles.scss",
    js: srcFolder + "js/app.js",
    images: srcFolder + "images/**/*.*",
    sprite: srcFolder + "images/",
    favicons: srcFolder + "favicons/*.*",
    icons: srcFolder + "icons/**/*.svg",
    fonts: srcFolder + "fonts/**/*.{eot,svg,ttf,otf,woff}"
  },
  watch: {
    html: srcFolder + "html/**/*.html",
    scss: srcFolder + "scss/**/*.scss",
    js: srcFolder + "js/**/*.js",
    images: srcFolder + "images/**/*.*",
    sprite: srcFolder + "icons/**/*.*"
  },
  clean: buildFolder + "*",
  autoprefixer: {
    overrideBrowserslist: [
      "last 1 version",
      "> 1%",
      "maintained node versions",
      "not dead"
    ]
  },
  browserSyncConfig: {
    server: {
      baseDir: buildFolder
    },
    host: "localhost",
    port: 9000,
    open: true,
    debug: true
  },
  cssimport: {
    matchPattern: "*.css"
  },
  extender: {
    annotations: true,
    verbose: false
  },
  imagemin: {
    progressive: true,
    svgoPlugins: [
      {
        removeViewBox: false
      }
    ],
    use: [pngquant()],
    interlaced: true
  },
  svgSprite: {
    mode: {
      css: {
        bust: false,
        render: {
          scss: {
            dest: "../scss/core/_sprite.scss"
          }
        },
        dest: ".",
        sprite: "../images/sprite.svg",
      },

    }
  }
};

// BrowserSyncServer
function browserSyncServer(done) {
  log('Starting a server');
  browserSync.init(config.browserSyncConfig);
  done();
}

// Compile HTML
function html() {
  log("Compiling HTML");
  return gulp
    .src(config.src.html)
    .pipe($.plumber())
    .pipe(extender(config.extender))
    .pipe($.if(config.env === "production", $.htmlmin()))
    .on("error", $.util.log)
    .pipe(gulp.dest(config.build.html))
    .pipe(browserSync.stream());
}

// Compile SCSS
function scss() {
  log("Compiling SCSS --> CSS");
  return gulp
    .src(config.src.scss)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass())
    .pipe($.cssimport(config.cssimport))
    .pipe($.autoprefixer(config.autoprefixer))
    .pipe($.cssnano())
    .pipe($.rename({extname: ".min.css"}))
    .pipe($.sourcemaps.write("./"))
    .on("error", $.util.log)
    .pipe(gulp.dest(config.build.css))
    .pipe(browserSync.stream());
}

// Compile JS
function js() {
  log("Compiling JS");
  return gulp
    .src(config.src.js)
    .pipe($.plumber())
    .pipe($.rigger())
    .pipe($.uglify())
    .pipe($.rename({extname: ".min.js"}))
    .on("error", $.util.log)
    .pipe(gulp.dest(config.build.js))
    .pipe(browserSync.stream());
}

// Optimize Images
function images() {
  log("Optimizing Images");
  return gulp
    .src(config.src.images)
    .pipe($.plumber())
    .pipe($.imagemin(config.imagemin))
    .pipe(gulp.dest(config.build.images))
    .pipe(browserSync.stream());
}

// Copy favicons
function favicons() {
  log("Copying favicons");
  return gulp
      .src(config.src.favicons)
      .pipe(gulp.dest(config.build.favicons));
}

function sprite() {
  return gulp
    .src(config.src.icons)
    .pipe(svgSprite(config.svgSprite))
    .pipe(gulp.dest(config.src.sprite));
}

// Copy Fonts
function fonts() {
  log("Copying fonts");
  return gulp
      .src(config.src.fonts)
      .pipe(gulp.dest(config.build.fonts));
}

// Compile build
function build(done) {
  log("Compiling build");
  gulp.series(fonts, sprite, images, favicons, html, scss, js)(done);
}

// Compile vendors CSS
function vendorsCss() {
  log("Compiling vendors css files");
  return gulp
    .src()
    .pipe($.plumber())
    .pipe($.concat("vendors.min.css"))
    .pipe($.cssnano())
    .pipe(gulp.dest(config.build.css));
}

// Compile vendors JS
function vendorsJs() {
  log("Compiling vendors javascript files");
  return gulp
    .src()
    .pipe($.plumber())
    .pipe($.concat("vendors.min.js"))
    .pipe($.uglify())
    .pipe(gulp.dest(config.build.js));
}

function vendors(done) {
  log("Compiling vendors");
  gulp.parallel(vendorsCss, vendorsJs)(done);
}

// Clean build folder
function clean(done) {
  const files = config.clean;
  log("Cleaning: " + $.util.colors.blue(files));
  del(files);
  done();
}

// Watch files changes
function watchFiles() {
  log("Watching html, scss, js, images and sprite files");
  gulp.watch(config.watch.html, html);
  gulp.watch(config.watch.scss, scss);
  gulp.watch(config.watch.js, js);
  gulp.watch(config.watch.images, images);
  gulp.watch(config.watch.sprite, sprite);
}

// Gulp tasks
exports.default = gulp.series(clean, build, gulp.parallel(watchFiles, browserSyncServer));
exports.production = gulp.series(clean, build, vendors);
exports.vendors = vendors;
exports.html = html;
exports.scss = scss;
exports.js = js;


//Helpers
function log(msg) {
  if (typeof msg === "object") {
    for (let item in msg) {
      if (msg.hasOwnProperty(item)) {
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
}
