function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
        regex: document.querySelector("#exregex").value
    });
}

function restoreOptions() {

    function setCurrentChoice(result) {
        document.querySelector("#exregex").value = result.regex || "*://*/*";
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get("regex");
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
