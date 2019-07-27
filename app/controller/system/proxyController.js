'use strict';

const Controller = require('../../module/basis/basicController');

class ProxyController extends Controller {
    async setProxyServerInfo() {
        const { ctx } = this;
        const result = await ctx.service.system.proxyService.setProxyServerInfo();
        this.success(result);
    }
}

module.exports = ProxyController;
