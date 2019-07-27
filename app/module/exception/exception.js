const { SYSTEM_ERROR } = require('./exceptionCode');

class Exception extends Error {
    constructor(e, data = undefined) {
        super();
        if (e.code) {
            this.msg = e.msg;
            this.code = e.code;
        } else {
            this.msg = SYSTEM_ERROR.msg;
            this.code = SYSTEM_ERROR.code;
        }
        if (data) {
            this.data = data;
        }
        this.name = `Error code ${this.code}`;
        this.message = this.msg;
    }
}

module.exports = Exception;
