chrome.webRequest.onBeforeRequest.addListener((details) => {

    // TODO 浙江省其它地域域名是否同https://linan.learning.gov.cn/study/

    if (details.url.indexOf("playcourse.js") != -1) {
        let url = "";
        let xhr = new XMLHttpRequest();
        xhr.open('get', "/assert/playcourse.js", false);
        xhr.send(null);
        let content = xhr.responseText || xhr.responseXML;
        if (!content) {
            return false;
        }
        content = encodeURIComponent(
            content.replace(/[\u0080-\uffff]/g, function ($0) {
                let str = $0.charCodeAt(0).toString(16);
                return "\\u" + '00000'.substr(0, 4 - str.length) + str;
            })
        );
        url = "data:text/javascript;charset=utf-8," + content;
        return url === details.url ? {} : { redirectUrl: url };
    }
},
    { urls: ["<all_urls>"] },
    ["blocking"]);
