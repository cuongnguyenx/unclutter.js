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
  /* Listing HTML:
  <li class="list-group-item container-fluid tab-listing" id="tab-listing-1">
    <div class="row no-gutters tab-listing-content">
      <div class="col-8 tab-left-section">
        <p class="align-middle tab-text">Sample Tab 1</p>
      </div>
      <div class="col-4 tab-right-section">
        <div class="btn-group btn-group-lg float-right tab-options">
          <a class="btn tab-button" data-toggle="tooltip" title="Permanently close">
            <i class="fa fa-trash fa-2x"></i>
          </a>
          <a class="btn tab-button" data-toggle="tooltip" title="Save and close">
            <i class="fa fa-save fa-2x"></i>
          </a>
          <a class="btn tab-button" data-toggle="tooltip" title="Dismiss">
            <i class="fa fa-times fa-2x"></i>
          </a>
        </div>
      </div>
    </div>
  </li>
  */
  createListingElement(tabId).then(listingElement => {
    tabList.appendChild(listingElement);
  });

  console.log(tabId);
  console.log(`Created listing for ${tabId}`);
}

async function createListingElement(tabId) {
  let listing = document.createElement("li");
  listing.classList.add("list-group-item", "container-fluid", "tab-listing");
  listing.id = `tab-listing-${tabId}`;
  let tabPromise = browser.tabs.get(tabId);
  listing.appendChild(createListingContentElement(tabPromise));
  return listing;
}

async function createListingContentElement(tabPromise) {
  let listingContent = document.createElement("div");
  listingContent.classList.add("row", "no-gutters", "tab-listing-content");
  listingContent.appendChild(createListingLeftSectionElement(tabPromise));
  listingContent.appendChild(createListingRightSectionElement(tabPromise));
  return listingContent;
}

async function createListingLeftSectionElement(tabPromise) {
  let listingLeftSection = document.createElement("div");
  listingLeftSection.classList.add("col-8", "tab-left-section");
  listingLeftSection.appendChild(createListingTitleTextElement(tabPromise));
  return listingLeftSection;
}

async function createListingTitleTextElement(tabPromise) {
  let listingTitleText = document.createElement("p");
  listingTitleText.classList.add("align-middle", "tab-text");
  tabPromise.then(tab => {
    listingTitleText.textContent = tab.title;
  });
  return listingTitleText;
}

async function createListingRightSectionElement(tabId) {

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