"use strict";

var autoStudy_popup = angular.module("autoStudy_popup", []);

autoStudy_popup.controller("popupCtrl", function ($scope, $http) {

    $scope.test = function () {
        chrome.notifications.create(null, {
            type: "basic",
            iconUrl: "img/success128.png",
            title: "标题",
            message: "付款成功!"
        });
    };
});