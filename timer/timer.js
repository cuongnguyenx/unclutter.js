// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
// https://gist.github.com/manast/1185904
// get all Tabs of the current Window
let timer = new interval(1000, updateTimeStatus);
let startTimeMap = new Map();
let runTimeMap = new Map();
initializeTimersForTabs();

function incrementTabs(tabs) {
    for (let tab of tabs) {
        // tab.url requires the `tabs` permission
        console.log(tab);
        let inactiveTime = Date.now() - startTimeMap.get(tab);
        runTimeMap.set(tab, inactiveTime);
        console.log(tab.url);
        console.log(inactiveTime);
        break;
    }
}

function updateTimeStatus() {
    var querying = browser.tabs.query({active: false});
    querying.then(incrementTabs, onError);
}

function TimerHelper() {
    let startDate = Date.now();
    for (let tab of querying) {
        startTimeMap.set(tab, startDate);
        runTimeMap.set(tab, 0);
    }
}

function initializeTimersForTabs() {
    timer.run()
    var querying = browser.tabs.query({active: false});
    querying.then(TimerHelper, onError);
}


function onError(error) {
    console.log(`Error: ${error}`);
}

function interval(duration, fn){
    this.baseline = undefined;

    this.run = function(){
        if(this.baseline === undefined){
            this.baseline = new Date().getTime()
        }
        fn();
        var end = new Date().getTime();
        this.baseline += duration;

        var nextTick = duration - (end - this.baseline);
        if(nextTick<0){
            nextTick = 0
        }
        (function(i){
            i.timer = setTimeout(function(){
                i.run(end)
            }, nextTick)
        }(this))
    };

    this.stop = function(){
        clearTimeout(this.timer);
    }
}

// On startup of addon
browser.runtime.onStartup.addListener((e) => {
    initializeTimersForTabs();
});

// If the tab is newly active, then delete its inactive timer. Also if the tab it navigated from is still open,
// initialize an inactive timer for that tab
browser.tabs.onActivated.addListener((activeInfo) => {

    if (activeInfo.previousTabId > 1) {
        let tabPrev = findTab(activeInfo.previousTabId);
        runTimeMap.set(tabPrev, 0);
        startTimeMap.set(tabPrev, Date.now());
    }
    console.log("NEW FOCUSED!");
    var currentTab = browser.tabs.getCurrent();
    currentTab.then(onCurrentTab, onError);
});

function onCurrentTab(currentTab) {
    startTimeMap.delete(currentTab);
    runTimeMap.delete(currentTab);
}

function findTab(tabId)
{
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
    let tabX;
    if ((tabX = findTab(tabId)) != null) {
        runTimeMap.delete(tabX);
        startTimeMap.delete(tabX);
    }

});

// On the creation of a new tab
browser.tabs.onCreated.addListener((tab) => {
    console.log("TAB OPENED!");
    let currentTime = Date.now();
    startTimeMap.set(tab, currentTime);
    runTimeMap.set(tab, 0)
});



