'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.get('/system/get_system_info', controller.system.systemController.getSystemInfo);
};
