$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});
//document.querySelector('[data-toggle="tooltip"]').tooltip();

const tabList = document.getElementById("tab-list");
browser.storage.local.get("temp").then(loadInitialTabList);

function loadInitialTabList(tabs) {
  if (!tabs || !tabs.temp) {
    return;
  }

  addTabListings(tabs.temp);
}

function addTabListings(tabIdsToBeAdded) {
  for (let tabId in tabIdsToBeAdded) {
    addTabListing(tabId);
  }
}

function addTabListing(tabId) {
  console.log("Created listing for " + tabId);
}

browser.storage.onChanged.addListener(onStorageChange);

function onStorageChange(changes) {
  if (changes.temp) {
    processChangesToTabQueue(changes.temp);
  }
}

function processChangesToTabQueue(tabQueueChanges) {
  processQueueAdditions(tabQueueChanges);
  processQueueRemovals(tabQueueChanges);
}

function processQueueAdditions(tabQueueChanges) {
  for (let tabId in tabQueueChanges.newValue) {
    if (!(tabId in tabQueueChanges.oldValue)) {
      addTabListing(tabId);
    }
  }
}

function processQueueRemovals(tabQueueChanges) {
  for (let tabId in tabQueueChanges.oldValue) {
    if (!(tabId in tabQueueChanges.newValue)) {
      removeTabListing(tabId);
    }
  }
}

function removeTabListings(tabIdsToBeRemoved) {
  for (let tabId in tabIdsToBeRemoved) {
    removeTabListing(tabId);
  }
}

function removeTabListing(tabId) {
  console.log("Removed listing for " + tabId);
}