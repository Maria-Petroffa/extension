const removeURL = "https://www.google.com/";
const pathForTab = "https://dogol-api.herokuapp.com/api/data/SetTabData";

const sendPostRequest = async (body, token, path) => {
    // console.log('body, token,', body, token)

    try {
        const response = await fetch(path, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        let result = await response.json();

        if (result.success == true) {
            console.log("sendPost.result.success.true", result);
            return result;
        }

        if (result.success == false) {
            console.log("sendPost.result.success.false", result);

            chrome.storage.local.set({ token: "", refreshToken: "" });

            return;
        }
    } catch (error) {
        console.error(error);
    }
};

// получение url текущего окна

async function getCurrentTabUrl() {
    let queryOptions = {
        active: true,
        lastFocusedWindow: true,
    };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
}

// получение текущего домена

async function getDomainName() {
    let shortUrl;
    const fullUrl = await getCurrentTabUrl();
    shortUrl = fullUrl.split("/")[2];
    if (fullUrl.split("/")[0] == "chrome:") {
        return "not page";
    }

    if (shortUrl) {
        if (shortUrl.slice(0, 4) != "www.") {
            shortUrl = `www.${shortUrl}`;
        }
    }
    return shortUrl;
}

// установка Badge
chrome.storage.local.get(["token"], async (result) => {
    if (result.token !== "") {
        chrome.action.setBadgeText({
            text: "ON",
        });
    } else {
        chrome.action.setBadgeText({
            text: "OFF",
        });
    }
});

chrome.storage.local.get(["time_notification", "notification"], (result) => {
    if (!result.time_notification) {
        chrome.storage.local.set({ time_notification: 1 });
    }
    if (!result.notification) {
        chrome.storage.local.set({ notification: {
            count: 0,
            start_time: 0
        } });
    }
});

// обработка удаление токена

chrome.storage.local.onChanged.addListener(function (changes, areaName) {
    if (changes.token) {
        if (changes.token.newValue !== "") {
            chrome.action.setBadgeText({
                text: "ON",
            });
        } else {
            chrome.action.setBadgeText({
                text: "OFF",
            });

            chrome.storage.local.set({
                email: "",
                showPulseButton: false,
                user_id: "",
                user_name: "",
                popupConfig: {
                    log_in: "active",
                    start_page: "hidden",
                    user_statistics: "hidden",
                },
            });
        }
    }
});

// обновление после авторизации

chrome.storage.local.onChanged.addListener(function (changes, areaName) {
    if (changes.user_name) {
        if (changes.user_name.newValue !== "") {
            chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                    if (tabs[0].id) {
                        chrome.tabs.reload(tabs[0].id);
                    }
                }
            );
        }
    }
});

// создание config popup

chrome.storage.local.get(["popupConfig"], (result) => {
    const popupPages = {
        user_statistics: "hidden",
        start_page: "active",
        log_in: "hidden",
    };

    if (!result.popupConfig) {
        chrome.storage.local.set({
            popupConfig: popupPages,
        });
    }
});

// перенаправление на страницу после удаления расширения

chrome.runtime.setUninstallURL(removeURL);

/*удаление вкладки - закрытие браузера*/

chrome.tabs.onRemoved.addListener((id, status) => {
    const idTab = id + "";
    chrome.storage.local.remove(idTab, function () {});
});

/* изменение вкладки*/

// обработчик сообщений

chrome.runtime.onMessage.addListener((request, sender) => {
    const id = sender.tab.id;
    const { type, changeTime, fullUrl } = request;

    chrome.storage.local.set({
        [id]: {
            fullUrl: fullUrl,
            changeTime: changeTime,
            type: type,
        },
    });
});

const isIdChange = (changes) => {
    if (Object.keys(changes).includes("email")) {
        return false;
    }
    if (Object.keys(changes).includes("popupConfig")) {
        return false;
    }
    if (Object.keys(changes).includes("refreshToken")) {
        return false;
    }
    if (Object.keys(changes).includes("showPulseButton")) {
        return false;
    }
    if (Object.keys(changes).includes("time_notification")) {
        return false;
    }
    if (Object.keys(changes).includes("token")) {
        return false;
    }
    if (Object.keys(changes).includes("user_id")) {
        return false;
    }
    if (Object.keys(changes).includes("user_name")) {
        return false;
    }
    return true;
};

chrome.storage.local.onChanged.addListener(function (changes) {
    if (isIdChange(changes)) {
        /*если изменилась вкладка*/
        const id = Object.keys(changes)[0];

        if (
            Object.keys(changes[id]).includes("newValue") &&
            Object.keys(changes[id]).includes("oldValue")
        ) {
            const { newValue, oldValue } = changes[id];

            if (newValue.type == "stop" && oldValue.type == "start") {
                const { changeTime, fullUrl } = oldValue;
                const endTime = Date.now();
                const fullTime = Math.round((endTime - changeTime) / 1000);

                const date = new Date();
                const dateTimeNotification = date.toISOString();
                const timeZoneOffset = date.getTimezoneOffset();
                const dateEvent = new Date(changeTime);

                console.log("date", date);
                console.log("fullTime", fullTime);
                console.log("fullUrl", fullUrl);

                chrome.storage.local.get(
                    ["token", "user_id", "user_name"],
                    (result) => {
                        const bodyForTab = {
                            _user_id: result.user_id,
                            _date: dateTimeNotification,
                            _date_event: dateEvent.toISOString(),
                            _seconds: fullTime,
                            _time_zone_offset: timeZoneOffset,
                            _url: fullUrl,
                        };

                        const token = result.token;

                        sendPostRequest(bodyForTab, token, pathForTab);
                    }
                );
            }
        }
    }
});
