'use strict';
// Generated on 2014-05-10 using generator-browserify 0.2.2

var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var stringify = require('stringify');

var bower = 'app/bower_components';

// Load plugins
var $ = require('gulp-load-plugins')();

// Styles
gulp.task('styles', function () {
  // See https://github.com/andrew/node-sass for more options
  return gulp.src('app/scss/app.scss')
    .pipe($.sass({
      outputStyle: 'expanded',
      includePaths: ['app/bower_components/foundation/scss']
    }))
    .pipe($.autoprefixer('last 1 version'))
    .pipe($.csso())
    .pipe(gulp.dest('dist/styles'))
    .pipe($.size())
    .pipe($.connect.reload());
});

// Vendor
gulp.task('vendor', function () {
  return gulp.src([
      bower + '/lodash/dist/lodash.js',
      bower + '/threejs/build/three.js',
      bower + '/threex-controls/controls/OrbitControls.js',
      bower + '/jquery/dist/jquery.js',
      bower + '/foundation/js/foundation.js',
      bower + '/velocity/jquery.velocity.js'
    ])
    // .pipe($.browserify({
    //   debug: true,
    //   transform: [
    //     'debowerify'
    //   ],
    //   shim: {
    //     lodash: {
    //       path: bower + '/lodash/dist/lodash.js',
    //       exports: 'lodash'
    //     }
    //   }
    // }))
    .pipe($.concat('vendor.js'))
    // .pipe($.uglify())
    .pipe(gulp.dest('dist/scripts'))
    .pipe($.size());
});

// Scripts
// gulp.task('_scripts', function () {

//   var transform = ['browserify-shim'];

//   if (!gulp.env.nobrfs) {
//     transform.push('brfs');
//   }



//   return gulp.src('app/scripts/main.js')
//     .pipe($.browserify({
//       debug: true,
//       transform: transform,
//       // shim: {
//       //     jquery: {
//       //       path: 'app/bower_components/jquery/dist/jquery.js',
//       //       exports: $
//       //     },
//       //     foundation: {
//       //       path: 'app/bower_components/foundation/js/foundation.js',
//       //       exports: null,
//       //       depends: {
//       //           jquery: 'jQuery',
//       //       }
//       //     }
//       // }, 
//       // Note: At this time it seems that you will also have to
//       // setup browserify-shims in package.json to correctly handle
//       // the exclusion of vendor vendor libraries from your bundle
//       // external: ['lodash', 'jQuery', 'foundation'],
//       extensions: ['.js']
//     }))
//     // .pipe($.uglify())
//     .pipe(gulp.dest('dist/scripts'))
//     .pipe($.size())
//     .pipe($.connect.reload());
// });

gulp.task('scripts', function() {
  var bundler = watchify('./app/scripts/main.js', {debug: true});

  // if (!gulp.env.nobrfs) {
  //   bundler.transform('brfs');
  // }

  bundler.transform(stringify(['.html']))

  // bundler.add('./app/scripts/main.js');

  bundler.on('change', function (list) {
    console.log('<watchify>', list)
    // $.connect.reload();
  });

  // bundler.transform(function (file) {
  //   var data = '';
  //   return through(write, end);

  //   function write (buf) { data += buf }
  //   function end () {
  //       this.queue(coffee.compile(data));
  //       this.queue(null);
  //   }
  // });

  bundler.on('update', rebundle)

  function rebundle () {
    console.log('<watchify-rebundle>')
    return bundler.bundle()
      // log errors if they happen
      .on('error', function(e) {
        gutil.log('Browserify Error', e);
      })
      .pipe(source('main.js'))
      .pipe(gulp.dest('./dist/scripts'))
      .pipe($.connect.reload());
  }

  return rebundle()
});

// HTML
gulp.task('html', function () {
  return gulp.src('app/*.html')
    .pipe(gulp.dest('dist'))
    .pipe($.size())
    .pipe($.connect.reload());
});

// Lint
gulp.task('lint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter(require('jshint-stylish')));
});

// Images
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size());
});

// Clean
gulp.task('clean', function () {
    return gulp.src(['dist/styles', 'dist/scripts', 'dist/images'], {read: false}).pipe($.clean());
});

// Build

gulp.task('build', ['html', 'styles', 'scripts', 'images']);

// Dev Server

gulp.task('dev', ['html', 'styles', 'scripts', 'images', 'connect', 'watch']);

// Default task
gulp.task('default', ['clean', 'vendor'], function () {
    gulp.start('dev');
});

// Connect
gulp.task('connect', $.connect.server({
  root: __dirname + '/dist',
  port: 9000,
  livereload:{
    port: 35729
  },
  open: {
    file: 'index.html',
    browser: 'Google Chrome'
  },
}));



// Watch
gulp.task('watch', ['connect'], function () {
    // Watch for changes in `app` folder
    gulp.watch([
        'app/scss/**/*.scss',
        'app/scripts/**/*.js',
        'app/images/**/*',
        'app/templates/**/*.html'
      ], $.connect.reload);

    // Watch .scss files
    gulp.watch('app/scss/**/*.scss', ['styles']);


    // Watch .js and template files
    // gulp.watch(['app/templates/**/*.html', 'app/scripts/**/*.js'], ['scripts']);

    // Watch image files
    gulp.watch('app/images/**/*', ['images']);


    // Watch .html files
    gulp.watch('app/**/*.html', ['html']);
});
