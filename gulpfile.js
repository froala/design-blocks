const gulp = require('gulp');
const watch = require('gulp-watch');
const sass = require('gulp-sass')(require('sass'));
const connect = require('gulp-connect');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const utils = require('./utils');
const pug = require('gulp-pug');
const fs = require('fs');
const path = require('path');
const cssmin = require('gulp-cssmin');
const rename = require('gulp-rename');
const zip = require('gulp-zip');

function getBlocks(dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(path.join(dir, file)).isFile();
        })
        .map(function (file) {
            return '    ' + fs.readFileSync(path.join(dir, file), "utf8").split('\n').join('\n    ');
        })
}

const build = function (dest) {
    gulp.task('clean-' + dest, async function () {
        del.sync(dest + '/**/*');
    })

    gulp.task('sass-' + dest, async function () {
        gulp.src(['src/scss/froala_blocks.scss'])
            .pipe(sass())
            .pipe(gulp.dest(dest + '/css'))
            .pipe(cssmin())
            .pipe(rename({suffix: '.min'}))
            .pipe(gulp.dest(dest + '/css'))
    });

    gulp.task('html-' + dest, async function () {
        gulp.src(['src/html/index.html', 'src/html/css.html'])
            .pipe(gulp.dest(dest))
    })

    gulp.task('imgs-' + dest, async function () {
        gulp.src(['src/imgs/**/*'])
            .pipe(gulp.dest(dest + '/imgs'))
    })

  gulp.task('pug-' + dest, async function () {
    let blocks = {}
    let blks = ['call-to-action', 'contacts', 'contents', 'features', 'footers', 'forms', 'headers', 'pricings', 'teams', 'testimonials']
    for (let i = 0; i < blks.length; i++) {
      blocks[blks[i]] = getBlocks('src/html/' + blks[i])
    }

        const LOCALS = {
            blocks: blocks
        };

        gulp.src('./src/html/**/*.pug')
            .pipe(pug({
                locals: LOCALS,
                pretty: true
            }))
            .pipe(gulp.dest(dest))
    })
}

build('.tmp');
build('dist');

gulp.task('watch', async function () {
    watch('dist').pipe(connect.reload());
    watch('src/html', function () {
        gulp.start(['pug-.tmp']);
    })
    watch('src/pug', function () {
        gulp.start(['pug-.tmp']);
    })
    watch('src/imgs', function () {
        gulp.start(['imgs-.tmp']);
    })
    watch('src/scss', function () {
        gulp.start(['sass-.tmp']);
    });
})

gulp.task('zip', () =>
    gulp.src('dist/**/*')
        .pipe(zip('froala-design-blocks.zip'))
        .pipe(gulp.dest('./'))
);

gulp.task('connect', async function () {
    connect.server({
        root: ['.tmp', 'node_modules', 'screenshots'],
        port: 8001
    });
});

gulp.task('screenshots', async function (cb) {
    del.sync('./screenshots');

    utils.makeScreenshots([
        ['call-to-action', 'header, section, footer'],
        ['contacts', 'header, section, footer'],
        ['contents', 'header, section, footer'],
        ['features', 'header, section, footer'],
        ['footers', 'header, section, footer'],
        ['forms', 'header, section, footer'],
        ['headers', 'header, section, footer'],
        ['pricings', 'header, section, footer'],
        ['teams', 'header, section, footer'],
        ['testimonials', 'header, section, footer'],
    ]).then(function () {
        cb();
    });
});

gulp.task('dist', gulp.series('clean-dist', 'html-dist', 'pug-dist', 'imgs-dist', 'sass-dist'));

gulp.task('default', gulp.series('clean-.tmp', 'html-.tmp', 'pug-.tmp', 'imgs-.tmp', 'sass-.tmp', 'connect', 'watch'));