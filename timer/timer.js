// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API

// get all Tabs of the current Window
Components.utils.import("resource://gre/modules/Console.jsm");
function logTabs(tabs) {
    for (let tab of tabs) {
        // tab.url requires the `tabs` permission
        console.log(tab.url);
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

browser.tabs.onCreated.addEventListener((e) => {
    console.log("FOCUSED!")
    var querying = browser.tabs.query({currentWindow: true, active: true});
    querying.then(logTabs, onError);
});