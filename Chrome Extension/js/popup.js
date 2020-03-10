"use strict";

var app = angular.module("autoStudy_popup", []);

app.controller("popupCtrl", function ($scope, $http, $httpParamSerializerJQLike) {

    const captchaUrl = "https://linan.learning.gov.cn/system/akey_img.php?";
    const indexUrl = "https://linan.learning.gov.cn";
    const loginUrl = "https://linan.learning.gov.cn/study/login.php";
    const logoutUrl = "https://linan.learning.gov.cn/study/login.php?act=Logout";

    const switchPopupDiv = function (popupName) {
        $scope.currentDiv = popupName;
        if (popupName === $scope.popupDivs.infoDiv) {
            chrome.storage.local.get("loginInfo", (val) => {
                $scope.loginInfo.name = val.loginInfo.name;
                $scope.loginInfo.gender = val.loginInfo.gender;
                $scope.$applyAsync();
            });
        }
    }

    const initScopeVariables = function () {
        $scope.popupDivs = { loginDiv: "loginDiv", infoDiv: "infoDiv" };
        $scope.currentDiv = $scope.popupDivs.loginDiv;
        $scope.loginUser = {};
        $scope.loginInfo = {};
        $scope.errorMsg = "";
        $scope.isShowAlertBox = false;
        $scope.captchaUrl = captchaUrl;
    }

    const initPopupPage = function () {
        chrome.cookies.get({ url: indexUrl, name: "__onlineflag__" }, (cookie) => {
            switchPopupDiv(null !== cookie ? $scope.popupDivs.infoDiv : $scope.popupDivs.loginDiv);
        });
    }

    $scope.login = function () {
        if (validateLoginForm()) {
            $scope.hideAlertBox();
            $http({
                method: "POST",
                url: loginUrl,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                data: $httpParamSerializerJQLike({
                    act: "AjaxLogin",
                    username: $scope.loginUser.username,
                    password: $scope.loginUser.password,
                    islogin: 0,
                    authKey: $scope.loginUser.captcha
                })
            }).success((response) => {
                if (response.success !== 1) {
                    $scope.errorMsg = response.error;
                    $scope.showAlertBox();
                    $scope.refreshCaptcha();
                } else {
                    chrome.storage.local.set({ loginInfo: { name: response.studentname, gender: response.sex_call } });
                    switchPopupDiv($scope.popupDivs.infoDiv);
                    $scope.loginUser = {};
                }
            }).error((response) => {
                $scope.errorMsg = JSON.stringify(response);
                $scope.showAlertBox();
            });
        }
        else {
            $scope.showAlertBox();
            $scope.errorMsg = "请输入用户名/密码/验证码";
        }
    }

    $scope.logout = function () {
        $http({ method: "GET", url: logoutUrl });
        switchPopupDiv($scope.popupDivs.loginDiv);
        $scope.loginInfo = {};
        $scope.refreshCaptcha();
    }

    $scope.continueStudy = function () {

    }

    $scope.pauseStudy = function () {

    }

    $scope.selectLessons = function () {
        chrome.tabs.create({ url: "chrome-extension://" + chrome.runtime.id + "/options.html" });
    }

    $scope.refreshCaptcha = function () {
        $scope.captchaUrl = captchaUrl + Math.random();
    }

    $scope.hideAlertBox = function () {
        $scope.isShowAlertBox = false;
    }

    $scope.showAlertBox = function () {
        $scope.isShowAlertBox = true;
    }

    const validateLoginForm = function () {
        if ("undefined" === typeof $scope.loginUser) return false;
        let username = $scope.loginUser.username;
        let password = $scope.loginUser.password;
        let captcha = $scope.loginUser.captcha;
        return "" !== username && "" !== password && "" !== captcha && null != username && null != password && null !== captcha;
    }

    initScopeVariables();

    initPopupPage();

});

function getBP() {
    return chrome.extension.getBackgroundPage();
}