/* global VBET5 */
/**
 * @ngdoc service
 * @name vbet5.service:AuthData
 * @description  Authentication data storage (stores in local storage or memory depending on integration mode)
 */
VBET5.service('AuthData', ['$window', '$cookies', 'Config', 'Storage', 'Utils', function ($window, $cookies, Config, Storage, Utils) {
    'use strict';
    var AuthData = {};
    AuthData.partnerAuthData = null;
    AuthData.integrationMode = false;

    /**
     * @ngdoc method
     * @name set
     * @methodOf vbet5.service:AuthData
     * @description setter
     *
     * @param {Object} data auth data object
     */
    AuthData.set = function set(data) {
        if (AuthData.integrationMode) {
            AuthData.partnerAuthData = data;
        } else {
            Storage.set('auth_data', data, data.never_expires ? null : Config.main.authSessionLifetime);
            Utils.checkAndSetCookie("auth_data", data, data.never_expires ? Config.main.saveLoginDataLifeTime : Config.main.authSessionLifetime);
        }
    };

    /**
     * @ngdoc method
     * @name get
     * @methodOf vbet5.service:AuthData
     * @description getter
     *
     * @returns {Object} data auth data object
     */
    AuthData.get = function get() {
        if ( AuthData.integrationMode) {
            return AuthData.partnerAuthData;
        }
        if (Config.main.useAuthCookies) {
            var authData = $cookies.getObject('auth_data');

            if (authData) {
                return authData;
            }
        }

        return Storage.get('auth_data');
    };

    /**
     * @ngdoc method
     * @name clear
     * @methodOf vbet5.service:AuthData
     * @description removes stored auth data
     *
     * @returns {Object} data auth data object
     */
    AuthData.clear = function clear() {
        if (AuthData.integrationMode) {
            AuthData.partnerAuthData = null;
        } else {
            Storage.remove('auth_data');
            if (Config.main.useAuthCookies) {
                $cookies.remove('auth_data', {
                    domain: $window.location.hostname.split(/\./).slice(-2).join("."),
                    path: "/"
                });
                AuthData.set('');
            }
        }
    };

    /**
     * @ngdoc method
     * @name getAuthToken
     * @methodOf vbet5.service:AuthData
     * @description returns auth token if present in auth data
     *
     * @returns {String} auth token
     */
    AuthData.getAuthToken = function getAuthToken() {
        var data = AuthData.get();
        return data ? data.auth_token : null;
    };

    return AuthData;

}]);
