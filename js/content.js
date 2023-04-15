const changes = (type) => {
    const fullUrl = window.location.href;
    const time = Date.now();

    chrome.runtime.sendMessage({
        fullUrl: fullUrl,
        changeTime: time,
        type: type,
    });
    // console.log(fullUrl);
};

changes("start");

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // console.log("document.hidden", document.hidden);
        // страница стала невидимой

        changes("stop");
    } else {
        // console.log("document.hidden", document.hidden);
        startTime = Date.now();
        // страница стала видимой

        changes("start");
    }
});

// страница не в фокусе

window.addEventListener("blur", () => {
    // console.log("blur");
    changes("stop");
});

// страница в фокусе

window.addEventListener("focus", () => {
    // console.log("focus");
    changes("start");
});
