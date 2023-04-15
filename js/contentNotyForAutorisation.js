chrome.storage.local.onChanged.addListener(function (changes, areaName) {

    if (changes.token) {
        if (changes.token.newValue == '') {

            // console.log('.push-warning')
            const body = document.querySelector('body')

            let pushWarning = document.createElement('div')
            pushWarning.setAttribute('class', 'push-warning')

            // console.log(body)
           
            body.appendChild(pushWarning)

            //основной блок

            const pushMessage = document.createElement('div')
            pushMessage.setAttribute('class', 'push-message')
            pushWarning.appendChild(pushMessage)

            //приветствие

            const pushMessageUsername = document.createElement('p')
            pushMessageUsername.setAttribute('class', 'push-message-username')
            pushMessageUsername.innerHTML = `Attention!`;

            pushMessage.appendChild(pushMessageUsername)

            //текст уведомления

            const pushMessageDescription = document.createElement('p')
            pushMessageDescription.setAttribute('class', 'push-message-description')
            pushMessageDescription.innerHTML = 'Your statistics are not being tracked, please log in to the application.';
            pushMessage.appendChild(pushMessageDescription)

            // кнопки

            const pushButtonWrapper = document.createElement('div')
            pushButtonWrapper.setAttribute('class', 'push-buttons')
            pushMessage.appendChild(pushButtonWrapper)

            const pushYesButton = document.createElement('button')
            pushYesButton.setAttribute('class', 'yes-button')
            pushYesButton.innerHTML = `<div class='push-button-info'>Thank you</div>`;
            pushButtonWrapper.appendChild(pushYesButton)



            pushYesButton.addEventListener("click", () => {

                pushWarning.parentNode.removeChild(pushWarning)


            });



        }
    }
});