// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
// https://gist.github.com/manast/1185904
// get all Tabs of the current Window

// FIXME: A bug exists where closing a tab that has been added to temp, manually, results in an error being thrown
// UPDATE: Might be caused by Firefox itself. Will look into it

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

browser.runtime.onInstalled.addListener(runStartup);
browser.runtime.onStartup.addListener(runStartup);

function runStartup() {
    setupStorage().then(() => {
        initializeTimersForTabs();
        console.log("Timers started!");
    });
}

// Initialize the storage
async function setupStorage() {
    return Promise.all([setupPersistentStorage(), clearTemporaryStorage()]);
}

async function setupPersistentStorage() {
    return Promise.all([setupBookmarkStorage(), setupSettingsStorage()]);
}

async function setupBookmarkStorage() {
    // console.log(title_Comparer.compare("We live in a Vietnamese village", "Villages in Thailand are small"));
    // console.log(website_Categorizer.search_category("https://nytimes.com/a/b"));
    return browser.storage.sync.get("bookmarks")
        .then((queryResult) => {
            // TODO remove || true in prod
            if (!queryResult.bookmarks || true) {
                initializeBookmarks();
            }
        });
}

async function initializeBookmarks() {
    await browser.storage.sync.set({
        bookmarks: []
    }).then(() => {
        console.log("Bookmark storage initialized successfully!");
    });
}

async function setupSettingsStorage() {
    await browser.storage.sync.get("settings")
        .then((queryResult) => {
            if (!queryResult.settings) {
                initializeSettings();
            }
        });
}

async function initializeSettings() {
    await browser.storage.sync.set({
        settings: {
            regex: "",
            timeLimit: 120,
            autoKillingTabs: false
        }
    }).then(() => {
        console.log("Settings initialized!");
    });
}

async function clearTemporaryStorage() {
    return browser.storage.local.set({
        temp: []
    }).then(() => {
        console.log("Temporary storage Cleared");
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
            await suspendTab(tabId);
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
        let newTemp = currTemp.concat([id]);
        browser.storage.local.set({
            temp: newTemp
        }).then(e => {
            console.log("Tab added to Temp queue successfully!");
        });
    }
}

async function suspendTab(id) {
    let currTab = await browser.tabs.get(id);
    if (!currTab.audible) {
        browser.tabs.discard(id).then(() => {
            console.log("Tab suspended, id: " + id);
        });
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function initializeTimersForTabs() {
    browser.tabs.query({
            active: false
        })
        .then(resetTimers, onError)
        .then(startTimer, onError)
        .then(() => {
            console.log("Initialization Complete!");
        });
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

    console.log("NEW FOCUSED!");

    if (prevTabId !== undefined) {
        startTimeMap.set(prevTabId, Date.now());
        runTimeMap.set(prevTabId, 0);
    }

    if (activeInfo.tabId !== undefined) {
        browser.tabs.get(activeInfo.tabId)
            .then(onCurrentTab, onError);
    }
});

async function onCurrentTab(currentTab) {
    if (!currentTab) {
        return;
    }
    // used by onActivated
    console.log(currentTab.url);
    removeTabFromMaps(currentTab.id);

    await removeFromTemp(currentTab.id);
}

async function removeFromTemp(id) {
    let tempTabsDatabase = await browser.storage.local.get("temp");
    let tempArray = tempTabsDatabase.temp;
    let tabIndex = tempArray.indexOf(id);
    if (tabIndex > -1) {
        tempArray.splice(tabIndex, 1);
        await browser.storage.local.set({
            temp: tempArray
        });
    }
}


// If the tab is being removed, find the correct tab in startTimeMap and delete it.
browser.tabs.onRemoved.addListener((tabId) => {
    console.log("TAB CLOSED! " + tabId);
    removeTabFromMaps(tabId);
    removeFromTemp(tabId).then(() => {
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
    else if (areaName === "sync") {
        if (changes.settings) {
            updateSettings(changes.settings);
        } else if (changes.bookmarks) {
            console.log(changes.bookmarks);
        }

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

    let colorBitMask = 0xFF;
    for (let rgb = 0; rgb < 3; rgb++) {
        let currentRGBBitMask = colorBitMask << (8 * rgb);
        let minRGB = (minColor & currentRGBBitMask) >> (8 * rgb);
        let maxRGB = (maxColor & currentRGBBitMask) >> (8 * rgb);
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
    dismiss: dismissTab,
    save_close: saveCloseTab,
    perm_close: permCloseTab,
    remove_bookmark: deleteBookmark
};

function runAction(actionToPerform) {
    POSSIBLE_ACTIONS[actionToPerform.action](actionToPerform.actionInfo);
}

function dismissTab(actionInfo) {
    stopTrackingTab(actionInfo.tabId);
}

function saveCloseTab(actionInfo) {
    addBookmark(actionInfo.tabId, actionInfo.categories).then(() => {
        stopTrackingTab(actionInfo.tabId);
        removeTab(actionInfo.tabId);
    });
}

async function addBookmark(actionInfo) {
    return browser.tabs.get(actionInfo.tabId).then(async (tab) => {
        let bookmarks = (await browser.storage.sync.get("bookmarks")).bookmarks;

        if (bookmarkAlreadyExists(bookmarks, tab)) {
            return;
        }

        await saveNewBookmark(bookmarks, tab, actionInfo.categories);
    });
}

function bookmarkAlreadyExists(bookmarks, tab) {
    return bookmarks.find(bookmark => bookmark.url === tab.url);
}

async function saveNewBookmark(bookmarks, tab, categories) {
    bookmarks.push({
        url: tab.url,
        title: tab.title,
        time_closed: tab.lastAccessed,
        category: categories
    });

    await browser.storage.sync.set({
        bookmarks: bookmarks
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

function deleteBookmark(actionInfo) {
    browser.storage.sync.get("bookmarks").then(async (bookmarkResult) => {
        let bookmarks = bookmarkResult.bookmarks;

        let bookmarkIndex = bookmarkResult.findIndex((element) => element.url === actionInfo.url);

        if (bookmarkIndex > -1) {
            bookmarks.splice(bookmarkIndex, 1);
            await browser.storage.sync.set({
                bookmarks: bookmarks
            });
        }
    });
}