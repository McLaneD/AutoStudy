const delay = 1200000;
const countTimeDelay = 180000;
const requestUrl = "https://linan.learning.gov.cn/study/ajax.php";

let playInfo;
let taskQueue = [];

window.onbeforeunload = function () {
    exitStudy(() => { });
}

function copyObject(obj) {
    return null == obj ? null : Object.assign({}, obj);
}

function markCoursePlayed(courseID) {
    if (taskQueue) taskQueue.forEach(e => { if (courseID == e.courseID) e._played = true; });
}

function getPlayInfo() {
    return copyObject(playInfo);
}

function clearData() {
    playInfo = null;
    taskQueue = null;
}

function exitStudy(callback) {
    if (playInfo) {
        if (playInfo.pollingHandle) {
            clearInterval(playInfo.pollingHandle);
            playInfo.pollingHandle = null;
            let current = playInfo.current;
            $.ajax({
                type: "post",
                url: requestUrl,
                data: { act: 'exit', courseId: current.courseID, logId: playInfo.logId },
                async: true,
                cache: false,
                dataType: 'json',
                success: function (data, textStatus) {
                    $.ajax({
                        type: "post",
                        url: requestUrl,
                        data: { act: 'getSession', courseId: current.courseID },
                        async: true,
                        cache: false,
                        dataType: 'json',
                        success: function (data, textStatus) { callback(); },
                        error: (data) => { notifyError(current, data); }
                    });

                },
                error: (data) => { notifyError(current, data); }
            });
        } else callback();
    } else callback();
}

function notifyError(courseInfo, msg) {
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/error128.png',
        title: '提示消息',
        message: '播放课程"' + courseInfo.courseName + '"时出现错误: ' + (null == msg ? "" : JSON.stringify(msg)),
        eventTime: Date.now() + 120000
    });
}

function notifySuccess(msg) {
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/success128.png',
        title: '提示消息',
        message: msg,
        eventTime: Date.now() + 20000
    });
}

function playCourses(courses) {
    taskQueue = courses;
    notifySuccess("后台开始自动播放, 您可以关闭选课页面, 但请保持浏览器处于打开状态.");
    loopTaskQueue(null);
}

function loopTaskQueue(courseID) {
    exitStudy(() => {
        if (taskQueue) {
            let taskIndex = -1;
            for (let i = 0; i < taskQueue.length; i++) {
                const e = taskQueue[i];
                if ((courseID && e.courseID == courseID) || (null == courseID && !e._played)) {
                    taskIndex = i;
                    break;
                }
            }
            if (taskIndex > -1) {
                playInfo = {
                    pre: playInfo && playInfo.pre ? playInfo.pre : null,
                    current: copyObject(taskQueue[taskIndex]),
                    next: taskIndex < taskQueue.length - 1 ? copyObject(taskQueue[taskIndex + 1]) : null,
                    playStartTime: new Date().getTime()
                }
                study();
            }
        }
    });
}

function study() {
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
                                        playInfo.logId = data.logId;
                                        playInfo.pollingHandle = setInterval(pollingCourse, countTimeDelay);
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

function pollingCourse() {
    let current = playInfo.current;
    if (playInfo.pollingHandle) {
        $.ajax({
            type: "post",
            url: requestUrl,
            data: { act: 'update', courseId: current.courseID, logId: playInfo.logId },
            async: true,
            cache: false,
            dataType: 'json',
            success: function (data, textStatus) {
                if (data.err < 0) notifyError(current, data.msg);
                else if (data.err == '2') {
                    notifyError(current, "您的账号已在其他地方登录,被迫下线");
                    exitStudy(() => { clearData(); });
                }
                else if (data.err == '1') {
                    if (data.examType == 'W' || data.examType == 'E' || data.examType == 'S') {
                        // TODO 完成的情况下, 是否考虑再播放一段若干时间以模拟真实性
                        let message = '课程"' + current.courseName + '"播放完毕, 获得学分:' + data.credithour + '.';
                        message += null != playInfo.next ? "开始播放下一节..." : "视频播放完毕...";
                        notifySuccess(message);
                        markCoursePlayed(playInfo.current.courseID);
                        playInfo.pre = current;
                        if (playInfo.next) {
                            playInfo.current = playInfo.next;
                            loopTaskQueue(playInfo.next.courseID);
                        } else exitStudy(() => { clearData(); });
                    }
                }
            },
            error: (data) => { notifyError(current, data.msg); }
        });
    }
}