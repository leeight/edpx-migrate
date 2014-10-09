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
exports.cli = {
    description: '迁移edp项目的配置文件（v1版本）',

    main: function(args, opts) {
        var v1 = require('../../lib/v1');
        v1.run(function(err){
            if (err) {
                console.error(err.toString());
            }
        });
    }
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
