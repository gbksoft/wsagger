'use strict';

import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';

const AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

gulp.task('styles', () =>
  gulp.src('sass/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'compressed',
        precision: 10
      }).on('error', sass.logError))
      .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('css'))
);

gulp.task('default', ['styles'], () => {
  gulp.watch('sass/**/*.scss', ['styles']);
});