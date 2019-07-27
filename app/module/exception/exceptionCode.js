const SYSTEM_ERROR = {
    code: 10000,
    msg: 'Internal Server Error'
};

const PARAMETER_ERROR = {
    code: 10001,
    msg: 'Invalid Parameters'
};

const NO_ACCESS_ERROR = {
    code: 10002,
    msg: 'No Access To The Resource'
};

module.exports = {
    SYSTEM_ERROR,
    PARAMETER_ERROR,
    NO_ACCESS_ERROR
};
