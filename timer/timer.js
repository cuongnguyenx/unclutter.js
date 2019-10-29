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
const timer = new Interval(10000, updateTimeStatus);

function updateTimeStatus() {
    let querying = browser.tabs.query({
        active: false
    });
    querying.then(incrementTabs, onError);
}

function incrementTabs(tabs) {
    console.log(startTimeMap);
    console.log(runTimeMap);

    tabs.forEach((tab) => {
        let inactiveTime = Date.now() - startTimeMap.get(tab.id);

        runTimeMap.set(tab.id, inactiveTime);

        console.log(tab.id);
        console.log(tab.url); // tab.url requires the `tabs` permission
    });
}

function onError(error) {
    console.log(`Error: ${error}`);
}

initializeTimersForTabs();

function initializeTimersForTabs() {
    let querying = browser.tabs.query({
        hidden: true
    });
    querying.then(resetTimers, onError);
    timer.run();
}

function resetTimers(querying) {
    let startTime = Date.now();

    for (let tab of querying) {
        startTimeMap.set(tab.id, startTime);
        runTimeMap.set(tab.id, 0);
    }
}

// If the tab is newly active, then delete its inactive timer. Also if the tab it navigated from is still open,
// initialize an inactive timer for that tab
browser.tabs.onActivated.addListener((activeInfo) => {
    console.log("NEW FOCUSED!");

    if (activeInfo.previousTabId !== undefined) {
        browser.tabs.get(activeInfo.previousTabId).then((previousTab) => {
            runTimeMap.set(previousTab.id, 0);
            startTimeMap.set(previousTab.id, Date.now());
        });
    }

    let currentTab = browser.tabs.get(activeInfo.tabId);
    currentTab.then(onCurrentTab, onError);
});

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

function onCurrentTab(currentTab) {
    startTimeMap.delete(currentTab.id);
    runTimeMap.delete(currentTab.id);
}

// If the tab is being removed, find the correct tab in startTimeMap and delete it.
browser.tabs.onRemoved.addListener((tab) => {
    console.log("TAB CLOSED!");
    runTimeMap.delete(tab.id);
    startTimeMap.delete(tab.id);
});

// On the creation of a new tab
browser.tabs.onCreated.addListener((tab) => {
    console.log("TAB OPENED!");

    let currentTime = Date.now();
    startTimeMap.set(tab.id, currentTime);
    runTimeMap.set(tab.id, 0);
});