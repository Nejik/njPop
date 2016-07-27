'use strict';

const del = require('del');

const gulp = require('gulp');
const gulpIf = require('gulp-if');
const fileinclude = require('gulp-file-include');

const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const streamqueue = require('streamqueue');
const merge = require('merge-stream');
const browserSync = require('browser-sync').create();


const postcss = require('gulp-postcss');
const cssImport= require('postcss-easy-import');
const cssNext  = require('postcss-cssnext');
const cssNano = require('cssnano');
const mqPacker = require('css-mqpacker');

const svgSprite = require('gulp-svg-sprite');


const paths = {
  html: {
    src: 'src/*.html',
    dest: 'dist'
  },

  styles: {
    vendor: 'src/styles/vendor/**/*.css',
    vendorBase:'',

    src: [
          'src/styles/app.css'
          ],
    base:'',

    concat: 'njPop.css',
    dest: 'dist'
  },

  images: {
    src: 'src/img/**/*.{jpg,jpeg,png,svg,gif}',
    base:'src',

    dest: 'dist',

    sprites: {
      img: '',
      svg: 'src/img/sprites/svg/**/*.svg',

      imgConcat: '',
      svgConcat: 'icons.svg',

      imgDest: 'img',//relative to dist
      svgDest: 'img'//relative to dist
    }
    
  },

  js: {
    src: [
          'src/js/vendor/**/*.js',
          'src/js/**/main.js',
          'src/js/**/*.*',
          '!src/js/vendor/**/jquery-*.js'
          ],
    concat: 'js/main.js',
    dest: 'dist'
  },

  misc: {
    src: [
          'src/*.*',
         '!src/*.html'
         ],
    dest: 'dist'
  }
}
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
// для запуска сборки production, делаем NODE_ENV=production gulp build

if (!isDevelopment) {
  paths.html.dest = 'prod';
  paths.styles.dest = 'prod';
  paths.images.dest = 'prod';
  paths.js.dest = 'prod';
  paths.misc.dest = 'prod';
}

gulp.task('clean', function () {
  return del(['dist','prod'])
})





gulp.task('html', function () {
  return gulp .src(paths.html.src)
  .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
  .pipe(gulp.dest(paths.html.dest))
  .on("end", browserSync.reload)//we should reload only when all html files processed
})





gulp.task('styles', function () {
  return streamqueue({ objectMode: true },
                     gulp.src(paths.styles.vendor)
                     .pipe(gulpIf(isDevelopment, sourcemaps.init())),

                     gulp.src(paths.styles.src)
                     .pipe(gulpIf(isDevelopment, sourcemaps.init()))
                     )
  .pipe(postcss([
                cssImport,
                cssNext,
                mqPacker({
                  sort: true
                })
                ]))
  .on('error', function (error) {
    console.log(error)
    this.emit('end');
  })
  .pipe(gulpIf(!isDevelopment, postcss([cssNano({
                 safe:true,
                 autoprefixer:false//autoprefixer in cssNano works in delete mode, while in cssNext in add mode. Disable delete mode.
                })])))
  .on('error', function (error) {
    console.log(error)
    this.emit('end');
  })
  .pipe(concat(paths.styles.concat))
  .pipe(gulpIf(isDevelopment, sourcemaps.write()))
  .pipe(gulp.dest(paths.styles.dest))
  .pipe(gulpIf(isDevelopment, browserSync.stream()))
})






gulp.task('images', function (cb) {
  let copyImgs = gulp .src(paths.images.src, {base: paths.images.base, since: gulp.lastRun('images')})
                .pipe(gulp.dest(paths.images.dest))

  let makeSvgSprite = gulp  .src(paths.images.sprites.svg)
                .pipe(svgSprite({
                    mode : {
                        symbol: {
                          dest: paths.images.sprites.svgDest,
                          sprite: paths.images.sprites.svgConcat
                        }
                    }
                }))
                .pipe(gulp.dest(paths.images.dest))

  return merge(copyImgs, makeSvgSprite);
})





gulp.task('js', function (cb) {
  return gulp .src(paths.js.src)
  .pipe(gulpIf(isDevelopment, sourcemaps.init()))
  .pipe(concat(paths.js.concat))
  .pipe(gulpIf(isDevelopment, sourcemaps.write()))
  .pipe(gulp.dest(paths.js.dest))
})





gulp.task('misc', function () {
  return gulp.src(paths.misc.src, {since: gulp.lastRun('misc')})
  .pipe(gulp.dest(paths.misc.dest))
})










gulp.task('build', gulp.parallel('html', 'styles', 'js', 'images', 'misc'))

// build with clean
gulp.task('cbuild', gulp.series('clean', gulp.parallel('html', 'styles', 'js', 'images', 'misc')))

gulp.task('watch', function () {
  gulp.watch('src/**/*.html', gulp.series('html'));
  gulp.watch('src/styles/**/*.*', gulp.series('styles')); 
  gulp.watch('src/js/**/*.*', gulp.series('js')); 
  gulp.watch('src/img/**/*.*', gulp.series('images'));
})

gulp.task('serve', function () {
  browserSync.init({
    server: 'dist',
      // open: 'local'//will open browser tab automatically
      open: false
    });

  // browserSync.watch('dist/**/*.*').on('change', browserSync.reload)
})


gulp.task('default', gulp.series('clean', 'build', gulp.parallel('serve','watch')))