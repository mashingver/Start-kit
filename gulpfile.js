const gulp = require("gulp");
const del = require("del");
const mode = require("gulp-mode")({ verbose: true });
const browserSync = require("browser-sync").create();
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const extender = require("gulp-html-extend");
const htmlmin = require("gulp-htmlmin");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const stylelint = require("gulp-stylelint");
const cleanCSS = require("gulp-clean-css");
const concat = require("gulp-concat");
const rigger = require("gulp-rigger");
const uglify = require("gulp-uglify");
const pngquant = require("imagemin-pngquant");
const svgSprite = require("gulp-svg-sprite");

const buildFolder = "./build/";
const srcFolder = "./src/";

const config = {
  build: {
    html: buildFolder,
    css: buildFolder + "css/",
    js: buildFolder + "js/",
    images: buildFolder + "images/",
    favicons: buildFolder,
    fonts: buildFolder + "fonts/",
  },
  src: {
    html: srcFolder + "html/index.html",
    scss: srcFolder + "scss/styles.scss",
    js: srcFolder + "js/app.js",
    images: srcFolder + "images/**/*.*",
    sprite: srcFolder + "images/",
    favicons: srcFolder + "favicons/*.*",
    icons: srcFolder + "icons/**/*.svg",
    fonts: srcFolder + "fonts/**/*.{eot,svg,ttf,otf,woff}",
  },
  watch: {
    html: srcFolder + "html/**/*.html",
    scss: srcFolder + "scss/**/*.scss",
    js: srcFolder + "js/**/*.js",
    images: srcFolder + "images/**/*.*",
    sprite: srcFolder + "icons/**/*.*",
  },
  vendors: {
    css: [""],
    js: [""],
  },
  clean: [
    buildFolder + "fonts/*",
    buildFolder + "images/*",
    buildFolder + "css/*",
    buildFolder + "js/*",
    buildFolder + "*.ico",
    buildFolder + "*.png",
    buildFolder + "*.html",
  ],
  autoprefixer: {
    overrideBrowserslist: [
      "last 1 version",
      "> 1%",
      "maintained node versions",
      "not dead",
    ],
  },
  sass: {
    outputStyle: mode.production() ? "compressed" : "expanded",
  },
  scssLintPath: {
    input: srcFolder + "scss/**/*.scss",
    output: "./scss/",
  },
  stylelint: {
    failAfterError: true,
    reporters: [{ formatter: "verbose", console: true }],
    debug: true,
    fix: true,
  },
  browserSyncConfig: {
    server: {
      baseDir: buildFolder,
    },
    host: "localhost",
    port: 9000,
    open: true,
    debug: true,
  },
  extender: {
    annotations: true,
    verbose: false,
  },
  imagemin: {
    progressive: true,
    svgoPlugins: [
      {
        removeViewBox: false,
      },
    ],
    use: [pngquant()],
    interlaced: true,
  },
  svgSprite: {
    mode: {
      css: {
        bust: false,
        render: {
          scss: {
            dest: "../scss/core/_sprite.scss",
          },
        },
        dest: ".",
        sprite: "../images/sprite.svg",
      },
    },
  },
};

// Clean build folder
function clean(done) {
  const files = config.clean;
  console.log("Cleaning: " + files);
  del(files);
  done();
}

// Copy Fonts
function fonts() {
  console.log("Copying fonts");
  return gulp
    .src(config.src.fonts)
    .pipe(gulp.dest(config.build.fonts))
    .pipe(mode.development(browserSync.stream()));
}

// Copy favicons
function favicons() {
  console.log("Copying favicons");
  return gulp
    .src(config.src.favicons)
    .pipe(gulp.dest(config.build.favicons))
    .pipe(mode.development(browserSync.stream()));
}

function sprite() {
  console.log("Creating sprites");
  return gulp
    .src(config.src.icons)
    .pipe(svgSprite(config.svgSprite))
    .pipe(gulp.dest(config.src.sprite))
    .pipe(mode.development(browserSync.stream()));
}

