'use strict';

const { Subscription } = require('egg');

const wrapped = async function(func, context) {
    const { app } = context;
    try {
        await func.apply(context, arguments);
    } catch (e) {
        app.logger.error(e);
    }
};

class BasicSchedule extends Subscription {
    constructor(app) {
        super(app);
        this.subscribe = wrapped(this.subscribe, this);
    }

    static get schedule() {
        return {
            interval: '10s',
            type: 'worker',
            immediate: true
        };
    }

    async subscribe() {
        console.log('Basic Schedule init');
    }
}

module.exports = BasicSchedule;
