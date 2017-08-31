const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');

const rollup = require("gulp-rollup");
const typescript = require("gulp-typescript");

const tsProject = typescript.createProject('./tsconfig.json');

gulp.task('build-scripts', () => {
    browserify('./src/main.ts')
        .plugin(tsify)
        .bundle()
        .on('error', function (err) {
            console.error(err);
        })
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch-scripts', ['build-scripts'], () => {
    gulp.watch('./src/**/*', ['build-scripts']);

});

gulp.task('watch', ['watch-scripts']);

gulp.task('default', ['watch']);