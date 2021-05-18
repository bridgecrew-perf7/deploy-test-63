// @ts-nocheck
// 实现这个项目的构建任务

const { src, dest, series, parallel, watch } = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const plugins = gulpLoadPlugins();
const browserSync = require('browser-sync').create()
const del = require('del')
const { exec } = require('child_process');
const readline = require('readline');
const FtpDeploy =require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const path = require('path')

process.env['NODE_ENV'] = 'development';
// const imagemin = require('gulp-imagemin')
// const swig = require('gulp-swig')
function compileSass() {
    return src('src/assets/styles/*.scss', { base: 'src' })
        .pipe(plugins.sass())
        .pipe(dest('temp'))
        .pipe(browserSync.reload( {stream:true} ))
}

function compileJs() {
    return src('src/assets/scripts/*.js', { base: 'src' })
        .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
        .pipe(dest('temp'))
        .pipe(browserSync.reload({stream:true}))
}

function compileHtml() {
    return src('src/**/*.html', { base:'src' })
        .pipe(plugins.htmlMinimizer({
            collapseWhitespace:true
        }))
        .pipe(plugins.swig({
            name:'asd',
            description:"mmmmm",
            menus:[{name:'c1',link:'https://baidu.com',children:[{name:'cc1',link:'https://baidu.tupian.com'},{name:'a1',link:'https://taobao.com'}]}],
            title:"标题"
        }))
        .pipe(dest('temp'))
        .pipe(browserSync.reload({stream:true}))
}

function public() {
    return src('public/**', { base: "public" })
        .pipe(dest('docs'))
}

function image(){
    return src('src/assets/images/**', {base:'src'})
        .pipe(plugins.imagemin())
        .pipe(dest('docs'))
}

function font(){
    return src('src/assets/fonts/**', {base:'src'})
        .pipe(plugins.imagemin())
        .pipe(dest('docs'))
}

function clean() {
    return del(['docs','temp'])
}

function useref(){
    return src('temp/*.html',{base:'temp'})
        .pipe(plugins.useref({searchPath:['temp','.']}))
        .pipe(dest('docs'))
}
function minuseref(){
    return src('temp/*.html',{base:'temp'})
        .pipe(plugins.useref({searchPath:['temp','.']}))
        .pipe(plugins.if(/\.js$/,plugins.uglify()))
        .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/,plugins.htmlmin()))
        .pipe(dest('docs'))
}
const compile = series(parallel(compileHtml,compileJs, compileSass),plugins.if(process.env.NODE_ENV=='development',useref,minuseref))

const build = series(clean,parallel(compile,public,image,font))


function lint() {
    return src('src/assets/scripts/*.js', { base: 'src' })
        .pipe(plugins.eslint({
            rules: {
                
            },
            envs: [
                'browser'
            ]
        }))
        .pipe(plugins.eslint.format())
        .pipe(plugins.eslint.failAfterError())
}
function setProductionMode(done){
    process.env.NODE_ENV=='production';
    done()
}
const start = series(setProductionMode, compile, serve)

function serve(done){
    const open = process.argv.includes('--open');
    const portConfig = process.argv.includes('--port')
    const port = portConfig&&process.argv[process.argv.findIndex(item=>{
        return item =='--port'
    })+1];
    watch('src/assets/scripts/*.js',compileJs);
    watch('src/assets/styles/*.scss',compileSass);
    watch('src/**/*.html',compileHtml);
    watch(['src/assets/images/**','src/assets/fonts/**','public/**'],browserSync.reload)
    browserSync.init({
        // watch:true,
        open:open,
        port:port||2080,
        logFileChanges: true,
        server:{
            baseDir:'docs'
        }
    },(err,bs)=>{
        if(err) console.log(err)
        done()
    })
}


function deploy(done) {
    let branchCmd = process.argv.findIndex(item=>{
        return item =='--branch'
    })
    let branch = branchCmd&&process.argv[branchCmd+1];
    let finalBranch = branch||'master';
    let rl = readline.createInterface({
        input:process.stdin,
        output:process.stdout
    })
    exec(`git add .`,()=>{
        rl.question("commit message >", answer=>{
            exec(`git commit -m ${answer}`,()=>{
                exec(`git push origin ${finalBranch}`,()=>{
                    console.log(finalBranch)
                    done()
                    rl.close()
                });
            });
        })
    });
}

module.exports = {
   serve,
   build,
   start,
   lint,
   compile,
   deploy,
   clean
}