'use strict';

const Service = require('../../module/basis/basicService');
const os = require('os');

class SystemService extends Service {
    async getSystemInfo() {
        const version = this.getSoftwareVersion();
        const lan = this.getNetworkInterfaces();
        return {
            version,
            lan
        };
    }

    getSoftwareVersion() {
        const packageInfo = require('../../../package.json');
        return packageInfo.version;
    }

    getNetworkInterfaces() {
        const ni = os.networkInterfaces();
        const exactNi = ni['en0']
            .filter(v => {
                if (v['family'] === 'IPv4') return v;
            })
            .map(v => {
                const temp = v.address.split('.');
                temp[3] = 1;
                const gateway = temp.join('.');
                return {
                    mac: v.mac,
                    ip: v.address,
                    netmask: v.netmask,
                    gateway
                };
            });
        if (exactNi.length > 0) return exactNi[0];
        return undefined;
    }

    getDataTransfer() {
        return '71 Tb';
    }

    getCurrentSpeed() {
        return '100 Mb/s';
    }
}

module.exports = SystemService;
