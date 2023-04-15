const pathForNotificationResult =
    "https://dogol-api.herokuapp.com/api/data/SetNotificationResult";
const getTemplatePath = (btc) =>
    `https://dogol-api.herokuapp.com/api/data/GetTemplateAsync?bct_txt=${btc}`;
const pathForGetUpdateToken =
    "https://dogol-api.herokuapp.com/api/auth/refreshtoken";

const storage = chrome.storage.local;

const sendPost = async (body, token, path) => {
    console.log("body, token,", body, token);

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

            storage.set({ token: "", refreshToken: "" });
            alert(`Your session has timed out, please log in again`);

            return;
        }
    } catch (error) {
        console.error(error);
    }
};

const sendGet = async (token, path) => {
    console.log("------sendGetStart-------");
    let result;
    try {
        const response = await fetch(path, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        result = await response.json();
        console.log("sendGet.result", result);

        if (result.success == true) {
            console.log("sendGet.result.success.true", result);
            return result;
        }

        if (result.success == false) {
            console.log("sendGet.result.success.false", result);

            storage.set({ token: "", refreshToken: "" });
            alert(`Your session has timed out, please log in again`);

            result = false;

            return false;
        }
    } catch (error) {
        console.error(error);
    }

    console.log("------sendGetEnd-------");

    return result;
};

const getUpdateToken = (callback) => {
    console.log("----start update token -----");

    storage.get(["refreshToken", "token"], async (result) => {
        const refreshToken = result.refreshToken;
        const token = result.token;

        const body = { refreshToken: refreshToken };

        try {
            const newToken = await sendPost(body, token, pathForGetUpdateToken);
            storage.set({ token: newToken }, () => {
                console.log("newTokenReq", newToken);
                callback(null, newToken);
            });
            return newToken;
        } catch (error) {
            console.error(error);
            callback(error, null);
        }
    });
};

const isTokenValid = (result) => result.success || result[0];

const setNotificationResult = (resultStatus) => {
    const date = new Date();
    let currentUrl = window.location.href;

    storage.get(["user_id", "token"], (result) => {
        const userId = result.user_id;
        let token = result.token;
        const dateTimeNotification = date.toISOString();
        const timeZoneOffset = date.getTimezoneOffset();

        const body = {
            _user_id: userId,
            _template_id: 0,
            _status: resultStatus,
            _date_time_notification_alert: dateTimeNotification,
            _seconds: 0,
            _time_zone_offset: timeZoneOffset,
            _target_url: currentUrl,
        };

        sendPost(body, token, pathForNotificationResult);
    });
};

const getTemplateMessage = async (token, btc = "Welcome") => {
    console.log("-------getTemplateMessage------");

    const path = getTemplatePath(btc);

    let result = await sendGet(token, path);

    const text = result.data[0]._text;
    const url = result.data[0]._alternative_url;

    const resultMessage = { text, url };

    console.log(resultMessage);

    return resultMessage;
};

const createMessageForPush = async () => {
    let message = "";
    let goStudyURL = "https://www.google.com/";

    return new Promise((resolve, reject) => {
        storage.get(["user_name", "token"], async (result) => {
            const userName = result.user_name;
            const token = result.token;

            try {
                const createMessage = await getTemplateMessage(token);

                message = createMessage.text;
                goStudyURL = createMessage.url;
            } catch (error) {
                // Handle the error
                reject(error);
            }

            resolve({ message, goStudyURL, userName });
        });
    });
};

/*pulse button*/

let mouseX = 74;
let mouseY = 280;
document.querySelector("html").onmousemove = function (event) {
    event = event || window.event;
    mouseX = event.clientX;
    mouseY = event.clientY;
};

const addPulseButton = () => {
    storage.get(["user_name", "token"], async (result) => {
        if (result.user_name != "" && result.token != "") {
            const windowWith = document.querySelector("html").clientWidth;
            const windowHeight = document.querySelector("html").clientHeight;
            let overlay = document.querySelector(".pulse-container");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.setAttribute("class", "pulse-container");
            }

            mouseX = windowWith - mouseX < 80 ? windowWith - 80 : mouseX;
            mouseY = windowHeight - mouseY < 80 ? windowHeight - 80 : mouseY;

            mouseX = mouseX < 40 ? 40 : mouseX;
            mouseY = mouseY < 40 ? 40 : mouseY;

            overlay.style.cssText = `top: ${mouseY}px; left: ${mouseX}px;`;

            overlay.innerHTML = `<div class="pulse-button"></div>`;

            const body = document.querySelector("body");
            body.appendChild(overlay);

            document
                .querySelector(".pulse-container")
                .addEventListener("click", () => {
                    removePulseButton();
                    addPush();

                    storage.get(["notification"], ({ notification }) => {
                        const currentTime = Date.now();
                        const { count, start_time } = notification;

                        if (count > 0) {
                            storage.set({
                                notification: {
                                    count: count + 1,
                                    start_time: start_time,
                                },
                            });
                        }

                        if (start_time === 0) {
                            storage.set({
                                notification: {
                                    count: count + 1,
                                    start_time: currentTime,
                                },
                            });
                        }
                    });
                });
        }
    });
};

