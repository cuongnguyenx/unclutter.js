// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
// https://gist.github.com/manast/1185904
// get all Tabs of the current Window
let timer = new interval(1000, checkTimeStatus);
let startTimeMap = new Map();
let runTimeMap = new Map();

function incrementTabs(tabs) {
    for (let tab of tabs) {
        // tab.url requires the `tabs` permission
        let inactiveTime = Date.now() - startTimeMap.get(tab);
        runTimeMap.set(tab, inactiveTime);
        console.log(tab.url);
        console.log(inactiveTime);
    }
}

function TimerHelper() {
    let startDate = Date.now();
    for (let tab of querying) {
        startTimeMap.set(tab, startDate);
        runTimeMap.set(tab, 0);
    }
}

function initializeTimersForTabs() {
    var querying = browser.tabs.query({});
    querying.then(TimerHelper, onError);
}


function onError(error) {
    console.log(`Error: ${error}`);
}

function checkTimeStatus() {
    var querying = browser.tabs.query({active: false});
    querying.then(logTabs, onError);
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

function onCurrentTab(currentTab) {
    startTimeMap.delete(currentTab);
    runTimeMap.delete(currentTab);
}


browser.runtime.onStartup.addListener((e) => {
    initializeTimersForTabs();
    timer.run()
});

browser.tabs.onActivated.addListener((e) => {
    console.log("NEW FOCUSED!");
    var currentTab = browser.tabs.getCurrent();
    currentTab.then(onCurrentTab, onError);
});

browser.tabs.onRemoved.addListener((tabId) => {
    console.log("TAB CLOSED!");
    inactiveTabs1 = startTimeMap.keys();
    inactiveTabs2 = runTimeMap.keys();
    for (let tab of inactiveTabs1) {
        if (tab.id === tabId) {
            startTimeMap.delete(tab);
            runTimeMap.delete(tab);
        }
    }
});

browser.tabs.onCreated.addListener((tab) => {
    console.log("TAB OPENED!");
    let currentTime = Date.now()
    
});



