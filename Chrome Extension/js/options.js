"use strict";

var autoStudy_options = angular.module("autoStudy_options", []);

autoStudy_options.controller("optionsCtrl", function ($scope, $http) {

    const coursesUrl = "https://linan.learning.gov.cn/study/index.php?act=studycourselist";

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
                        courseName: element.children[0].innerText,
                        studiedTime: element.children[1].innerText,
                        courseType: courseType,
                        courseHour: element.children[3].innerText,
                        courseCredit: element.children[4].innerText
                    });
                }
            }
            if (currentPage < pageNums) parseCoursesData(++currentPage, pageNums, coursesArray);
            else console.log(coursesArray);
        });
    }

    const retrieveAllCourses = function () {
        $http({ method: "GET", url: coursesUrl }).success((response) => {
            let docBody = new DOMParser().parseFromString(response, 'text/html').body;
            let pageContent = docBody.children[9].children[1].children[1].children[0].children[1].children[1].children[0].children[0].children[0].children[0].children[0].innerText;
            parseCoursesData(1, parseInt(pageContent.substring(pageContent.indexOf("条") + 2, pageContent.indexOf("页") - 1)), []);
        });
    }

    retrieveAllCourses();

});