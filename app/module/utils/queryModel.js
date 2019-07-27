class QueryModel {
    constructor(context) {
        this.parent = context;
        this.rawData = { select: [], join: [], where: [], subselect: [], page: [], order: [], del: [] };
        this.mode = 1; // 1->select,2->del
    }

    _setData(key, data) {
        this.rawData[key].push(data);
    }

    _checkRawQuery(key) {
        if (!this.rawData[key]) {
            this.rawData[key] = [];
        }
    }

    select(data = undefined) {
        if (data) {
            this._setData('select', data);
        }
        this.mode = 1;
        return this;
    }

    del(data = undefined) {
        if (data) {
            this._setData('del', data);
        }
        this.mode = 2;
        return this;
    }

    subselect(data) {
        this._checkRawQuery('subselect');
        this._setData('subselect', data);
        return this;
    }

    join(data) {
        this._checkRawQuery('join');
        this._setData('join', data);
        return this;
    }

    page(data) {
        this._checkRawQuery('page');
        this._setData('page', data);
        return this;
    }

    order(data) {
        this._checkRawQuery('order');
        this._setData('order', data);
        return this;
    }

    where(data = undefined) {
        this._checkRawQuery('where');
        if (data) {
            this._setData('where', data);
        }
        return this;
    }

    _convertData(data) {
        let selectQuery, delQuery;
        if (this.mode === 1) {
            selectQuery = this._convertSelect(data.select);
        } else if (this.mode === 2) {
            delQuery = this._convertDel(data.del);
        }
        const joinQuery = this._convertJoin(data.join);
        const subselectQuery = this._convertSubSelect(data.subselect);
        const whereQuery = this._convertWhere(data.where);
        const pageQuery = this._convertPage(data.page);
        const orderQuery = this._convertOrder(data.order);
        const result = this._combineQuery(
            selectQuery,
            delQuery,
            joinQuery,
            subselectQuery,
            whereQuery,
            pageQuery,
            orderQuery
        );
        return result;
    }

    _convertDel(data) {
        const query = 'DELETE ';
        return query;
    }

    _convertSelect(data) {
        let currentData = data;
        let query = 'SELECT ';
        if (currentData.length === 0) {
            query += '*';
        } else {
            let current;
            if (Array.isArray(currentData[0])) {
                const tempCurrent = {};
                tempCurrent[this.parent.tableShortCut] = currentData[0];
                currentData[0] = tempCurrent;
            } else {
                if (currentData[0].count || currentData[0].concat) {
                    const tempCurrent = {};
                    tempCurrent[this.parent.tableShortCut] = currentData[0];
                    currentData[0] = tempCurrent;
                }
            }
            current = this._hasFromAndEle(currentData[0]) ? currentData[0].ele : currentData[0];
            const keys = Object.keys(current);
            let tempQuery = '';
            let needParse = false;
            keys.forEach(v => {
                const key = v;
                const value = current[key];
                if (this._isArray(value)) {
                    if (value.length === 1 && value[0] === '*') {
                        tempQuery += `${key}.*`;
                    } else {
                        const temp = value.reduce((s, v) => {
                            const tempEle = v.match(/[^~:]+/g);
                            const tempAs = v.match(/:[^~:]+/g);
                            const tempSim = v.match(/~[^~:]+/g);
                            const as = tempAs ? tempAs[0].substring(1) : undefined;
                            const similarity = tempSim ? tempSim[0].substring(1) : undefined;
                            const ele = tempEle[0];
                            s += `, (${similarity ? '' : `${key}.`}${ele}${
                                similarity
                                    ? ' LIKE ' +
                                      (typeof similarity === 'string' ? `'%${similarity}%'` : `%${similarity}%`)
                                    : ''
                            })${as ? ' AS ' + as : ''}`;
                            return s;
                        }, '');
                        tempQuery += temp;
                        needParse = true;
                    }
                } else {
                    if (value['concat']) {
                        tempQuery += `GROUP_CONCAT(${key}.${value['concat']})`;
                    } else if (value['count']) {
                        tempQuery += `COUNT(${key}.${value['count']})`;
                    }
                }
            });
            query += needParse ? tempQuery.substring(2) : tempQuery;
            if (this._hasFromAndEle(currentData[0])) {
                const as = currentData[0].from.includes(':') ? currentData[0].from.split(':')[1] : undefined;
                const ele = currentData[0].from.includes(':') ? currentData[0].from.split(':')[0] : currentData[0].from;
                query += ` FROM ${ele} ${as ? 'AS ' + as + ' ' : ''}`;
            }
        }
        return query.trim();
    }

    _isArray(data) {
        return Object.prototype.toString.call(data) == '[object Array]';
    }

    _convertJoin(data) {
        let query = data.reduce((s, v) => {
            s += `${v.type.toUpperCase()} JOIN ${v.table} AS ${v.as} ON ${v.condition1} = ${v.condition2} `;
            return s;
        }, '');
        return query.trim();
    }

    _convertPage(data) {
        let query = data.reduce((s, v) => {
            s += `LIMIT ${v.pageSize ? v.pageSize : 10} OFFSET ${(v.page - 1) * v.pageSize} `;
            return s;
        }, '');
        return query.trim();
    }

    _convertOrder(data) {
        let query = data.length > 0 ? 'ORDER BY ' : '';
        let connector = '';
        if (data.length > 1) connector = ',';
        let temp = '';
        temp += data.reduce((s, v) => {
            s += `${connector} ${v.key} ${v.order.toUpperCase()}`;
            return s;
        }, '');
        if (temp.length > 0) temp = temp.substring(1);
        query += temp;
        return query.trim();
    }

    _convertSubSelect(data) {
        let query = data.reduce((s, v) => {
            s += `, (${this._convertData(v.query.rawData)}) ${v.as ? `AS ${v.as} ` : ''}`;
            return s;
        }, '');
        return query.trim();
    }

    _convertWhere(data) {
        let query = 'WHERE ';
        if (data.length > 0) {
            data = data[0];
            const temp = Object.values(data)[0];
            if (temp.length > 0) {
                const tempData = temp.map(v => {
                    let q;
                    if (v.and || v.or) {
                        q =
                            '(' +
                            this._convertWhere([v])
                                .substring(5)
                                .trim() +
                            ')';
                    } else {
                        q = `((${v.ele instanceof QueryModel ? this._convertData(v.ele.rawData) : `${v.ele}`}) ${
                            this._isTypeStringOrNumber(v.condition)
                                ? this._getEqualConnector(v.condition)
                                : this._isTypeSingle(v.condition)
                                ? this._getOperator(v.condition)
                                : this._isTypeBetween(v.condition)
                                ? this._getDuration(v.condition)
                                : this._getInOrNotInOperator(v.condition)
                        })`;
                    }
                    return q;
                });
                query += tempData.join(` ${this._getConditionConnector(data)} `);
            } else {
                query += '1 = 1';
            }
        } else {
            query += '1 = 1';
        }
        return query.trim();
    }

    _getConditionConnector(data) {
        if (data['and']) {
            return 'AND';
        } else if (data['or']) {
            return 'OR';
        }
    }

    _getEqualConnector(data) {
        return `= ${typeof data === 'string' ? `'${data}'` : data}`;
    }

    _isTypeStringOrNumber(data) {
        if (typeof data === 'number' || typeof data === 'string') return true;
        else return false;
    }

    _isTypeSingle(data) {
        if (
            data['gt'] ||
            (typeof data['gt'] === 'number' && data['gt'] === 0) ||
            data['lt'] ||
            (typeof data['lt'] === 'number' && data['lt'] === 0) ||
            data['gte'] ||
            (typeof data['gte'] === 'number' && data['gte'] === 0) ||
            data['lte'] ||
            (typeof data['lte'] === 'number' && data['lte'] === 0) ||
            data['ne'] ||
            (typeof data['ne'] === 'number' && data['ne'] === 0) ||
            data['like'] ||
            (typeof data['like'] === 'number' && data['like'] === 0) ||
            data['regex'] ||
            (typeof data['regex'] === 'number' && data['regex'] === 0)
        )
            return true;
        else return false;
    }

    _isTypeBetween(data) {
        if (data['between']) return true;
        else return false;
    }

    _hasFromAndEle(data) {
        if (data['ele'] || data['from']) return true;
        else return false;
    }

    _getOperator(data) {
        if (data['gt'] || (typeof data['gt'] === 'number' && data['gt'] === 0)) {
            return `> ${
                typeof data['gt'] === 'string' && data['gt'].indexOf('.') === -1 ? `'${data['gt']}'` : data['gt']
            }`;
        } else if (data['lt'] || (typeof data['lt'] === 'number' && data['lt'] === 0)) {
            return `< ${
                typeof data['lt'] === 'string' && data['lt'].indexOf('.') === -1 ? `'${data['lt']}'` : data['lt']
            }`;
        } else if (data['gte'] || (typeof data['gte'] === 'number' && data['gte'] === 0)) {
            return `>= ${
                typeof data['gte'] === 'string' && data['gte'].indexOf('.') === -1 ? `'${data['gte']}'` : data['gte']
            }`;
        } else if (data['lte'] || (typeof data['lte'] === 'number' && data['lte'] === 0)) {
            return `<= ${
                typeof data['lte'] === 'string' && data['lte'].indexOf('.') === -1 ? `'${data['lte']}'` : data['lte']
            }`;
        } else if (data['ne'] || (typeof data['ne'] === 'number' && data['ne'] === 0)) {
            return `<> ${
                typeof data['ne'] === 'string' && data['ne'].indexOf('.') === -1 ? `'${data['ne']}'` : data['ne']
            }`;
        } else if (data['like'] || (typeof data['like'] === 'number' && data['like'] === 0)) {
            return `LIKE ${
                typeof data['like'] === 'string' && data['like'].indexOf('.') === -1
                    ? `'%${data['like']}%'`
                    : `%${data['like']}%`
            }`;
        } else if (data['regex'] || (typeof data['regex'] === 'number' && data['regex'] === 0)) {
            return `REGEXP '${data['regex']}'`;
        }
    }

    _getDuration(data) {
        return `BETWEEN ${
            typeof data['between'][0] === 'string' && data['between'][0].indexOf('.') === -1
                ? `'${data['between'][0]}'`
                : data['between'][0]
        } AND ${
            typeof data['between'][1] === 'string' && data['between'][1].indexOf('.') === -1
                ? `'${data['between'][1]}'`
                : data['between'][1]
        }`;
    }

    _getInOrNotInOperator(data) {
        if (data['in']) {
            return data['in'] instanceof QueryModel
                ? `IN (${this._convertData(data['in'].rawData)})`
                : `IN (${this._arrayJoin(data['in'], ',')})`;
        } else if (data['nin']) {
            return data['nin'] instanceof QueryModel
                ? `NOT IN (${this._convertData(data['nin'].rawData)})`
                : `NOT IN (${this._arrayJoin(data['nin'], ',')})`;
        }
    }

    _arrayJoin(data, symbol) {
        const temp = data.map(v => {
            return "'" + v + "'";
        });
        return temp.join(symbol);
    }

    _combineQuery(select, del, join, subselect, where, page, order) {
        if (this.mode === 1) {
            return `${select}${subselect} ${
                select.indexOf('FROM') === -1 ? `FROM ${this.parent.table} AS ${this.parent.tableShortCut}` : ''
            } ${join} ${where} ${order} ${page}`.replace(/\s+/g, ' ');
        } else if (this.mode === 2) {
            return `${del}${subselect} ${
                del.indexOf('FROM') === -1 ? `FROM ${this.parent.table} AS ${this.parent.tableShortCut}` : ''
            } ${join} ${where} ${order} ${page}`.replace(/\s+/g, ' ');
        }
    }

    exec() {
        const temp = this.rawData;
        const result = this._convertData(temp);
        console.log(result);
        return this.parent.query(result);
    }
}

module.exports = QueryModel;
