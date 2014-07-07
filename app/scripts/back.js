'use strict';

var EventEmitter = require('event').EventEmitter;

var apiUrl = 'boiling-earth-5474.herokuapp.com/';


var back = new EventEmitter.call({

    onLoginCbList = [],

    register: function (username, password, email) {

        return $.post(apiUrl + 'register', {
                username: username,
                password: password,
                email: email
            })
            .done(loginHandler)
            .fail(errorHandler);
    },

    login: function (username, password) {

        return $.post(apiUrl + 'login', {
                username: username,
                password: password
            })
            .done(loginHandler)
            .fail(errorHandler);
    },

    logout: function () {

        return $.post(apiUrl + 'logout')
            .done(logoutHandler)
            .fail(errorHandler);
    },

    saveModel: function () {

    },

    getModelList: function () {

    },

    getModel: function () {

    }
});

function errorHandler (jqXhr) {

    if (jqXhr.statusCode() === 402) {

        if (typeof(back.onNeedLogin) === 'function') {

            back.onNeedLogin();
        }
    }
}

function loginHandler (res) {

    back._user = res;
    back.username = res.username;

    back.emit('login');
}

function logoutHandler (res) {

    back._user = undefined;
    back.username = undefined;

    back.emit('logout');
}

module.exports = back;