// Optimize Images
function images() {
  console.log("Optimizing Images");
  return gulp
    .src(config.src.images)
    .pipe(plumber())
    .pipe(imagemin(config.imagemin))
    .pipe(gulp.dest(config.build.images))
    .pipe(mode.development(browserSync.stream()));
}

// Compile vendors CSS
function vendorsCSS(done) {
  console.log("Compiling vendors css files");
  return gulp
    .src(config.vendors.css)
    .pipe(plumber())
    .pipe(concat("vendors.min.css"))
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.build.css));
}

// Compile vendors JS
function vendorsJS() {
  console.log("Compiling vendors javascript files");
  return gulp
    .src(config.vendors.js)
    .pipe(plumber())
    .pipe(concat("vendors.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest(config.build.js));
}

// Compile HTML
function html() {
  console.log("Compiling HTML");
  return gulp
    .src(config.src.html)
    .pipe(plumber())
    .pipe(extender(config.extender))
    .pipe(mode.development(htmlmin()))
    .on(
      "error",
      notify.onError({
        title: "Sass Error!",
        message: "<%= error.message %>",
      })
    )
    .pipe(gulp.dest(config.build.html))
    .pipe(mode.development(browserSync.stream()));
}

// Compile SCSS
function scss() {
  console.log("Compiling SCSS --> CSS");
  return gulp
    .src(config.src.scss)
    .pipe(plumber())
    .pipe(mode.development(sourcemaps.init()))
    .pipe(
      sass(config.sass).on(
        "error",
        notify.onError({
          title: "Sass Error!",
          message: "<%= error.message %>",
        })
      )
    )
    .pipe(autoprefixer(config.autoprefixer))
    .pipe(mode.development(sourcemaps.write()))
    .pipe(rename({ extname: ".min.css" }))
    .pipe(gulp.dest(config.build.css))
    .pipe(mode.development(browserSync.stream(true)));
}

// Lint SCSS
function scssLint() {
  return gulp
    .src(config.scssLintPath.input)
    .pipe(plumber())
    .pipe(stylelint(config.stylelint))
    .pipe(gulp.dest(config.scssLintPath.output));
}

// Compile JS
function js() {
  console.log("Compiling JS");
  return gulp
    .src(config.src.js)
    .pipe(plumber())
    .pipe(rigger())
    .pipe(uglify())
    .on(
      "error",
      notify.onError({
        title: "JS Error!",
        message: "Error message: <%= error.message %>",
      })
    )
    .pipe(rename({ extname: ".min.js" }))
    .pipe(gulp.dest(config.build.js))
    .pipe(mode.development(browserSync.stream()));
}

// Compile build
function build(done) {
  console.log("Compiling build");
  gulp.series(
    clean,
    // vendorsCSS,
    // vendorsJS,
    fonts,
    favicons,
    sprite,
    images,
    html,
    scss,
    js
  )(done);
}

// Watch files changes
function watchFiles() {
  console.log("Watching html, scss, js, images and sprite files");
  gulp.watch(config.watch.sprite, sprite);
  gulp.watch(config.watch.images, images);
  gulp.watch(config.watch.html, html);
  gulp.watch(config.watch.scss, scss);
  gulp.watch(config.watch.js, js);
}

// BrowserSyncServer
function browserSyncServer(done) {
  console.log("Starting a browserSyncServer");
  browserSync.init(config.browserSyncConfig);
  done();
}

// Gulp tasks
exports.clean = clean;
exports.fonts = fonts;
exports.favicons = favicons;
exports.sprite = sprite;
exports.images = images;
exports.vendorsCSS = vendorsCSS;
exports.vendorsJS = vendorsJS;
exports.html = html;
exports.scss = scss;
exports.scssLint = scssLint;
exports.js = js;
exports.build = build;
exports.default = gulp.series(clean, build, gulp.parallel(watchFiles, browserSyncServer));
