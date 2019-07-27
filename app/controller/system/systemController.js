'use strict';

const Controller = require('../../module/basis/basicController');

class SystemController extends Controller {
    async getSystemInfo() {
        const { ctx } = this;
        const result = await ctx.service.system.systemService.getSystemInfo();
        this.success(result);
    }
}

module.exports = SystemController;
