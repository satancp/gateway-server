'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.post('/proxy/set_proxy_server_info', controller.system.proxyController.setProxyServerInfo);
};
