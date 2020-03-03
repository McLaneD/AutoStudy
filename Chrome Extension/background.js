let fileMap = new Map();

fileMap.set("playcourse.js", "/assert/playcourse.js");
// fileMap.set("container.htm", "/assert/container.htm");

let typeMap = {
    "txt": "text/plain",
    "html": "text/html",
    "htm": "text/html",
    "css": "text/css",
    "js": "text/javascript",
    "json": "text/json",
    "xml": "text/xml",
    "jpg": "image/jpeg",
    "gif": "image/gif",
    "png": "image/png",
    "webp": "image/webp"
}

chrome.webRequest.onBeforeRequest.addListener((details) => {

    // TODO 浙江省其它地域域名是否同https://linan.learning.gov.cn/study/
    let url = details.url;

    for (let key of fileMap.keys()) {
        if (url.indexOf(key) !== -1) {
            var arr = url.split('.');
            let sufixContent = arr[arr.length - 1];
            var type = typeMap[sufixContent.substr(0, sufixContent.indexOf("?"))];

            let xhr = new XMLHttpRequest();
            xhr.open('get', fileMap.get(key), false);
            xhr.send(null);
            let content = xhr.responseText || xhr.responseXML;
            if (!content) return false;
            content = encodeURIComponent(
                content.replace(/[\u0080-\uffff]/g, function ($0) {
                    let str = $0.charCodeAt(0).toString(16);
                    return "\\u" + '00000'.substr(0, 4 - str.length) + str;
                })
            );
            if (type) url = "data:" + type + ";charset=utf-8," + content;
        }
    }
    return url === details.url ? {} : { redirectUrl: url };
},
    { urls: ["<all_urls>"] },
    ["blocking"]);
