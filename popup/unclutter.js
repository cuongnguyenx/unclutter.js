const tabList = document.getElementById("tab-list");
let viewNavElements = initializeNavBar();

function initializeNavBar() {
    return [
        initializeTabsViewNav(),
        initializeBookmarksViewNav(),
        initializeSettingsViewNav()
    ];
}

function initializeTabsViewNav() {
    let tabsViewNav = document.getElementById("nav-tabs-view");

    tabsViewNav.addEventListener("click", handleViewNavClick);

    return tabsViewNav;
}

function handleViewNavClick(event) {
    viewNavElements.forEach((viewNavElement) => {
        if (viewNavElement.id === event.currentTarget.id) {
            viewNavElement.classList.add("active-view");
        }
        else {
            viewNavElement.classList.remove("active-view");
        }
    });
}

function initializeBookmarksViewNav() {
    let bookmarksViewNav = document.getElementById("nav-bookmarks-view");

    bookmarksViewNav.addEventListener("click", handleViewNavClick);

    return bookmarksViewNav;
}

function initializeSettingsViewNav() {
    let settingsViewNav = document.getElementById("nav-settings-view");

    settingsViewNav.addEventListener("click", handleViewNavClick);

    return settingsViewNav;
}

// TODO: Create bookmarks view
// TODO: Create settings view

// TODO: Add visual categorization system to tab view

browser.storage.local.get("temp").then(loadInitialTabList);

function loadInitialTabList(tabs) {
    if (!(tabs && tabs.temp)) {
        return;
    }

    addTabListings(tabs.temp);
}

function addTabListings(tabIdsToBeAdded) {
    console.log(tabIdsToBeAdded);
    tabIdsToBeAdded.forEach(tabId => {
        addTabListing(tabId);
    });
}

