const gulp = require('gulp');

const rollup = require("gulp-rollup");
const typescript = require("gulp-typescript");

const tsProject = typescript.createProject('./tsconfig.json');

gulp.task('build-scripts', () => {
    gulp.src('./src/**/*')
        .pipe(tsProject())
        .on('error', function (err) {
            console.error(err);
        })
        .pipe(rollup({
            entry: './src/main.js'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch-scripts', ['build-scripts'], () => {
    gulp.watch('./src/**/*', ['build-scripts']);

});

gulp.task('watch', ['watch-scripts']);

gulp.task('default', ['watch']);