/*уведомление push*/

const addPush = async () => {
    try {
        const { message, goStudyURL, userName } = await createMessageForPush();
        console.log(message, goStudyURL);

        let push = document.querySelector(".push");
        if (!push) {
            push = document.createElement("div");
            push.setAttribute("class", "push");
        }

        const body = document.querySelector("body");
        body.appendChild(push);

        //основной блок

        const pushMessage = document.createElement("div");
        pushMessage.setAttribute("class", "push-message");
        push.appendChild(pushMessage);

        //приветствие

        const pushMessageUsername = document.createElement("p");
        pushMessageUsername.setAttribute("class", "push-message-username");
        pushMessageUsername.innerHTML = `Hi, ${userName}`;

        pushMessage.appendChild(pushMessageUsername);

        //текст уведомления

        const pushMessageDescription = document.createElement("p");
        pushMessageDescription.setAttribute(
            "class",
            "push-message-description"
        );
        pushMessageDescription.innerHTML = message;
        pushMessage.appendChild(pushMessageDescription);

        // кнопки

        const pushButtonWrapper = document.createElement("div");
        pushButtonWrapper.setAttribute("class", "push-buttons");
        pushMessage.appendChild(pushButtonWrapper);

        const pushYesButton = document.createElement("button");
        pushYesButton.setAttribute("class", "yes-button");
        pushYesButton.innerHTML = `<div class='push-button-info'>Yes, go to my course</div>`;
        pushButtonWrapper.appendChild(pushYesButton);

        const pushNoButton = document.createElement("button");
        pushNoButton.setAttribute("class", "no-button");
        pushNoButton.innerHTML = `<div class='push-button-info'>Not now</div>`;
        pushButtonWrapper.appendChild(pushNoButton);

        pushYesButton.addEventListener("click", () => {
            setNotificationResult(1);
            window.open(goStudyURL);
            removePush();
        });

        pushNoButton.addEventListener("click", () => {
            setNotificationResult(0);
            removePush();
        });
    } catch (error) {}
};

const removePush = () => {
    const content = document.querySelector(".push");
    if (content) {
        content.parentNode.removeChild(content);
    }
};

let timerId;

// первый таймер

const CHECK_INTERVAL = 1000; // 1 секунда

const TIME_LIMIT = 60 * 60 * 1000; // 1 час

storage.get(["time_notification"], ({ time_notification }) => {
    let count = 0;
    let timeDuration = 1 * 60 * 1000; // 1 минута

    console.log("time_notification", time_notification);

    if (time_notification) {
        timeDuration = time_notification * 1 * 60 * 1000;
    } else {
        storage.set({ time_notification: 1 });
    }

    const checkPageActivity = setInterval(() => {
        // console.log("checkPageActivity", count, timeDuration);

        if (document.hasFocus() && document.visibilityState === "visible") {
            count += 1000;
        }

        if (count >= timeDuration) {
            storage.get(["notification"], ({ notification }) => {
                console.log("notification", notification);

                const currentTime = Date.now();
                const { count, start_time } = notification;

                if (count < 3) {
                    console.log("count < 3", count);

                    addPulseButton();

                    clearInterval(checkPageActivity);
                }

                if (count >= 3 && currentTime - start_time > TIME_LIMIT) {
                    console.log("count", count);
                    console.log(
                        "currentTime - start_time",
                        (currentTime - start_time) / 60000
                    );

                    storage.set({
                        notification: {
                            count: 0,
                            start_time: 0,
                        },
                    });

                    addPulseButton();

                    clearInterval(checkPageActivity);
                }
            });
            clearInterval(checkPageActivity);
        }
    }, CHECK_INTERVAL);
});

const removePulseButton = () => {
    clearInterval(timerId);
    const content = document.querySelector(".pulse-container");
    if (content) {
        content.parentNode.removeChild(content);
    }
};

// таймер после изменения времени

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes?.time_notification) {
        const timeDuration = changes.time_notification.newValue * 60000;

        removePulseButton();

        storage.get(["time_notification"], (result) => {
            if (timeDuration) {
                const checkPageActivity = setInterval(() => {
                    if (
                        document.hasFocus() &&
                        document.visibilityState === "visible"
                    ) {
                        count += 1000;
                    }

                    if (count >= timeDuration) {
                        storage.get(["notification"], ({ notification }) => {
                            const currentTime = Date.now();
                            const { count, start_time } = notification;
                            if (count < 3) {
                                console.log("count < 3", count);
                                addPulseButton();
                            }

                            if (
                                count >= 3 &&
                                currentTime - start_time > TIME_LIMIT
                            ) {
                                console.log("count", count);
                                console.log(
                                    "currentTime - start_time",
                                    (currentTime - start_time) / 60000
                                );

                                storage.set({
                                    notification: {
                                        count: 0,
                                        start_time: 0,
                                    },
                                });

                                addPulseButton();
                            }
                        });

                        clearInterval(checkPageActivity);
                    }
                }, CHECK_INTERVAL);
            }
        });
    }
});
