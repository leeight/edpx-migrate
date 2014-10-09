/**
 * @file v2.js ~ 2014/10/09 10:59:26
 * @author leeight(liyubei@baidu.com)
 * 为了配合 https://github.com/ecomfe/edp/issues/296 的调整
 * 1. 修改dep目录下面package中的目录结构
 * 2. 执行 edp project updateLoaderConfig
 * 3. 修改*.less里面引用的less路径
 * 4. 修改*.html里面引用的less路径
 * 5. 修改package.json，添加`edp.layout = v2`的属性值
 **/
var path = require('path');
var fs = require('fs');
var util = require('util');

var edp = require('edp-core');
var semver = require('semver');
var async = require('async');

/**
 * @param {function} done 执行完毕之后的回调函数.
 */
exports.run = function(done) {
    var cwd = process.cwd();

    var pkgFile = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgFile)) {
        var config = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
        if (config.edp.layout === 'v2') {
            return done(null);
        }
    }

    var tasks = [];

    tasks.push(require('./v1').run);
    tasks.push(refactorDepDirectory(cwd));
    tasks.push(refreshLoaderConfig(cwd));
    tasks.push(updateReferences(cwd));
    tasks.push(markAsFinish(cwd));

    async.series(tasks, done);
};

/**
 * 调整dep目录下面的package的结构
 * @param {string} cwd 项目的根目录.
 */
function refactorDepDirectory(cwd) {
    function buildCommand(x) {
        return function(callback) {
            console.log(' %s', x);
            var args = x.split(' ');
            var cmd = edp.util.spawn(
                args[0],
                args.slice(1),
                { cwd: cwd }
            );
            cmd.on('error', function(error) {
                callback(error);
            });
            cmd.on('close', function(code) {
                callback(code === 0 ? null : new Error(code));
            });
        };
    }

    return function(callback) {
        var depDir = path.join(cwd, 'dep');
        if (!fs.existsSync(depDir)) {
            return callback(new Error('No such directory ' + depDir));
        }

        var packages = {};
        fs.readdirSync(depDir).filter(function(x) {
            var pkgFile = path.join(depDir, x, 'package.json');
            if (fs.existsSync(pkgFile)) {
                // 貌似已经处理过了，那么就不要搞了
                return false;
            }

            var pkgDir = path.join(depDir, x);
            var versions = fs.readdirSync(pkgDir).filter(function(y) {
                return fs.statSync(path.join(pkgDir, y)).isDirectory()
                       && semver.valid(y)
                       && fs.existsSync(path.join(pkgDir, y, 'package.json'));
            });

            if (versions.length) {
                packages[x] = versions;
            }
        });

        var isSVN = fs.existsSync(path.join(cwd, '.svn'));
        var commands = [];
        Object.keys(packages).forEach(function(pkg) {
            var versions = packages[pkg];
            var bestVersion = semver.maxSatisfying(versions, '*');
            var pkgDir = path.join('dep', pkg);
            if (isSVN) {
                commands.push(util.format('svn mv %s %s-tmp',
                    path.join('dep', pkg, bestVersion), pkgDir));
                commands.push(util.format('svn rm --force %s', pkgDir));
                commands.push(util.format('svn mv %s-tmp %s', pkgDir, pkgDir));
            }
            else {
                commands.push(util.format('git mv %s %s-tmp',
                    path.join('dep', pkg, bestVersion), pkgDir));
                commands.push(util.format('git rm -r %s', pkgDir));
                commands.push(util.format('git mv %s-tmp %s', pkgDir, pkgDir));
            }
        });

        // git reset HEAD --
        // git checkout -- .
        // git clean -xfd

        // svn revert -R .
        async.series(commands.map(buildCommand), callback);
    };
}

/**
 * 调用edp project updateLoaderConfig更新配置文件.
 * @param {string} cwd 项目的根目录.
 */
function refreshLoaderConfig(cwd) {
    return function(callback) {
        var cmd = edp.util.spawn(
            'edp',
            [ 'project', 'updateLoaderConfig' ],
            { stdio: 'inherit', cwd: cwd }
        );
        cmd.on('error', function(error) {
            callback(error);
        });
        cmd.on('close', function(code) {
            callback(code === 0 ? null : new Error(code));
        });
    };
}

/**
 * 更新less文件对less的引用
 * 更新html文件对less的引用
 * @param {string} cwd 项目的根目录.
 */
function updateReferences(cwd) {
    return function(callback) {
        var srcDir = path.join(cwd, 'src');
        edp.util.scanDir(srcDir, function(fullPath) {
            if (!/\.(less|html?|css|tpl|styl)$/.test(fullPath)) {
                return;
            }

            var originalContent = fs.readFileSync(fullPath, 'utf-8');
            var pattern = /\/dep\/([^\/]+)\/([^\/]+)\//g;
            var newContent = originalContent.replace(pattern, function(m, $1, $2){
                if (semver.valid($2)) {
                    return '/dep/' + $1 + '/';
                }
                else {
                    return '/dep/' + $1 + '/' + $2 + '/';
                }
            });

            if (originalContent.length !== newContent.length) {
                console.log(' M %s', path.relative(cwd, fullPath));
                fs.writeFileSync(fullPath, newContent, 'utf-8');
            }
        });

        callback(null);
    };
}

/**
 * 给package.json添加edp.layout的标记.
 * @param {string} cwd 项目的根目录.
 */
function markAsFinish(cwd) {
    return function(callback) {
        var pkgFile = path.join(cwd, 'package.json');
        if (!fs.existsSync(pkgFile)) {
            return callback(new Error('No such file ' + pkgFile));
        }

        var config = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
        config.edp = config.edp || {};
        config.edp.layout = 'v2';

        console.log(' M %s', path.relative(cwd, pkgFile));
        fs.writeFile(pkgFile, JSON.stringify(config, null, 4), callback);
    };
}









/* vim: set ts=4 sw=4 sts=4 tw=120: */
