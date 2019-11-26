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
let AUTO_KILL_TABS = false; // will be set to false right after initialization
let title_Comparer = new Comparer();
let website_Categorizer = new Categorizer();

// Initialize the storage
browser.runtime.onInstalled.addListener(() => {
    setupStorage();
});

function setupStorage() {
    setupPersistentStorage();
    clearTemporaryStorage();
}

function setupPersistentStorage() {
    setupBookmarkStorage();
    setupSettingsStorage();
}

function setupBookmarkStorage() {
    // console.log(title_Comparer.compare("We live in a Vietnamese village", "Villages in Thailand are small"));
    // console.log(website_Categorizer.search_category("https://nytimes.com/a/b"));
    browser.storage.sync.get("bookmarks")
        .then((queryResult) => {
            // TODO remove || true in prod
            if (!queryResult.bookmarks || true) {
                initializeBookmarks();
            }
        });
}

function initializeBookmarks() {
    browser.storage.sync.set({
        bookmarks: []
    }).then(() => {
        console.log("Bookmark storage initialized successfully!");
    });
}

function setupSettingsStorage() {
    browser.storage.sync.get("settings")
        .then((queryResult) => {
            if (!queryResult.settings) {
                initializeSettings();
            }
        });
}

function initializeSettings() {
    browser.storage.sync.set({
        settings: {
            regex: "",
            timeLimit: 120,
            autoKillingTabs: false
        }
    }).then(() => {
        console.log("Settings initialized!");
    });
}

browser.runtime.onStartup.addListener(() => {
    clearTemporaryStorage();
});

function clearTemporaryStorage() {
    browser.storage.local.set({
        temp: []
    }).then(results => {
        console.log("Temporary storage initialized successfully!");
        updateBadge(0);
    });
}

// update inactive time for all current inactive tabs
function updateTimeStatus() {
    let querying = browser.tabs.query({
        active: false
    });
    querying.then(incrementTabs, onError);
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
    // console.log("TIME UPDATED")
    for (let tab of tabs) {
        await incrementTabTime(tab.id);
    }
    // console.log(startTimeMap);
    // console.log(runTimeMap);
    // let storedTabsDatabase = await browser.storage.local.get("temp");
    // console.log(storedTabsDatabase)
}

async function incrementTabTime(tabId) {
    let inactiveTime = (Date.now() - startTimeMap.get(tabId)) / 1000;
    if (inactiveTime > GLOBAL_TIME_LIMIT) {
        if (AUTO_KILL_TABS) {
            removeTab(tabId);
        } else {
            await addDataToTempStorage(tabId);
            runTimeMap.set(tabId, inactiveTime);
        }
    } else {
        runTimeMap.set(tabId, inactiveTime);
    }
}

// Asynchronous function, takes in the ID of the tab, checks if the temp database already has the ID, if not
// add it to temp database (either moved into @stored or remove from @temp)
async function addDataToTempStorage(id) {
    let storedTabsDatabase = await browser.storage.local.get("temp");
    let currTemp = storedTabsDatabase.temp;
    if (!(currTemp.includes(id))) {
        console.log(id);
        let newTemp = currTemp.concat([id]);
        browser.storage.local.set({
            temp: newTemp
        }).then(e => {
            console.log("Tab added to Temp queue successfully!");
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

async function removeFromTemp(id) {
    let tempTabsDatabase = await browser.storage.local.get("temp");
    let tempArray = tempTabsDatabase.temp;
    let indexTab = tempArray.indexOf(id);
    if (indexTab > -1) {
        let discardArray = tempArray.splice(indexTab, 1);
        await browser.storage.local.set({
            temp: tempArray
        });
    }
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
        updateBadge(changes.temp.newValue.length);
    }

    // changes with the setting
    else if (areaName === "sync") {
        updateSettings(changes.settings);
    }
});

function updateBadge(tabCount) {
    browser.browserAction.setBadgeBackgroundColor({
        color: badgeColor(tabCount)
    });

    browser.browserAction.setBadgeText({
        text: badgeText(tabCount)
    });
}

let BADGE_COLOR_NO_TABS = 0x00FF00;
let BADGE_COLOR_MAX_TABS = 0xFF0000;
let BADGE_MAX_TABS = 20;

function badgeColor(tabsSaved) {
    let color = mapColorRange(tabsSaved, 0, BADGE_MAX_TABS, BADGE_COLOR_NO_TABS, BADGE_COLOR_MAX_TABS);
    return `#${padWithZeroes(color.toString(16), 6)}`;
}

function mapColorRange(tabsSaved, minTabCount, maxTabCount, minColor, maxColor) {
    let colorResult = 0;

    let currentColorBitMask = 0xFF;
    for (let rgb = 0; rgb < 3; rgb++) {
        let currentRGBMask = currentColorBitMask << (8 * rgb);
        let minRGB = (minColor & currentRGBMask) >> (8 * rgb);
        let maxRGB = (maxColor & currentRGBMask) >> (8 * rgb);
        let resultRGB = mapNumberRanges(tabsSaved, minTabCount, maxTabCount, minRGB, maxRGB);
        colorResult |= resultRGB << (8 * rgb);
    }

    return colorResult;
}

function mapNumberRanges(value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}

function padWithZeroes(string, padAmount) {
    return string.length >= padAmount ? string : `${new Array(padAmount - string.length + 1).join("0")}${string}`;
}

function badgeText(tabCount) {
    return tabCount === 0 ? "" : tabCount.toString();
}

function updateSettings(settings) {
    if (!settings) {
        return;
    }
    console.log(settings.newValue);
    EXCLUSION_REGEX = settings.newValue.regex;
    GLOBAL_TIME_LIMIT = settings.newValue.timeLimit;
    AUTO_KILL_TABS = settings.newValue.autoKillingTabs;
    console.log(`Auto-Kill: ${AUTO_KILL_TABS}`);
}

browser.runtime.onMessage.addListener(onMessageListener);

function onMessageListener(message, sender, sendResponse) {
    if (!(message.tabId && message.action)) {
        return;
    }
    runAction(message);
}

const POSSIBLE_ACTIONS = {
    "dismiss": dismissTab,
    "save_close": saveCloseTab,
    "perm_close": permCloseTab
};

function runAction(actionToPerform) {
    POSSIBLE_ACTIONS[actionToPerform.action](actionToPerform.tabId);
}

function dismissTab(tabId) {
    stopTrackingTab(tabId);
}

function saveCloseTab(tabId) {
    addBookmark(tabId);
    stopTrackingTab(tabId);
    removeTab(tabId);
}

function addBookmark(tabId) {
    browser.tabs.get(tabId).then(async (tab) => {
        let bookmarkResult = await browser.storage.sync.get("bookmarks");

        console.log(bookmarkResult);

        Array.prototype.push.call(bookmarkResult.bookmarks, {
            url: tab.url,
            title: tab.title,
            time_closed: tab.lastAccessed,
            category: website_Categorizer.search_category(tab.url)
        });

        await browser.storage.sync.set({
            bookmarks: bookmarkResult.bookmarks
        });
    });
}

function permCloseTab(tabId) {
    stopTrackingTab(tabId);
    removeTab(tabId);
}

function stopTrackingTab(tabId) {
    removeTabFromMaps(tabId);
    removeFromTemp(tabId);
}