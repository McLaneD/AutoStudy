/* 

TODO 重新打开浏览器的情况, 是否应该清除chrome.storage中的数据, 因为有可能当前电脑登录了其它账号的情况

TODO Cookie时效性问题, 目前有Chrome.cookies正常的情况下, 实际上已经登录失效. 所有请求之前, 都应该先检查Cookie是否已失效问题

TODO 卸载Extension重新装载后, 打开popup.html页面报错的问题

*/

const delay = 1200000;
const requestUrl = "https://linan.learning.gov.cn/study/ajax.php";

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
            let taskIndex = 0;
            // let seed = setInterval("", 1000);
            // clearInterval(seed);
            for (let i = 0; i < val.taskQueue.length; i++) {
                const e = val.taskQueue[i];
                if (e._checked || e.courseID == courseID) {
                    taskIndex = i;
                    break;
                }
            }
            chrome.storage.local.set({
                playInfo: {
                    current: val.taskQueue[taskIndex],
                    next: taskIndex < val.taskQueue.length - 1 ? val.taskQueue[taskIndex + 1] : null
                }
            });
        }
    });
}

function study() {
    chrome.storage.local.get("playInfo", (val) => {
        if (val.playInfo) {
            
        }
    });
}