function addTabListing(tabId) {
    /* Listing HTML:
    <li class="list-group-item container-fluid tab-listing" id="tab-listing-1">
        <div class="row no-gutters tab-listing-content">
            <div class="col-8 tab-left-section">
                <p class="align-middle tab-text"><img src="" alt="" height="42" width="42">Sample Tab 1</img></p>
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
        if (!listingElement) {
            return;
        }
        addListingElementToTabView(listingElement);
        console.log(`Created listing for ${tabId}`);
    });
}

async function createListingElement(tabId) {
    let listing = document.createElement("li");
    listing.classList.add("list-group-item", "container-fluid", "tab-listing", "removed");
    listing.id = `tab-listing-${tabId}`;
    let tabPromise = browser.tabs.get(tabId);
    listing.appendChild(createListingContentElement(tabPromise));

    if (!await tabPromise) {
        return undefined;
    }
    return listing;
}

function createListingContentElement(tabPromise) {
    let listingContent = document.createElement("div");
    listingContent.classList.add("row", "no-gutters", "tab-listing-content");
    listingContent.append(
        createListingIconSectionElement(tabPromise),
        createListingLeftSectionElement(tabPromise),
        createListingRightSectionElement(tabPromise)
    );
    return listingContent;
}

function createListingIconSectionElement(tabPromise) {
    let listingIconSection = document.createElement("div");
    listingIconSection.classList.add("col-1", "tab-icon-section");
    listingIconSection.appendChild(createListingFavIconElement(tabPromise));
    return listingIconSection;
}

function createListingFavIconElement(tabPromise) {
    let listingFavIcon = document.createElement("img");
    listingFavIcon.classList.add("align-middle", "icon");
    listingFavIcon.height = 32;
    listingFavIcon.width = 32;
    tabPromise.then(tab => {
        if (!tab) {
            return;
        }
        setListingFavIcon(listingFavIcon, tab.url);
    });
    return listingFavIcon;
}

function setListingFavIcon(listingFavIcon, url) {
    console.log("http://icons.duckduckgo.com/ip2/" + getLinkRoot(url) + ".ico");
    listingFavIcon.src = "http://icons.duckduckgo.com/ip2/" + getLinkRoot(url) + ".ico";
}

function getLinkRoot(link) {
    let endIndex = findLinkRootEndIndex(link);

    link = link.substring(0, endIndex);
    if (link.indexOf("www.") === -1) {
        return link.replace("https://", "www.");
    }
    return link.replace("https://", "");
}

function findLinkRootEndIndex(link) {
    let searchStartIndex = findLinkRootSearchStartIndex(link);

    let endIndex = link.indexOf("/", searchStartIndex);
    if (endIndex === -1) {
        return link.length;
    }
    return endIndex;
}

function findLinkRootSearchStartIndex(link) {
    let startIndex = link.search("https://"); // should be 0 if exists
    if (startIndex > -1) {
        return startIndex + 8;
    }
    return 0;
}

function createListingLeftSectionElement(tabPromise) {
    let listingLeftSection = document.createElement("div");
    listingLeftSection.classList.add("col-7", "tab-left-section");
    listingLeftSection.appendChild(createListingTitleTextElement(tabPromise));
    return listingLeftSection;
}

function createListingTitleTextElement(tabPromise) {
    let listingTitleText = document.createElement("p");
    listingTitleText.classList.add("align-middle", "tab-text");
    tabPromise.then(tab => {
        if (!tab) {
            return;
        }
        setListingTitleText(listingTitleText, tab.title);
        listingTitleText.setAttribute("data-toggle", "tooltip");
        listingTitleText.setAttribute("title", tab.url);
    });

    return listingTitleText;
}

function setListingTitleText(listingTitleText, title) {
    listingTitleText.textContent = fitTitleTextToListing(title);
}

const GLOBAL_TITLE_LENGTH_LIMIT = 16;

function fitTitleTextToListing(title) {
    if (title.length < GLOBAL_TITLE_LENGTH_LIMIT) {
        return title;
    }

    title = title.substring(0, GLOBAL_TITLE_LENGTH_LIMIT);
    let titleStopPoint = title.lastIndexOf(" ");
    title = title.substring(0, titleStopPoint < 0 ? GLOBAL_TITLE_LENGTH_LIMIT : titleStopPoint);
    title = `${title}...`;

    return title;
}

function createListingRightSectionElement(tabPromise) {
    let listingRightSection = document.createElement("div");
    listingRightSection.classList.add("col-4", "tab-right-section");
    listingRightSection.appendChild(createListingActionsElement(tabPromise));
    return listingRightSection;
}

function createListingActionsElement(tabPromise) {
    let listingActions = document.createElement("div");
    listingActions.classList.add("btn-group", "btn-group-lg", "float-right", "tab-options");
    listingActions.append(
        createListingDeleteButtonElement(tabPromise),
        createListingSaveCloseButtonElement(tabPromise),
        createListingDismissButtonElement(tabPromise)
    );
    return listingActions;
}

function createListingDeleteButtonElement(tabPromise) {
    let listingDeleteButton = document.createElement("a");
    listingDeleteButton.classList.add("btn", "tab-button");
    listingDeleteButton.setAttribute("data-toggle", "tooltip");
    listingDeleteButton.setAttribute("title", "Permanently Close");
    listingDeleteButton.appendChild(createListingDeleteIconElement());

    tabPromise.then(tab => {
        if (!tab) {
            return;
        }
        addActionToButton(listingDeleteButton, "perm_close", tab.id);
    });

    return listingDeleteButton;
}

function createListingDeleteIconElement() {
    let listingDeleteIcon = document.createElement("i");
    listingDeleteIcon.classList.add("fa", "fa-trash", "fa-2x");
    return listingDeleteIcon;
}

function addActionToButton(button, action, tabId) {
    button.addEventListener("click", () => {
        browser.runtime.sendMessage({
            tabId: tabId,
            action: action
        });
    });
}

function createListingSaveCloseButtonElement(tabPromise) {
    let listingSaveCloseButton = document.createElement("a");
    listingSaveCloseButton.classList.add("btn", "tab-button");
    listingSaveCloseButton.setAttribute("data-toggle", "tooltip");
    listingSaveCloseButton.setAttribute("title", "Save and Close");
    listingSaveCloseButton.appendChild(createListingSaveCloseIconElement());

    tabPromise.then(tab => {
        if (!tab) {
            return;
        }
        addActionToButton(listingSaveCloseButton, "save_close", tab.id);
    });

    return listingSaveCloseButton;
}

function createListingSaveCloseIconElement() {
    let listingDeleteIcon = document.createElement("i");
    listingDeleteIcon.classList.add("fa", "fa-save", "fa-2x");
    return listingDeleteIcon;
}

function createListingDismissButtonElement(tabPromise) {
    let listingDismissButton = document.createElement("a");
    listingDismissButton.classList.add("btn", "tab-button");
    listingDismissButton.setAttribute("data-toggle", "tooltip");
    listingDismissButton.setAttribute("title", "Dismiss");
    listingDismissButton.appendChild(createListingDismissIconElement());

    tabPromise.then(tab => {
        if (!tab) {
            return;
        }
        addActionToButton(listingDismissButton, "dismiss", tab.id);
    });

    return listingDismissButton;
}

function createListingDismissIconElement() {
    let listingDeleteIcon = document.createElement("i");
    listingDeleteIcon.classList.add("fa", "fa-times", "fa-2x");
    return listingDeleteIcon;
}

function addListingElementToTabView(listingElement) {
    tabList.appendChild(listingElement);
    activateListingTooltips(listingElement.id);
    transitionListingElementEntry(listingElement);
}

function activateListingTooltips(listingId) {
    $(`#${listingId}`).tooltip({
        selector: "[data-toggle=tooltip]"
    });
}

function transitionListingElementEntry(listingElement) {
    setTimeout(() => {
        listingElement.classList.remove("removed");
    }, 10);
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
    removeTabListings(tabQueueChanges.newValue.filter(tab => !tabQueueChanges.oldValue.includes(tab)));
}

function processQueueRemovals(tabQueueChanges) {
    removeTabListings(tabQueueChanges.oldValue.filter(tab => !tabQueueChanges.newValue.includes(tab)));
}

function removeTabListings(tabIdsToBeRemoved) {
    tabIdsToBeRemoved.forEach(tabId => {
        removeTabListing(tabId);
    });
}

function removeTabListing(tabId) {
    let listingToBeRemoved = document.getElementById(`tab-listing-${tabId}`);

    if (!listingToBeRemoved) {
        return;
    }

    queueListingRemoval(listingToBeRemoved);
    collapseListing(listingToBeRemoved);
}

function collapseListing(listing) {
    $(`#${listing.id}`).find("[data-toggle=tooltip]").tooltip("hide");
    listing.classList.add("removed");
}

function queueListingRemoval(listing) {
    listing.addEventListener("transitionend", (event) => {
        if (event.propertyName === "max-height") {
            deleteListingElement(listing);
        }
    });
}

function deleteListingElement(listing) {
    listing.remove();
    updateTabList();
    console.log("Removed listing for " + listing.id);
}

function updateTabList() {
    // TODO: Give some indication that the tab list is currently empty
    // if (tabList.childElementCount === 0) {
    //     tabList.textContent = "Empty!";
    // }
}