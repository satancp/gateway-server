'use strict';

const Controller = require('../../module/basis/basicController');

class UserController extends Controller {
    async login() {
        const { ctx } = this;
        const result = await ctx.service.user.userService.login();
        this.success(result);
    }
}

module.exports = UserController;
