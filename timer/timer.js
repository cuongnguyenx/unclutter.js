// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
// https://gist.github.com/manast/1185904
// get all Tabs of the current Window

class Interval {
    constructor(duration, callback) {
        this.baseline = undefined;
        this.duration = duration;
        this.callback = callback;
    }

    run() {
        if (this.baseline === undefined) {
            this.baseline = new Date().getTime();
        }

        this.callback();

        let end = new Date().getTime();
        this.baseline += this.duration;

        let nextTick = this.duration - (end - this.baseline);
        if (nextTick < 0) {
            nextTick = 0;
        }
        (function (i) {
            i.timer = setTimeout(function () {
                i.run(end);
            }, nextTick);
        }(this));
    }

    stop() {
        clearTimeout(this.timer);
    }
}

const startTimeMap = new Map();
const runTimeMap = new Map();
const timer = new Interval(1000, updateTimeStatus);

function updateTimeStatus() {
    let querying = browser.tabs.query({
        active: false
    });
    querying.then(incrementTabs, onError);
}

function incrementTabs(tabs) {
    for (let tab of tabs) {
        let inactiveTime = Date.now() - startTimeMap.get(tab);

        runTimeMap.set(tab, inactiveTime);

        console.log(tab);
        console.log(tab.url); // tab.url requires the `tabs` permission
        console.log(inactiveTime);

        break;
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

initializeTimersForTabs();

function initializeTimersForTabs() {
    timer.run();

    let querying = browser.tabs.query({
        active: false
    });
    querying.then(resetTimers, onError).then(() => {
        console.log(startTimeMap);
    });
}

function resetTimers(querying) {
    let startTime = Date.now();

    for (let tab of querying) {
        startTimeMap.set(tab, startTime);
        runTimeMap.set(tab, 0);
    }
}

// On startup of addon
browser.runtime.onStartup.addListener((e) => {
    initializeTimersForTabs();
});

// If the tab is newly active, then delete its inactive timer. Also if the tab it navigated from is still open,
// initialize an inactive timer for that tab
browser.tabs.onActivated.addListener((activeInfo) => {
    console.log("NEW FOCUSED!");

    if (activeInfo.previousTabId > 1) {
        let tabPrev = findTab(activeInfo.previousTabId);

        runTimeMap.set(tabPrev, 0);
        startTimeMap.set(tabPrev, Date.now());
    }

    let currentTab = chrome.tabs.getCurrent();
    currentTab.then(onCurrentTab, onError);
});

function onCurrentTab(currentTab) {
    startTimeMap.delete(currentTab);
    runTimeMap.delete(currentTab);
}

function findTab(tabId) {
    inactiveTabs1 = startTimeMap.keys();
    inactiveTabs2 = runTimeMap.keys();

    for (let tab of inactiveTabs1) {
        if (tab.id === tabId) {
            return tab;
        }
    }

    return null;
}

// If the tab is being removed, find the correct tab in startTimeMap and delete it.
browser.tabs.onRemoved.addListener((tabId) => {
    console.log("TAB CLOSED!");

    let tabX = findTab(tabId);
    if (tabX != null) {
        runTimeMap.delete(tabX);
        startTimeMap.delete(tabX);
    }
});

// On the creation of a new tab
browser.tabs.onCreated.addListener((tab) => {
    console.log("TAB OPENED!");

    let currentTime = Date.now();
    startTimeMap.set(tab, currentTime);
    runTimeMap.set(tab, 0);
});