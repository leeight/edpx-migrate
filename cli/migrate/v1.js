/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * v1.js ~ 2014/04/01 11:10:53
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * edp migrate v1
 **/
var fs = require( 'fs' );
var path = require( 'path' );

function isValidProject( cwd ) {
    var dir = path.join( cwd, '.edpproj' );
    if ( !fs.existsSync( dir ) ) {
        return false;
    }

    return fs.statSync( dir ).isDirectory();
}

/**
 * 初始化项目的package.json
 *
 * @inner
 * @param {string} pkgFile package.json的文件路径.
 */
function initPkgFile( pkgFile ) {
    var edpConfig = require( 'edp-config' );
    var name = path.basename( path.dirname( pkgFile ) );
    var author = edpConfig.get( 'user.email' ) || '';

    var config = {
        'name': name,
        'version': '0.0.1',
        'description': '',
        'main': 'index.js',
        'scripts': {
            'test': 'echo "Error: no test specified" && exit 1'
        },
        'edp': {
            'dependencies': {}
        },
        'dependencies': {},
        'author': author,
        'license': 'ISC'
    }

    fs.writeFileSync( pkgFile,
        JSON.stringify( config, null, 4 ), 'UTF-8' );
}

exports.cli = {
    description: '迁移edp项目的配置文件（v1版本）',
    // options: [ 'hello', 'world:' ],
    main: function( args, opts ) {
        // 1. 创建package.json，如果不存在的话
        // 2. 把.edpproj/metadata的内容放到package.json的edp配置字段去
        // 3. 删除dep/packages.manifest文件
        // 4. 如果有必要的话，创建.edpproj/dummy文件
        var cwd = process.cwd();

        if ( !isValidProject( cwd ) ) {
            console.error( 'Current directory is not a edp project.');
            return;
        }

        // 创建package.json
        var pkgFile = path.join( cwd, 'package.json' );
        if ( !fs.existsSync( pkgFile ) ) {
            console.log( ' + package.json' );
            initPkgFile( pkgFile );
        }

        // 更新package.json
        var metaFile = path.join( cwd, '.edpproj', 'metadata' );
        if ( fs.existsSync( metaFile ) ) {
            var config = JSON.parse( fs.readFileSync( pkgFile, 'utf-8' ) );
            var meta = JSON.parse( fs.readFileSync( metaFile, 'utf-8' ) );

            var edp = config.edp || {};
            for ( var key in meta ) {
                edp[ key ] = meta[ key ];
            }
            config.edp = edp;

            console.log( ' M package.json' );
            fs.writeFileSync( pkgFile,
                JSON.stringify( config, null, 4 ), 'utf-8' );

            // 删除.edpproj/metadata文件
            console.log( ' D .edpproj/metadata' );
            fs.unlinkSync( metaFile );
        }

        // 删除dep/packages.manifest
        var manifestFile = path.join( cwd, 'dep', 'packages.manifest' );
        if ( fs.existsSync( manifestFile ) ) {
            console.log( ' D dep/packages.manifest' );
            fs.unlinkSync( manifestFile );
        }

        // 创建.edpproj/dummy文件（if possible）
        if ( !fs.readdirSync( '.edpproj' ).length ) {
            // 如果是.edpproj是空目录了
            fs.writeFileSync( path.join( '.edpproj', 'dummy' ),
                'Please keep this file', 'utf-8' );
        }
    }
}




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
