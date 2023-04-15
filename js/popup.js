const pathForSignIn = 'https://dogol-api.herokuapp.com/api/auth/signin'

// получение url текущего окна

async function getCurrentTabUrl() {
    let queryOptions = {
        active: true,
        lastFocusedWindow: true
    };

    const [tab] = await chrome.tabs.query(queryOptions);

    return tab.url;
}

// получение текущего домена

async function getDomainName() {
    const fullUrl = await getCurrentTabUrl()
    let shortUrl = fullUrl.split('/')[2]

    if (shortUrl !== 'newtab') {
        if (shortUrl.slice(0, 4) != 'www.') {
            shortUrl = `www.${tab}`
        }
    }

    return shortUrl
}

// рендер попап
const startPage = document.querySelector('#start_page');
const logInPage = document.querySelector('#log_in');
const userStatPage = document.querySelector('#user_statistics');

const renderPopup = () => {
    chrome.storage.local.get(['popupConfig'], (result) => {
        const {
            start_page,
            log_in,
            user_statistics
        } = result.popupConfig;

        startPage.removeAttribute('class')
        logInPage.removeAttribute('class')
        userStatPage.removeAttribute('class')

        startPage.classList.add(start_page);
        logInPage.classList.add(log_in);
        userStatPage.classList.add(user_statistics);

    });
};

renderPopup();

// встраивание общего таймера в попап

const timerGlobal = async () => {
    const result = await chrome.storage.local.get(['timerAll'])

    if (Object.hasOwn(result, 'timerAll')) {
        const {
            minute,
            hour
        } = result.timerAll

        const timerAllDocument = document.querySelector('.time_statistic')
        const timerNotification = document.createElement('div');
        timerNotification.setAttribute('class', 'timer');

        if (timerAllDocument.querySelector('.timer')) {
            timerAllDocument.removeChild(timerAllDocument.querySelector('.timer'))
        }

        timerNotification.innerHTML = `${hour < 10 ? '0' + hour : hour}h ${minute < 10 ? '0' + minute : minute}m`;

        timerAllDocument.appendChild(timerNotification);
    } else {
//
    }
}

timerGlobal()

// изменение попап или таймера

chrome.storage.onChanged.addListener((t) => {
    timerGlobal()
    renderPopup();
});

// добавление адреса на попап статистики 

getCurrentTabUrl().then((url) => {
    let tab = url.split('/')[2]
    if (tab !== 'newtab') {
        if (tab.slice(0, 4) != 'www.') {
            tab = `www.${tab}`
        }
        const addressCurrentTab = userStatPage.querySelector('.address_tab');
        addressCurrentTab.innerHTML = ` ${tab}`;
    }
})

// клик по кнопке Sign in

startPage.querySelector('.sigh_in').addEventListener("click", () => {
    chrome.storage.local.set({
        popupConfig: {
            start_page: 'hidden',
            log_in: 'active',
            user_statistics: 'hidden'
        }
    });
    renderPopup();
});

// клик по кнопке Register открывает сраницу расширения с регистрацией

startPage.querySelector('.register').addEventListener("click", async () => {
    let url = chrome.runtime.getURL('html/register.html')
    await chrome.tabs.create({
        url
    });
});

// клик по кнопке Sign in - отправка формы

const logInForm = logInPage.querySelector('.log_in_form')

logInForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(logInForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const body = {
        email,
        password
    }

    let response = await fetch(pathForSignIn, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    let result = await response.json();

    // проверка наличия токена

    if (result.accessToken != null) {

        chrome.storage.local.set({
            popupConfig: {
                start_page: 'hidden',
                log_in: 'hidden',
                user_statistics: 'active'
            },
            email: result.email,
            token: result.accessToken,
            refreshToken: result.refreshToken,
            user_id: result.id,
            user_name: result.name,
            time_notification: 1
        });
        chrome.action.setBadgeText({
            text: 'ON'
        });
    } else {
        const mistakeMessage = logInPage.querySelector('.mistake');
        mistakeMessage.classList.remove('hidden');
    }
    renderPopup();
    
});

// клик по ссылке Forgot password открывает сраницу с восстановлением

logInPage.querySelector('.forgot_password').addEventListener("click", async () => {
    let url = chrome.runtime.getURL('html/forgotPass.html')
    await chrome.tabs.create({
        url
    });
});

// клик по кнопке Закрыть popup

// document.querySelector('.close_tab').addEventListener("click", () => {
//     window.close()
// });

// переключатель уведомлений 
const popupCheckbox = userStatPage.querySelector('.user_statistics_form')
chrome.storage.local.get(['time_notification', 'address_notification'], (result) => {
    if (result.time_notification === 1) {
        popupCheckbox.querySelector(`#time_notification`).checked = false
    }
    if (result.time_notification === 3) {
        popupCheckbox.querySelector(`#time_notification`).setAttribute('checked', true)
    }
});

popupCheckbox.addEventListener("change", (e) => {
    const checkName = e.target.name
    const isCheked = e.target.checked
    const isEmpty = (obj) => {
        for (let key in obj) {
            return false;
        }
        return true;
    }

    chrome.storage.local.get(['time_notification', 'address_notification'], (result) => {
        if (checkName === 'time_notification') {
            if (isCheked) {
                chrome.storage.local.set({ time_notification: 3 })
            } else {
                chrome.storage.local.set({ time_notification: 1 })
            }
        }
    });
});