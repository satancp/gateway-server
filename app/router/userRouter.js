'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.post('/user/login', controller.user.userController.login);
};
