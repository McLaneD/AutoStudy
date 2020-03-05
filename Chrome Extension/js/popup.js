"use strict";

var autoStudy_popup = angular.module("autoStudy_popup", []);

autoStudy_popup.controller("popupCtrl", function ($scope, $http, $httpParamSerializerJQLike) {

    $scope.test = function () {
        chrome.notifications.create(null, {
            type: "basic",
            iconUrl: "img/success128.png",
            title: "标题",
            message: "付款成功!"
        });
    }

    $scope.mockLogin = function () {
        $http({
            method: "POST", url: "https://linan.learning.gov.cn/study/login.php",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: $httpParamSerializerJQLike({
                act: "AjaxLogin",
                username: $scope.loginUser.username,
                password: $scope.loginUser.password,
                islogin: 0,
                authKey: $scope.loginUser.captcha
            })
        }).success((response) => {
            console.log("success");
            console.log(response);
        }).error((response) => {
            console.log("error");
            console.log(response);
        });
    }
});