/**
 * @file lib/v1.js ~ 2014/10/09 10:18:14
 * @author leeight(liyubei@baidu.com)
 **/
var fs = require('fs');
var path = require('path');

var async = require('async');

function isValidProject(cwd) {
    var dir = path.join(cwd, '.edpproj');
    if (!fs.existsSync(dir)) {
        return false;
    }

    return fs.statSync(dir).isDirectory();
}

/**
 * @param {function} done 执行完毕之后的回调函数.
 */
exports.run = function(done) {
    var cwd = process.cwd();

    if (!isValidProject(cwd)) {
        return done(new Error('Current directory is not a edp project.'));
    }

    var tasks = [];

    tasks.push(initPkgFile(cwd));
    tasks.push(initIgnore(cwd));
    tasks.push(migrateMetadata(cwd));
    tasks.push(unlinkManifest(cwd));

    async.series(tasks, done);
};

/**
 * 初始化项目的package.json
 *
 * @inner
 * @param {string} cwd 项目的根目录，简化期间用的是process.cwd()
 */
function initPkgFile(cwd) {
    return function(callback) {
        var pkgFile = path.join(cwd, 'package.json');
        if (fs.existsSync(pkgFile)) {
            return callback(null);
        }

        var edpConfig = require('edp-config');
        var name = path.basename(cwd);
        var author = edpConfig.get('user.email') || '';

        var repository = { 'type': 'svn', 'url': '' };
        require('./util/guess-vcs')(cwd, function(vcs) {
            if (vcs) {
                repository = vcs;
            }

            var config = {
                'name': name,
                'version': '0.0.1',
                'private': true,
                'description': name,
                'main': 'index.js',
                'scripts': {
                    'test': 'echo "Error: no test specified" && exit 1'
                },
                'repository': repository,
                'edp': {
                    'dependencies': {}
                },
                'dependencies': {},
                'author': author,
                'license': 'MIT'
            };

            console.log(' + package.json');
            fs.writeFile(pkgFile, JSON.stringify(config, null, 4), callback);
        });
    };
}

// 2. 把.edpproj/metadata的内容放到package.json的edp配置字段去
function migrateMetadata(cwd) {
    return function(callback) {
        var pkgFile = path.join(cwd, 'package.json');
        var metaFile = path.join(cwd, '.edpproj', 'metadata');
        if (fs.existsSync(metaFile)) {
            var config = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
            var meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));

            var edp = config.edp || {};
            for (var key in meta) {
                edp[ key ] = meta[ key ];
            }
            config.edp = edp;

            console.log(' M package.json');
            fs.writeFileSync(pkgFile,
                JSON.stringify(config, null, 4), 'utf-8');

            // 删除.edpproj/metadata文件
            console.log(' D .edpproj/metadata');
            fs.unlinkSync(metaFile);
        }

        callback(null);
    };
}

// 删除dep/packages.manifest
function unlinkManifest(cwd) {
    return function(callback) {
        var manifestFile = path.join(cwd, 'dep', 'packages.manifest');
        if (fs.existsSync(manifestFile)) {
            console.log(' D dep/packages.manifest');
            fs.unlinkSync(manifestFile);
        }

        callback(null);
    };
}

// 创建.edpproj/.gitignore文件（if possible）
function initIgnore(cwd) {
    return function(callback) {
        if (!fs.readdirSync('.edpproj').length) {
            // 如果是.edpproj是空目录了
            fs.writeFileSync(path.join('.edpproj', '.gitignore'),
                '# Please keep this file', 'utf-8');
        }

        callback(null);
    };
}








/* vim: set ts=4 sw=4 sts=4 tw=120: */
