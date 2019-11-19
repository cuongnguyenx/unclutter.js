// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
// https://gist.github.com/manast/1185904
// get all Tabs of the current Window

class Interval {
    constructor(duration, callback) {
        this.baseline = -1;
        this.duration = duration;
        this.callback = callback;
    }

    run() {
        if (this.baseline === -1) {
            this.baseline = Date.now();
        }

        this.callback();

        let end = new Date().getTime();
        this.baseline += this.duration;

        let nextTick = this.duration - (end - this.baseline);
        if (nextTick < 0) {
            nextTick = 0;
        }

        Interval.queueNextInterval(this, nextTick);
    }

    static queueNextInterval(interval, nextTick) {
        interval.timer = setTimeout(() => {
            interval.run();
        }, nextTick);
    }

    stop() {
        clearTimeout(this.timer);
    }
}

let startTimeMap = new Map();
let runTimeMap = new Map();
const timer = new Interval(30000, updateTimeStatus); // === 30 seconds
let GLOBAL_TIME_LIMIT = 120; // seconds
let EXCLUSION_REGEX = " ";
let AUTO_KILL_TABS = true; // will be set to false right after initialization

// Initialize the storage
browser.runtime.onInstalled.addListener(details => {
    setupPersistentStorage();

    browser.storage.local.set({
        temp: []
    }).then(results => {
        console.log("Storage initialized successfully");
        browser.browserAction.setBadgeText({
            text: "0"
        });
    });

    browser.storage.sync.set({
        regex: "",
        timeLimit: 120,
        checkValue: "unchecked"
    }).then(results => {
        console.log("Settings Reset!");
        browser.browserAction.setBadgeText({
            text: "0"
        });
    });
});

function setupPersistentStorage() {
    // TODO: Add persistence
}


function updateTimeStatus() {
    let querying = browser.tabs.query({
        active: false
    });
    querying.then(incrementTabs, onError);
}


// Asynchronous function, takes in the ID of the tab, checks if the temp database already has the ID, if not
// add it to temp database (either moved into @stored or remove from @temp)
async function addDataToTempStorage(id) {
    let tabToAdd = await browser.tabs.get(id);
    let storedTabsDatabase = await browser.storage.local.get();
    let currTemp = storedTabsDatabase.temp;
    if (!(currTemp.includes(tabToAdd.id))) {
        browser.storage.local.set({
            temp: currTemp.concat([tabToAdd.id])
        }).then(e => {
            console.log("Tab added to Temp queue successfully!");
        });
    }
}


function removeTab(id) {
    let removed = browser.tabs.remove(id);
    removed.then(() => {
        removeTabFromMaps(id);
    });
}

function removeTabFromMaps(id) {
    startTimeMap.delete(id);
    runTimeMap.delete(id);
}

async function incrementTabs(tabs) {
    let index = 0;
    // console.log("TIME UPDATED")
    for (let tab of tabs) {
        let inactiveTime = (Date.now() - startTimeMap.get(tab.id)) / 1000;
        if (inactiveTime > GLOBAL_TIME_LIMIT) {
            if (AUTO_KILL_TABS) {
                removeTab(tab.id);
            } else {
                let msg = await addDataToTempStorage(tab.id, index);
                runTimeMap.set(tab.id, inactiveTime);
            }
        } else {
            runTimeMap.set(tab.id, inactiveTime);
        }
        index++;
    }
    // console.log(startTimeMap);
    // console.log(runTimeMap);
    let storedTabsDatabase = await browser.storage.local.get("temp");
    // console.log(storedTabsDatabase)
}

