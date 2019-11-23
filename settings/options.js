function saveOptions(e) {
    e.preventDefault();
    console.log("SAVED");

    browser.storage.sync.set({
        settings: {
            regex: document.querySelector("#exregex").value,
            timeLimit: Number.parseInt(document.querySelector("#timelim").value),
            autoKillingTabs: document.querySelector("#killtabs").checked
        }
    });
}

function restoreOptions() {

    function setCurrentChoice(result) {
        document.querySelector("#exregex").value = result.settings.regex || "*://*/*";
        document.querySelector("#timelim").value = result.settings.timeLimit || 120;
        document.querySelector("#killtabs").checked = result.settings.autoKillingTabs ? true : false;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get("settings");
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
var allForms = document.querySelectorAll("form");
allForms.forEach(function (element) {
    element.addEventListener("submit", saveOptions);
}); // add listeners to detect text field changes

document.querySelector("#killtabs").addEventListener("change", saveOptions);