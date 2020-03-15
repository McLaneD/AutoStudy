"use strict";

var app = angular.module("autoStudy_popup", []);

let intervalHandle = 0;

app.controller("popupCtrl", function ($scope, $http, $httpParamSerializerJQLike) {

    const captchaUrl = "https://linan.learning.gov.cn/system/akey_img.php?";
    const indexUrl = "https://linan.learning.gov.cn";
    const loginUrl = "https://linan.learning.gov.cn/study/login.php";
    const logoutUrl = "https://linan.learning.gov.cn/study/login.php?act=Logout";

    const loopTime = function () {
        if (null != $scope.playInfo) {
            let min = $scope.playInfo.min;
            let sec = $scope.playInfo.sec;
            sec++;
            if (sec > 59) {
                sec = 0;
                min++;
            }
            sec = ((10 > sec > 0) ? "0" : "") + sec;
            $scope.playInfo.min = min;
            $scope.playInfo.sec = sec;
            $scope.$applyAsync();
        }
    }

    const initTiming = function () {
        let playInfo = getBP().getPlayInfo();
        if (playInfo) {
            let curTime = new Date().getTime();
            let min = Math.floor((curTime - playInfo.playStartTime) / 1000 % 86400 % 3600 / 60);
            let sec = Math.floor((curTime - playInfo.playStartTime) / 1000 % 86400 % 3600 % 60);
            min = ((10 > min > 0) ? "0" : "") + min;
            sec = ((10 > sec > 0) ? "0" : "") + sec;
            $scope.playInfo.min = min;
            $scope.playInfo.sec = sec;
            intervalHandle = setInterval(loopTime, 1000);
        }
    }

    const getShortDescObj = function (obj, array) {
        array.forEach(e => { if (obj[e] && obj[e].courseName.length > 10) obj[e].shortName = obj[e].courseName.substring(0, 10) + "..."; });
        return obj;
    }

    const switchPopupDiv = function (popupName) {
        $scope.currentDiv = popupName;
        if (popupName === $scope.popupDivs.infoDiv) {
            chrome.storage.local.get("loginInfo", (val) => {
                $scope.loginInfo.name = val.loginInfo.name;
                $scope.loginInfo.gender = val.loginInfo.gender;
                let playInfo = getBP().getPlayInfo();
                if (playInfo) {
                    $scope.playInfo = getShortDescObj(playInfo, ["pre", "current", "next"]);
                    $scope.playInfo.isPlaying = null != playInfo.pollingHandle;
                    initTiming();
                }
                $scope.showPlayInfo = true;
                $scope.$applyAsync();
            });
        } else $scope.refreshCaptcha();
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
        $http({ method: "GET", url: logoutUrl }).success(() => {
            getBP().exitStudy(() => {
                getBP().clearData();
                $scope.loginInfo = {};
                switchPopupDiv($scope.popupDivs.loginDiv);
            });
        });
    }

    $scope.continueStudy = function () {
        $('#loadingModal').modal({ backdrop: 'static', keyboard: false });
        $scope.playInfo.isPlaying = true;
        getBP().exitStudy(() => {
            getBP().loopTaskQueue(null);
            delay(3000);
            $('#loadingModal').modal('hide');
        });
        initTiming();
    }

    $scope.pauseStudy = function () {
        $('#loadingModal').modal({ backdrop: 'static', keyboard: false });
        $scope.playInfo.isPlaying = false;
        clearInterval(intervalHandle);
        getBP().exitStudy(() => {
            delay(3000);
            $('#loadingModal').modal('hide');
        });
    }

    $scope.selectLessons = function () {
        chrome.tabs.create({ url: "chrome-extension://" + chrome.runtime.id + "/options.html" });
    }

    $scope.refreshCaptcha = function () {
        $scope.newCaptchaUrl = captchaUrl + Math.random();
        $scope.$applyAsync();
    }

    $scope.hideAlertBox = function () {
        $scope.isShowAlertBox = false;
    }

    $scope.showAlertBox = function () {
        $scope.isShowAlertBox = true;
    }

    $scope.playNext = function () {
        $('#loadingModal').modal({ backdrop: 'static', keyboard: false });
        let playInfo = getBP().getPlayInfo();
        if (playInfo && playInfo.next) {
            getBP().exitStudy(() => {
                getBP().loopTaskQueue(playInfo.next.courseID);
                delay(3000);
                $('#loadingModal').modal('hide');
            });
        }
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

function delay(millSeconds) {
    for (var t = Date.now(); Date.now() - t <= millSeconds;);
}