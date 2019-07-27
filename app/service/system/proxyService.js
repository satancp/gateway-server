'use strict';

const Service = require('../../module/basis/basicService');
const fs = require('fs');
const path = require('path');

class ProxyService extends Service {
    async getProxyServerInfo() {}

    async setProxyServerInfo(data) {
        await this.configShadowsocksLibev(data);
    }

    async configShadowsocksLibev(data) {
        const newConfig = `{
    "server":"${data.ip}",
    "server_port":${data.port},
    "local_address":"0.0.0.0",
    "local_port":1080,
    "password":"${data.password}",
    "timeout":600,
    "method":"${data.encryption}"
}`;
        await this.writeFile(path.join(__dirname, '../../../build/shadowsocks/config.json'), newConfig);
    }

    readFile(p) {
        return new Promise((resolve, reject) => {
            fs.readFile(p, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    writeFile(p, data) {
        return new Promise((resolve, reject) => {
            fs.writeFile(p, data, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = ProxyService;
