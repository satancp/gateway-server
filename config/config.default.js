'use strict';

module.exports = appInfo => {
    return {
        keys: appInfo.name + '_1564057619696_1537',
        middleware: [],
        security: {
            csrf: {
                enable: false
            },
            domainWhiteList: ['*']
        },
        cors: {
            origin: '*',
            allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
        }
    };
};
