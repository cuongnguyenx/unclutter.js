// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
// https://gist.github.com/manast/1185904
// get all Tabs of the current Window
let timer = new interval(1000, updateTimeStatus);
let startTimeMap = new Map();
let inactiveTimeMap = new Map();
let GLOBAL_TIME_LIMIT = 60;
initializeTimersForTabs();

function incrementTabs(tabs) {
    for (let tab of tabs) {
        // tab.url requires the `tabs` permission
        let inactiveTime = (Date.now() - startTimeMap.get(tab.id)) / 1000;
        inactiveTimeMap.set(tab.id, inactiveTime);
        console.log(inactiveTime);

        if (inactiveTime > GLOBAL_TIME_LIMIT) {
            window.alert('Time is Up, Bucko!');
            console.log(tab.url);
            break;
        }
    }
}

function updateTimeStatus() {
    var querying = browser.tabs.query({active: false});
    querying.then(incrementTabs, onError);
}

function timerHelper(querying) {
    let startDate = Date.now();
    let start_time = 0;
    for (let tab of querying) {
        // console.log(tab);
        if (!(tab.id in startTimeMap.keys() || tab.id in inactiveTimeMap.keys())) {
            startTimeMap.set(tab.id, startDate);
            inactiveTimeMap.set(tab.id, start_time);
        }
    }
    // console.log(inactiveTimeMap);
    // console.log(startTimeMap);
}

function initializeTimersForTabs() {
    var querying = browser.tabs.query({active: false});
    querying.then(timerHelper, onError);
    timer.run();
}

function findTab(tabId)
{
    inactiveTabs1 = startTimeMap.keys();
    inactiveTabs2 = inactiveTimeMap.keys();
    for (let tab of inactiveTabs1) {
        if (tab.id === tabId) {
            return tab;
        }
    }
    return null;
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
        let tabId = activeInfo.previousTabId;
        inactiveTimeMap.set(tabId, 0);
        startTimeMap.set(tabId, Date.now());
    }
    console.log("NEW FOCUSED!");
    var currentTab = browser.tabs.get(activeInfo.tabId);
    currentTab.then(onCurrentTab, onError);
});

function onCurrentTab(currentTab) {
    startTimeMap.delete(currentTab.id);
    inactiveTimeMap.delete(currentTab.id);
}

// If the tab is being removed, find the correct tab in startTimeMap and delete it.
browser.tabs.onRemoved.addListener((tabId) => {
    console.log("TAB CLOSED!");
    let tabX;
    if ((tabX = findTab(tabId)) != null) {
        inactiveTimeMap.delete(tabX);
        startTimeMap.delete(tabX);
    }

});

// On the creation of a new tab
browser.tabs.onCreated.addListener((tab) => {
    console.log("TAB OPENED!");
    let currentTime = Date.now();
    startTimeMap.set(tab.id, currentTime);
    inactiveTimeMap.set(tab.id, 0)
});
