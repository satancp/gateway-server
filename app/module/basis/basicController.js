const { Controller } = require('egg');
const Exception = require('../exception/exception');
const exceptionCode = require('../exception/exceptionCode');
const { PARAMETER_ERROR } = exceptionCode;
const { success, failure } = require('../utils/tools');

class BasicController extends Controller {
    success(data) {
        this.ctx.body = success(data);
    }

    failure(data) {
        this.ctx.body = failure(data);
    }

    validate(rule, param) {
        const { ctx, app } = this;
        ctx.validParams = rule;
        try {
            ctx.validate(rule, param);
        } catch (e) {
            app.logger.error(e);
            throw new Exception(PARAMETER_ERROR);
        }
    }
}

module.exports = BasicController;
