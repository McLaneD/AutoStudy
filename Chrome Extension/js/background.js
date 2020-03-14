/* 

TODO 重新打开浏览器的情况, 是否应该清除chrome.storage中的数据, 因为有可能当前电脑登录了其它账号的情况

TODO Cookie时效性问题, 目前有Chrome.cookies正常的情况下, 实际上已经登录失效. 所有请求之前, 都应该先检查Cookie是否已失效问题

TODO 卸载Extension重新装载后, 打开popup.html页面报错的问题

*/

const delay = 1200000;
const countTimeDelay = 180000;
const requestUrl = "https://linan.learning.gov.cn/study/ajax.php";

let logId = 0;

window.onbeforeunload = function () {
    chrome.storage.local.get("playInfo", (val) => {
        if (val.playInfo) {
            let playInfo = val.playInfo;
            $.ajax({
                type: "post",
                url: requestUrl,
                data: { act: 'exit', courseId: playInfo.courseID, logId: logId },
                async: true,
                cache: false,
                dataType: 'json',
                success: function (data, textStatus) {
                    $.ajax({
                        type: "post",
                        url: requestUrl,
                        data: { act: 'getSession', courseId: playInfo.courseID },
                        async: true,
                        cache: false,
                        dataType: 'json',
                        success: function (data, textStatus) { },
                        error: (data) => { notifyError(playInfo, data); }
                    });

                },
                error: (data) => { notifyError(playInfo, data); }
            });
        }
    });
}

function notifyError(playInfo, msg) {
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/error128.png',
        title: '提示消息',
        message: '播放课程"' + playInfo.courseName + '"时出现错误: ' + (null == msg ? "" : JSON.stringify(msg))
    });
}

function notifySuccess(playInfo, data) {
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/success128.png',
        title: '提示消息',
        message: '课程"' + playInfo.courseName + '"播放完毕, 获得学分:' + data.credithour + '. 开始播放下一节...'
    });
}

function appendCourses(courses) {
    chrome.storage.local.get("taskQueue", (val) => {
        let taskQueue = val.taskQueue;
        if (!taskQueue) taskQueue = [];
        let taskIds = new Set();
        if (taskQueue) taskQueue.forEach(e => taskIds.add(e.courseID));
        courses.forEach(e => { if (!taskIds.has(e.courseID)) taskQueue.push(e); });
        chrome.storage.local.set({ "taskQueue": courses });
        loopTaskQueue(null);
    });
}

function loopTaskQueue(courseID) {
    chrome.storage.local.get("taskQueue", (val) => {
        if (val.taskQueue) {
            let taskIndex = -1;
            for (let i = 0; i < val.taskQueue.length; i++) {
                const e = val.taskQueue[i];
                if (e.courseID == courseID || !e._played) {
                    taskIndex = i;
                    break;
                }
            }
            if (taskIndex > -1) {
                chrome.storage.local.set({
                    playInfo: {
                        current: val.taskQueue[taskIndex],
                        next: taskIndex < val.taskQueue.length - 1 ? val.taskQueue[taskIndex + 1] : null,
                        playStartTime: new Date().getTime(),
                        isPlaying: true
                    }
                });
                study();
            } else chrome.storage.local.set({ playInfo: null });
        }
    });
}

function study() {
    chrome.storage.local.get("playInfo", (val) => {
        if (val.playInfo) {
            let playInfo = val.playInfo;
            let current = playInfo.current;
            // Step1. session
            $.ajax({
                type: "post",
                url: requestUrl,
                data: { act: 'set_course_session', courseId: current.courseID, delay: delay },
                async: true,
                cache: false,
                dataType: 'json',
                // Step2. getUrl
                success: (data, textStatus) => {
                    if (data.err != 0) notifyError(current, data.msg);
                    else {
                        $.ajax({
                            type: "post",
                            url: requestUrl,
                            data: { act: 'getCourseURL', courseId: current.courseID },
                            async: true,
                            cache: false,
                            dataType: 'json',
                            success: (data, textStatus) => {
                                if (data.err != 0) notifyError(current, data.msg);
                                else if (data.url == '' || data.url == undefined) notifyError(current, "没有该课件");
                                else {
                                    // Step3. log
                                    $.ajax({
                                        type: "post",
                                        url: requestUrl,
                                        data: { act: 'insert', courseId: current.courseID },
                                        async: true,
                                        cache: false,
                                        dataType: 'json',
                                        success: (data, textStatus) => {
                                            if (data.err != 0) notifyError(current, data.msg);
                                            else {
                                                logId = data.logId;
                                                chrome.storage.local.set({ pollingHandler: setInterval(pollingCourse, countTimeDelay) });
                                            }
                                        },
                                        error: (data) => { notifyError(current, '播放失败，请重试'); }
                                    });
                                }
                            },
                            error: (data) => { notifyError(current, "没有该课件"); }
                        });
                    }
                },
                error: (data) => { notifyError(current, data.msg); }
            });
        }
    });
}

function pollingCourse() {
    chrome.storage.local.get("playInfo", (val) => {
        if (val.playInfo) {
            let playInfo = val.playInfo;
            let current = playInfo.current;
            chrome.storage.local.get("pollingHandler", (val) => {
                if (val.pollingHandler) {
                    let pollingHandler = val.pollingHandler;
                    $.ajax({
                        type: "post",
                        url: requestUrl,
                        data: { act: 'update', courseId: current.courseID, logId: logId },
                        async: true,
                        cache: false,
                        dataType: 'json',
                        success: function (data, textStatus) {
                            if (data.err < 0) notifyError(current, data.msg);
                            else if (data.err == '2') notifyError(current, "您的账号已在其他地方登录,被迫下线");
                            else if (data.err == '1') {
                                if (data.examType == 'W' || data.examType == 'E' || data.examType == 'S') {
                                    // TODO 完成的情况下, 是否考虑再播放一段若干时间以模拟真实性
                                    notifySuccess(current, data);
                                    clearInterval(pollingHandler);
                                    playInfo.isPlaying = false;
                                    chrome.storage.local.set({ playInfo: playInfo });
                                    if (playInfo.next) loopTaskQueue(playInfo.next.courseID);
                                }
                            } else if (data.err == '0') {
                            }
                            else {
                                clearInterval(pollingHandler);
                                updateLastStudyTime(current);
                            }
                        },
                        error: (data) => { notifyError(current, data.msg); }
                    });
                }
            });
        }
    });
}

function updateLastStudyTime(playInfo) {
    $.ajax({
        type: "post",
        url: requestUrl,
        data: { act: 'updateLastStudyTime' },
        async: true,
        cache: false,
        dataType: 'json',
        success: (data, textStatus) => { },
        error: (data) => { notifyError(playInfo, data); }
    });
}