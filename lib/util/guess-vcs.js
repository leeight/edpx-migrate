/**
 * @file lib/util/guess-vcs.js ~ 2014/10/09 09:49:40
 * @author leeight(liyubei@baidu.com)
 * 生成package.json的时候，需要检测一下当前是git还是svn，然后
 * 才能得到 repository 的内容
 **/
var edp = require('edp-core');

/**
 * @param {string} dir 需要检测的目录路径.
 * @param {function(?{type:string,url:string})} callback 检测之后的回调函数.
 */
module.exports = function(dir, callback) {
    runCommand('git config --local -l', dir, function(err, out) {
        if (!err) {
            // svn-remote.svn.url=https://svn.baidu.com/app/ecom/baike/trunk/web/src/main/webapp
            // remote.origin.url=http://gitlab.baidu.com/bat/baike.git
            var lines = out.split(/\r?\n/g);
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var url = line.split('=')[1];

                if (/^svn\-remote\.svn\.url=/.test(line)) {
                    callback({ type: 'svn', url: url });
                    return;
                }
                if (/^remote\.origin\.url=/.test(line)) {
                    callback({ type: 'git', url: url });
                    return;
                }
            }
            callback(null);
        }
        else {
            runCommand('svn info', dir, function(err, out) {
                if (!err) {
                    // URL: https://svn.baidu.com/app/ecom/fengchao/trunk/fc-fe/experimental
                    var lines = out.split(/\r?\n/g);
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i];
                        if (/^URL: /.test(line)) {
                            callback({ type: 'svn', url: line.substr(5) });
                            return;
                        }
                    }
                }
                callback(null);
            });
        }
    });
};

function runCommand(item, cwd, callback) {
    var chunks = item.split(/\s+/g);
    var command = chunks[0];
    var args = chunks.slice(1);

    var stdout = [];
    var options = { cwd: cwd };
    var cmd = edp.util.spawn(command, args, options);
    var errorHappend = false;
    cmd.on('error', function() {
        errorHappend = true;
        callback(new Error(item + ' launch failed.'));
    });
    cmd.stdout.on('data', function(data) {
        stdout.push(data);
    });
    cmd.on('close', function(code) {
        if (errorHappend || code !== 0) {
            callback(new Error('' + code));
            return;
        }

        callback(null, Buffer.concat(stdout).toString().trim());
    });
}

if (require.main === module) {
    module.exports('/Users/leeight/hd/local/case/fc-fe', function(info) {
        console.log(info);
    });
    module.exports(__dirname, function(info) {
        console.log(info);
    });
    module.exports('/', function(info) {
        console.log(info);
    });
}











/* vim: set ts=4 sw=4 sts=4 tw=120: */