async function removeFromTemp(id) {
    let tempTabsDatabase = await browser.storage.local.get("temp");
    let tempArray = tempTabsDatabase.temp;
    let indexTab = tempArray.indexOf(id);
    if (indexTab > -1) {
        let discardArray = tempArray.splice(indexTab, 1);
        browser.storage.local.set({
            temp: tempArray
        });
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

initializeTimersForTabs();

function initializeTimersForTabs() {
    browser.tabs.query({
            active: false
        })
        .then(resetTimers, onError)
        .then(() => {
            console.log("Initialization Complete!");
        })
        .then(startTimer, onError);
}

function resetTimers(querying) {
    // used by initializeTimers
    let startTime = Date.now();

    for (let tab of querying) {
        startTimeMap.set(tab.id, startTime);
        runTimeMap.set(tab.id, 0);
    }
}

function startTimer() {
    timer.run();
}

// If the tab is newly active, then delete its inactive timer. Also if the tab it navigated from is still open,
// initialize an inactive timer for that tab
browser.tabs.onActivated.addListener((activeInfo) => {
    let prevTabId = activeInfo.previousTabId;
    console.log("NEW FOCUSED! " + prevTabId);
    if (prevTabId != undefined) {
        startTimeMap.set(prevTabId, Date.now());
        runTimeMap.set(prevTabId, 0);
    }
    let currentTab = browser.tabs.get(activeInfo.tabId);
    currentTab.then(onCurrentTab, onError);
});

async function onCurrentTab(currentTab) {
    // used by onActivated
    console.log(currentTab.url);
    removeTabFromMaps(currentTab.id);

    await removeFromTemp(currentTab.id);
}


// If the tab is being removed, find the correct tab in startTimeMap and delete it.
browser.tabs.onRemoved.addListener((tabId) => {
    console.log("TAB CLOSED! " + tabId);
    removeTabFromMaps(tabId);
    removeFromTemp(tabId).then(e => {
        console.log("Finished Removing");
    });
});

// On the creation of a new tab
browser.tabs.onCreated.addListener((tab) => {
    console.log("TAB OPENED! " + tab.id);
});

browser.storage.onChanged.addListener((changes, areaName) => {
    if (changes.temp && (areaName === "local")) {
        let amountTabsSaved = changes.temp.newValue.length.toString();

        // if (amountTabsSaved < 20) {
        //     browser.browserAction.setBadgeBackgroundColor({
        //         color: "green"
        //     });
        // } else {
        //     browser.browserAction.setBadgeBackgroundColor({
        //         color: "red"
        //     });
        //

        // FIXME: Colors have too much funk
        browser.browserAction.setBadgeBackgroundColor({
            color: badgeColor(amountTabsSaved)
        });

        browser.browserAction.setBadgeText({
            text: amountTabsSaved
        });
    }

    // changes with the setting
    else if (areaName === "sync") {
        let newRegex = changes.regex.newValue;
        if (EXCLUSION_REGEX != newRegex) {
            EXCLUSION_REGEX = newRegex;
        }
        let newTimeLimit = Number.parseInt(changes.timeLimit.newValue, 10);
        if (newTimeLimit != GLOBAL_TIME_LIMIT) {
            GLOBAL_TIME_LIMIT = newTimeLimit;
            startTimeMap = new Map();
            runTimeMap = new Map();
            initializeTimersForTabs();
        } else {
            AUTO_KILL_TABS = !AUTO_KILL_TABS;
            console.log(AUTO_KILL_TABS);
        }
    }
});

const BADGE_COLOR_NO_TABS = 0x00FF00;
const BADGE_COLOR_MAX_TABS = 0xFF0000;
const BADGE_MAX_TABS = 20;

function badgeColor(tabsSaved) {
    let color = mapRange(tabsSaved, 0, BADGE_MAX_TABS, BADGE_COLOR_NO_TABS, BADGE_COLOR_MAX_TABS);
    console.log(color.toString(16));
    return `#${padWithZeroes(color.toString(16), 6)}`;
}

function mapRange(value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}

function padWithZeroes(string, padAmount) {
    while (string.length < padAmount) {
        string = `0${string}`;
    }
    return string;
}

browser.runtime.onMessage.addListener(onMessageListener);

function onMessageListener(message, sender, sendResponse) {
    if (!(message.tabId && message.action)) {
        return;
    }
    runAction(message);
}

function runAction(actionToPerform) {
    switch (actionToPerform.action) {
        case "dismiss":
            dismissTab(actionToPerform.tabId);
            break;
        case "save_close":
            saveCloseTab(actionToPerform.tabId);
            break;
        case "perm_close":
            permCloseTab(actionToPerform.tabId);
            break;
    }
}

function dismissTab(tabId) {
    stopTabTracking(tabId);
}

function saveCloseTab(tabId) {
    // TODO: Implement saving
    // removeFromTemp(tabId);
    // removeTabFromMaps(tabId);
}

function permCloseTab(tabId) {
    browser.tabs.remove(tabId).then(() => {
        stopTabTracking(tabId);
    });
}

function stopTabTracking(tabId) {
    removeTabFromMaps(tabId);
    removeFromTemp(tabId);
}