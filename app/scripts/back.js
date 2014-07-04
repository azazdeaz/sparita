'use strict';

var apiUrl = 'boiling-earth-5474.herokuapp.com/';


var back = {

    register: function (username, password, email) {

        return $.post(apiUrl + 'register', {
                username: _username,
                password: password,
                email: email
            })
            .done(function () {
                back._username = username;
            })
            .fail(errorHandler);
    },

    login: function () {

        return $.post(apiUrl + 'login', {
                username: username,
                password: password
            })
            .fail(errorHandler);
    },

    logout: function () {

        return $.post(apiUrl + 'logout')
            .fail(errorHandler);
    },

    refreshSession: function () {

    },

    saveModel: function (model) {

    },

    getModelList: function (cb) {

    },

    getModel: function () {

    }
};

function errorHandler (jqXhr) {

    if (jqXhr.statusCode() === 402) {

        if (typeof(back.onNeedLogin) === 'function') {

            back.onNeedLogin();
        }
    }
}

module.exports = page;
