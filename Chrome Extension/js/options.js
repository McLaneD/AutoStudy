"use strict";

var app = angular.module("autoStudy_options", []);

app.controller("optionsCtrl", function ($scope, $http) {

    const coursesUrl = "https://linan.learning.gov.cn/study/index.php?act=studycourselist";
    const indexUrl = "https://linan.learning.gov.cn";

    const initScopeVariables = function () {
        $scope.loginInfo = {};
        $scope.pageData = [];
        $scope.pagination = { currentPage: 1, dataSize: 0, pageList: [], pageSize: 10, startIndex: 0, endIndex: 0 };
    }

    const initPagination = function () {
        let dataSize = $scope.courses.length;
        $scope.pagination.dataSize = dataSize;
        for (let i = 1; i <= Math.ceil(dataSize / $scope.pagination.pageSize); i++) $scope.pagination.pageList.push(i);
    };

    const parseCoursesData = function (currentPage, pageNums, coursesArray) {
        let pageCourseUrl = coursesUrl + "&offset=" + currentPage;
        $http({ method: "GET", url: pageCourseUrl }).success((response) => {
            let loopTable = new DOMParser().parseFromString(response, 'text/html').body.children[9].children[1].children[1].children[0].children[1].children[0].children[0];
            for (let i = 1; i < loopTable.childElementCount; i++) {
                const element = loopTable.children[i];
                let courseType = element.children[2].innerText;
                if ("考试课程" !== courseType) {
                    coursesArray.push({
                        courseID: element.children[0].children[0].getAttribute("href").substr(39),
                        courseName: element.children[0].children[0].getAttribute("title"),
                        studiedTime: element.children[1].innerText,
                        courseType: courseType,
                        courseHour: element.children[3].innerText,
                        courseCredit: element.children[4].innerText
                    });
                }
            }
            if (currentPage < pageNums) parseCoursesData(++currentPage, pageNums, coursesArray);
            else {
                $scope.courses = coursesArray;
                initPagination();
                $scope.selectPage(1);
                $scope.$applyAsync();
            }
        });
    }

    const retrieveAllCourses = function () {
        $http({ method: "GET", url: coursesUrl }).success((response) => {
            let docBody = new DOMParser().parseFromString(response, 'text/html').body;
            let pageContent = docBody.children[9].children[1].children[1].children[0].children[1].children[1].children[0].children[0].children[0].children[0].children[0].innerText;
            parseCoursesData(1, parseInt(pageContent.substring(pageContent.indexOf("条") + 2, pageContent.indexOf("页") - 1)), []);
        });
    }

    const initOptionPage = function () {
        chrome.cookies.get({ url: indexUrl, name: "__onlineflag__" }, (cookie) => {
            if (null !== cookie) {
                chrome.storage.local.get("loginInfo", (val) => {
                    $scope.loginInfo.name = val.loginInfo.name;
                    $scope.loginInfo.gender = val.loginInfo.gender;
                    retrieveAllCourses();
                });
            }
        });
    }

    $scope.selChanged = function () {
        $scope.pageData.forEach(e => e._checked = $scope.checkStatus);
    }

    $scope.previousPage = function () {
        $scope.selectPage($scope.pagination.currentPage - 1);
    }

    $scope.nextPage = function () {
        $scope.selectPage($scope.pagination.currentPage + 1);
    }

    $scope.selectPage = function (page) {
        if (page > 0 && page <= $scope.pagination.pageList.length) {
            $scope.checkStatus = false;
            $scope.pageData = [];
            $scope.pagination.currentPage = page;
            let selectAll = true;
            for (let i = (page - 1) * $scope.pagination.pageSize; i < (page * $scope.pagination.pageSize); i++) {
                if (i == $scope.courses.length) break;
                if (!$scope.courses[i]._checked) selectAll = false;
                $scope.pageData.push($scope.courses[i]);
            }
            if (selectAll) $scope.checkStatus = true;
        }
    }

    $scope.dataSelChanged = function (course) {
        if (!course._checked) $scope.checkStatus = false;
    }

    $scope.confirmCourses = function () {

    }

    initScopeVariables();

    initOptionPage();

});