const cache = require('memory-cache');

const success = data => {
    const res = {
        code: 0,
        msg: 'OK',
        data
    };
    return res;
};

const failure = error => {
    const res = {
        code: error.code,
        msg: error.msg,
        data: error.data
    };
    return res;
};

const generateFailure = e => {
    let result = SYSTEM_ERROR;
    if (e && e.code && typeof e.code === 'number') {
        if (e.code && e.msg) {
            let data = { code: e.code, msg: e.msg };
            if (e.data) {
                data.data = e.data;
            }
            result = failure(data);
        }
    }
    return result;
};

const setKey = (app, key, value, lifetime = undefined) => {
    const result = cache.put(key, value, lifetime);
    const temp = { key, value, lifetime };
    app.messenger.sendToAgent('cacheUpdate', JSON.stringify(temp));
    return result;
};

const getKey = key => {
    let result = cache.get(key);
    return result;
};

const checkRouter = ctx => {
    let url = ctx.request.url;
    const index = url.indexOf('?');
    if (index > -1) url = url.substring(0, index);
    for (let i = 0; i < ctx.app.router.routerParsed.length; i++) {
        if (ctx.app.router.routerParsed.includes(url)) return true;
    }
    return false;
};

const transactionDec = (wrappedFunc, name) => {
    return async function() {
        const { app, ctx } = this;
        let result;
        try {
            const dbIns = name.toLowerCase().startsWith('get') ? app.mysql.get('db_read') : app.mysql.get('db_write');
            let transaction = ctx.transaction ? ctx.transaction : await dbIns.beginTransaction();
            if (!transaction.conn) {
                delete ctx.transaction;
                transaction = await dbIns.beginTransaction();
            }
            if (!transaction.tasks) transaction.tasks = {};
            const randomNum = Math.random()
                .toFixed(8)
                .replace(/\./g, '');
            if (!ctx.transaction) ctx.transaction = transaction;
            ctx.transaction.mode = 'multi';
            ctx.transaction.tasks[randomNum] = true;
            result = await wrappedFunc.apply(this, arguments);
            ctx.transaction.tasks[randomNum] = false;
            if (Object.values(ctx.transaction.tasks).filter(v => v === true).length === 0) {
                await ctx.transaction.commit();
            }
        } catch (err) {
            ctx.transaction.hasError = true;
            if (ctx.transaction && ctx.transaction.conn) await ctx.transaction.rollback();
            throw err;
        }
        return result;
    };
};

global.transaction = (target, name, descriptor) => {
    descriptor.value = transactionDec(descriptor.value, name);
};

module.exports = { success, setKey, getKey, failure, generateFailure, checkRouter };
