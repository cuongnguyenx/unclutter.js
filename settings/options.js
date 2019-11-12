function saveOptions(e) {
    e.preventDefault();
    console.log("SAVED")

    browser.storage.sync.set({
        regex: document.querySelector("#exregex").value,
        timeLimit: document.querySelector("#timelim").value,
        checkValue: document.querySelector("#killtabs").value
    });
}

function restoreOptions() {

    function setCurrentChoice(result) {
        document.querySelector("#exregex").value = result.regex || "*://*/*";
        document.querySelector("#timelim").value = result.timeLimit || 120;
        document.querySelector("#killtabs").value = result.checkValue || "unchecked";
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get();
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
var allForms = document.querySelectorAll("form");
allForms.forEach(function(element) {
   element.addEventListener("submit", saveOptions);
}); // add listeners to detect text field changes

document.querySelector("#killtabs").addEventListener("change", saveOptions);
