'use strict';

var EventEmitter = require('events').EventEmitter;

var apiUrl = 'http://localhost:3000/';
// var apiUrl = 'boiling-earth-5474.herokuapp.com/';


var back = new EventEmitter();
window.back = back;//debug

$.ajaxSetup({
    crossDomain: true,
    xhrFields: {
        withCredentials: true
    }
});

_.extend(back, {

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

    testSession: function () {

        return $.post(apiUrl + 'session')
            .done(loginHandler)
            .fail(logoutHandler);
    },

    saveModel: function (model) {

      return $.post(apiUrl + 'savemodel', model)
        .fail(errorHandler);
    },

    getModelList: function () {

      return $.get(apiUrl + 'modelList')
        .fail(errorHandler);
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
