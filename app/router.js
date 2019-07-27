'use strict';

module.exports = app => {
    require('./router/systemRouter')(app);
    require('./router/proxyRouter')(app);
    require('./router/userRouter')(app);
};
