const { Service } = require('egg');
const { setKey, getKey } = require('../utils/tools');
const QueryModel = require('../utils/queryModel');

/**
 * This is a base class for all DAO(Data Access Object) classes.
 * It includes some basic crud functions, e.g. insert, update, delete, get, etc.
 * Every crud function will try to detect the table construction
 * to know if it needs to add timestamp keys - created_at/updated_at into final query.
 */
class BasicQueryService extends Service {
    constructor(ctx) {
        super(ctx);
    }

    /**
     * It will initialize a new single mode transaction instance
     * with database instance which has write permission in the current context
     */
    _initConnWrite() {
        this.ctx.transaction = this.app.mysql.get('db_write');
        this.ctx.transaction.mode = 'single';
    }

    /**
     * It will initialize a new single mode transaction instance
     * with database instance which has read permission in the current context
     */
    _initConnRead() {
        this.ctx.transaction = this.app.mysql.get('db_read');
        this.ctx.transaction.mode = 'single';
    }

    /**
     * It will destroy the existing single mode transaction instance in the current context
     */
    _removeConn() {
        if (this.ctx.transaction && this.ctx.transaction.mode === 'single') {
            delete this.ctx.transaction;
        }
    }

    /**
     * It is a main function to initialize complicated query and can be used to select/get/query data
     */
    select(data = undefined) {
        const raw = new QueryModel(this);
        raw.select(data);
        return raw;
    }

    /**
     * It is a main function to initialize complicated query and can be used to delete data
     */
    del(data = undefined) {
        const raw = new QueryModel(this);
        raw.del(data);
        return raw;
    }

    getTimeStamp() {
        return this.ctx.transaction.literals.now;
    }

    /**
     * This function can be used to add new data.
     * In addition, the function will try to know if the timestamp keys should be included in the final query
     */
    async insert(data) {
        if (this.ctx.transaction && this.ctx.transaction.hasError) return;
        if (!this.ctx.transaction) this._initConnWrite();
        const newData = data;
        if (!data.created_at && (await this._checkIfTableHasColumn('created_at'))) {
            newData.created_at = this.ctx.transaction.literals.now;
        }
        if (await this._checkIfTableHasColumn('updated_at')) {
            newData.updated_at = this.ctx.transaction.literals.now;
        }
        const res = await this.ctx.transaction.insert(this.table, newData);
        this._removeConn();
        return res;
    }

    /**
     * This function can be used to update existing data.
     * In addition, the function will try to know if the timestamp keys should be included in the final query
     */
    async update(data, param = undefined) {
        if (this.ctx.transaction && this.ctx.transaction.hasError) return;
        if (!this.ctx.transaction) this._initConnWrite();
        let newData = data;
        if (await this._checkIfTableHasColumn('updated_at')) {
            newData = { ...data, updated_at: this.ctx.transaction.literals.now };
        }
        let res;
        if (param) {
            // bug fix for node-mysql
            if (this._checkIfParamHasSameKey(newData, param)) {
                const query = await this._generateSql(newData, param);
                res = await this.query(query.sql, query.values);
            } else {
                res = await this.ctx.transaction.update(this.table, newData, param);
            }
        } else {
            res = await this.ctx.transaction.update(this.table, newData);
        }
        this._removeConn();
        return res;
    }

    /**
     * This function can be used to remove data logically with the key - 'is_delete' by default
     * Of course, this key can also be specified by the user
     * In addition, the function will try to know if the timestamp keys should be included in the final query
     */
    async remove(data, delete_key = 'is_delete') {
        if (this.ctx.transaction && this.ctx.transaction.hasError) return;
        if (!this.ctx.transaction) this._initConnWrite();
        if (await this._checkIfTableHasColumn(delete_key)) {
            const newData = {};
            newData[delete_key] = 1;
            const param = { where: { id: data.id } };
            param.where[delete_key] = 0;
            const res = await this.update(newData, param);
            this._removeConn();
            return res;
        } else {
            return false;
        }
    }

    /**
     * This function can be used to remove data physically
     * In addition, the function will try to know if the timestamp keys should be included in the final query
     */
    async delete(data) {
        if (this.ctx.transaction && this.ctx.transaction.hasError) return;
        if (!this.ctx.transaction) this._initConnWrite();
        const res = await this.ctx.transaction.delete(this.table, data);
        this._removeConn();
        return res;
    }

    /**
     * This function can be used to remove data physically
     * In addition, the function will try to know if the timestamp keys should be included in the final query
     */
    async get(data = undefined, dbType = 'slave') {
        if (this.ctx.transaction && this.ctx.transaction.hasError) return;
        if (!this.ctx.transaction) {
            if (dbType === 'slave') {
                this._initConnRead();
            } else if (dbType === 'master') {
                this._initConnWrite();
            }
        }
        const res = await this.ctx.transaction.select(this.table, data);
        this._removeConn();
        return res;
    }

    async query(query, param = undefined) {
        if (this.ctx.transaction && this.ctx.transaction.hasError) return;
        if (!this.ctx.transaction) this._initConnWrite();
        let res;
        if (param) {
            res = await this.ctx.transaction.query(query, param);
        } else {
            res = this.ctx.transaction.query(query);
        }
        this._removeConn();
        return res;
    }

    async _getTableConstruction() {
        let data = getKey(this.table + '_construction');
        if (!data) {
            data = (await this.ctx.transaction.query(`DESC ${this.table}`)).map(v => v.Field);
            setKey(this.table + '_construction', data);
        }
        return data;
    }

    async _checkIfTableHasColumn(key) {
        const keys = await this._getTableConstruction();
        return keys.includes(key);
    }

    _checkIfParamHasSameKey(param, condition) {
        const keys1 = Object.keys(param);
        const keys2 = Object.keys(condition.where);
        const array = keys1.concat(keys2);
        const set = new Set(array);
        return array.length !== set.size;
    }

    async _generateSql(newData, param) {
        const keys1 = Object.keys(newData);
        const keys2 = Object.keys(param.where);
        const values = [];
        let sql = `UPDATE ${'`' + this.table + '`'} SET`;
        let paramSql = '';
        for (let i = 0; i < keys1.length; i++) {
            paramSql += `, ${'`' + keys1[i] + '`'} = ?`;
            values.push(newData[keys1[i]]);
        }
        paramSql = paramSql.substring(1);
        if ((await this._checkIfTableHasColumn('updated_at')) && !newData.updated_at) {
            paramSql += ', `updated_at` = NOW()';
        }
        let conditionSql = ' WHERE 1 = 1';
        let conditionTempSql = '';
        for (let i = 0; i < keys2.length; i++) {
            conditionTempSql += ` AND ${'`' + keys2[i] + '`'} = ?`;
            values.push(param.where[keys2[i]]);
        }
        conditionSql = conditionSql + conditionTempSql;
        sql = sql + paramSql + conditionSql;
        return { sql, values };
    }
}

module.exports = BasicQueryService;
