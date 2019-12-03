const tabList = document.getElementById("tab-list");
const bookmarkList = document.getElementById("bookmark-list");
let viewNavElements = initializeNavBar();
const NAV_ID_TO_VIEW = {
    "nav-tabs-view": document.getElementById("tabs-view"),
    "nav-bookmarks-view": document.getElementById("bookmarks-view")
    // "nav-settings-view": document.getElementById("settings-view")
};
switchToView(viewNavElements[0]);

function initializeNavBar() {
    return [
        initializeTabsViewNav(),
        initializeBookmarksViewNav()
        // initializeSettingsViewNav()
    ];
}

function initializeTabsViewNav() {
    let tabsViewNav = document.getElementById("nav-tabs-view");

    tabsViewNav.addEventListener("click", handleViewNavClick);

    return tabsViewNav;
}

function handleViewNavClick(event) {
    switchToView(event.currentTarget);
}

function switchToView(newViewNav) {
    viewNavElements.forEach((viewNavElement) => {
        if (viewNavElement.id === newViewNav.id) {
            activateView(viewNavElement);
        } else {
            deactivateView(viewNavElement);
        }
    });
}

function activateView(viewNavElement) {
    viewNavElement.classList.add("active-view");
    NAV_ID_TO_VIEW[viewNavElement.id].classList.remove("removed");
}

function deactivateView(viewNavElement) {
    viewNavElement.classList.remove("active-view");
    NAV_ID_TO_VIEW[viewNavElement.id].classList.add("removed");
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
    console.log(tabId)
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
    let categories = await getCategoriesOfWebsite(tabId);
    listing.appendChild(createListingContentElement(tabPromise, categories));

    if (!await tabPromise) {
        return undefined;
    }
    return listing;
}

// return an array of categories, as specified in websites.js
async function getCategoriesOfWebsite(tabId) {
    let tab_true = await browser.tabs.get(tabId);
    let categorizer = new Categorizer();
    return categorizer.search_category(tab_true.url);
}

function createListingContentElement(tabPromise, categories) {
    let listingContent = document.createElement("div");
    listingContent.classList.add("row", "no-gutters", "tab-listing-content");
    listingContent.append(createListingIconSectionElement(tabPromise), createListingLeftSectionElement(tabPromise), createListingMiddleSectionElement(categories),
        createListingRightSectionElement(tabPromise, categories));
    return listingContent;
}

function createListingIconSectionElement(tabPromise) {
    let listingIconSection = document.createElement("div");
    listingIconSection.classList.add("col-1", "tab-icon-section");
    listingIconSection.appendChild(createListingFavIconElement(tabPromise));
    return listingIconSection;
}

function createListingLeftSectionElement(tabPromise) {
    let listingLeftSection = document.createElement("div");
    listingLeftSection.classList.add("col-6", "tab-left-section");
    listingLeftSection.append(createListingTitleTextElement(tabPromise));
    return listingLeftSection;
}

function navigateToAppropriateTab(id) {
    browser.tabs.update(id, {
        active: true
    }).then((e) => {
        console.log("Tab has become active, id: " + id);
    })
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
        listingTitleText.addEventListener("click", function () {
            navigateToAppropriateTab(tab.id);
        })
    });

    return listingTitleText;
}

function setListingTitleText(listingTitleText, title) {
    listingTitleText.textContent = fitTitleTextToListing(title);
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
    listingFavIcon.src = "http://icons.duckduckgo.com/ip2/" + getLinkRoot(url) + ".ico";
}

function getLinkRoot(link) {
    let startIndex = link.search("https://"); // should be 0 if exist
    if (startIndex > -1) {
        startIndex += 8;
    } else {
        startIndex = 0;
    }

    let endIndex = link.indexOf("/", startIndex);
    if (endIndex === -1) {
        endIndex = link.length;
    }

    return link.substring(0, endIndex).replace("https://", "").replace("www.", "");
}

const GLOBAL_TITLE_LENGTH_LIMIT = 14;

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

function createListingMiddleSectionElement(categories) {
    let listingMiddleSection = document.createElement("div");
    listingMiddleSection.classList.add("col-1", "tab-middle-section");
    listingMiddleSection.append(createListingCategoriesContainerElement(categories));
    return listingMiddleSection;
}

function createListingCategoriesContainerElement(categories) {
    let listingMiddleContainer = document.createElement("div");
    listingMiddleContainer.classList.add("float-left", "container", "tab-categories");

    let listingMidRow = document.createElement("div");
    listingMidRow.classList.add("row", "tab-category-row");
    if (categories.length === 1) {
        listingMidRow.append(createCategoryIcons(categories[0], true));
    } else if (categories.length >= 2) {
        listingMidRow.append(createCategoryIcons(categories[0], false), createCategoryIcons(categories[1], false));
    }

    listingMiddleContainer.append(listingMidRow);

    return listingMiddleContainer;
}

function createCategoryIcons(category, largeText) {
    let categoryIcon = document.createElement("div");
    categoryIcon.setAttribute("data-toggle", "tooltip");
    categoryIcon.setAttribute("title", category);
    if (largeText) {
        categoryIcon.classList.add("col-12", "align-middle", "tab-category", "large");
    } else {
        categoryIcon.classList.add("col-6", "align-middle", "tab-category");
    }
    categoryIcon.textContent = getCategoryEmoji(category);
    return categoryIcon;
}

function getCategoryEmoji(category) {
    switch (category) {
        case "Adult": {
            return String.fromCodePoint(0x1F51E);
        }

        case "Arts": {
            return String.fromCodePoint(0x1F3A8);
        }

        case "Business": {
            return String.fromCodePoint(0x1F4B5);
        }

        case "Computers": {
            return String.fromCodePoint(0x1F5A5);
        }

        case "Games": {
            return String.fromCodePoint(0x1F3AE);
        }

        case "Health": {
            return String.fromCodePoint(0x2695);
        }

        case "News": {
            return String.fromCodePoint(0x1F4F0);
        }

        case "Recreation": {
            return String.fromCodePoint(0x1F3D6);
        }

        case "Education": {
            return String.fromCodePoint(0x1F4DA);
        }

        case "Science": {
            return String.fromCodePoint(0x1F52C);
        }

        case "Shopping": {
            return String.fromCodePoint(0x1F6CD);
        }

        case "Sports": {
            return String.fromCodePoint(0x1F3C8);
        }

        case "Email": {
            return String.fromCodePoint(0x1F4E7);
        }

        case "Audio Visual": {
            return String.fromCodePoint(0x1F3A5);
        }

        case "Social Media": {
            return String.fromCodePoint(0x1F587);
        }

        case "Miscellaneous": {
            return String.fromCodePoint(0x1F937);
        }

    }
}


function createListingRightSectionElement(tabPromise, categories) {
    let listingRightSection = document.createElement("div");
    listingRightSection.classList.add("col-4", "tab-right-section");
    listingRightSection.append(createListingActionsElement(tabPromise, categories));
    return listingRightSection;
}

function createListingActionsElement(tabPromise, categories) {
    let listingActions = document.createElement("div");
    listingActions.classList.add("btn-group", "btn-group-lg", "float-right", "tab-options");
    listingActions.append(createListingDeleteButtonElement(tabPromise),
        createListingSaveCloseButtonElement(tabPromise, categories),
        createListingDismissButtonElement(tabPromise));
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
        addActionToButton(listingDeleteButton, "perm_close", tab.id, []);
    });

    return listingDeleteButton;
}

function createListingDeleteIconElement() {
    let listingDeleteIcon = document.createElement("i");
    listingDeleteIcon.classList.add("fa", "fa-trash", "fa-2x");
    return listingDeleteIcon;
}

function addActionToButton(button, action, tabId, categories) {
    button.addEventListener("click", () => {
        browser.runtime.sendMessage({
            tabId: tabId,
            categories: categories,
            action: action
        });
    });
}

function createListingSaveCloseButtonElement(tabPromise, categories) {
    let listingSaveCloseButton = document.createElement("a");
    listingSaveCloseButton.classList.add("btn", "tab-button");
    listingSaveCloseButton.setAttribute("data-toggle", "tooltip");
    listingSaveCloseButton.setAttribute("title", "Save and Close");
    listingSaveCloseButton.appendChild(createListingSaveCloseIconElement());

    tabPromise.then(tab => {
        if (!tab) {
            return;
        }
        addActionToButton(listingSaveCloseButton, "save_close", tab.id, categories);
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
        addActionToButton(listingDismissButton, "dismiss", tab.id, []);
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

browser.storage.sync.get("bookmarks").then(loadInitialBookmarkList);

function loadInitialBookmarkList(bookmarkResult) {
    if (!(bookmarkResult && bookmarkResult.bookmarks)) {
        return;
    }
    addBookmarkListings(bookmarkResult.bookmarks);
}

function addBookmarkListings(bookmarks) {
    bookmarks.foreach((bookmark) => {
        addBookmarkListing(bookmark);
    });
}

function addBookmarkListing(bookmark) {
    let urlListing = createUrlListingElement(bookmark);

    bookmark.category.foreach((category) => {
        addUrlListingToCategory(urlListing, category);
    });
    // TODO: Implement bookmark listing additions
}

function createUrlListingElement(bookmark) {
    let urlListing = document.createElement("li");
    urlListing.classList.add("list-group-item", "d-flex flex-row", "bookmark-url-listing");

    urlListing.append(
        createUrlListingTitleElement(bookmark),
        createUrlListingDeleteElement(bookmark)
    );

    return urlListing;
}

function createUrlListingTitleElement(bookmark) {
    let urlListingTitle = document.createElement("p");
    urlListingTitle.classList.add("m-0", "flex-grow-1", "bookmark-url-listing-title");
    urlListingTitle.id = `url-listing-${hashString(bookmark.url)}`;

    urlListingTitle.addEventListener("click", () => {
        browser.tabs.create({
            url: bookmark.url
        });
    });

    return urlListingTitle;
}

function hashString(string) {
    let hash = 0,
        i, chr;
    if (string.length === 0) return hash;
    for (i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function createUrlListingDeleteElement(bookmark) {
    let urlListingDeleteButton = document.createElement("a");
    urlListingDeleteButton.classList.add("btn", "btn-danger", "bookmark-delete-button");

    urlListingDeleteButton.appendChild(createUrlListingDeleteIconElement());

    urlListingDeleteButton.addEventListener("click", () => {
        removeBookmarkListing(bookmark);
    });

    return urlListingDeleteButton;
}

function createUrlListingDeleteIconElement() {
    let urlListingDeleteIcon = document.createElement("i");
    urlListingDeleteIcon.classList.add("fa", "fa-trash", "fa-2x");

    return urlListingDeleteIcon;
}

function removeBookmarkListings(bookmarks) {
    bookmarks.foreach((bookmark) => {
        removeBookmarkListing(bookmark);
    });
}

function addUrlListingToCategory(urlListing, category) {
    addBookmarkCategory(category);
    let bookmarkCategoryElement = document.getElementById(`bookmark-category-${normifyCategories(category)}`);

    urlListing.classList.add("removed");

    bookmarkCategoryElement.getElementsByClassName("bookmark-url-list")[0].appendChild(urlListing);

    bookmarkCategoryElement.getElementsByClassName("bookmark-category-header")[0].addEventListener("click", () => {
        toggleCategoryCollapse(bookmarkCategoryElement);
    });

    setTimeout(() => {
        urlListing.classList.remove("removed");
    }, 10);
}

function toggleCategoryCollapse(category) {
    let urlList = category.getElementsByClassName("bookmark-url-list")[0];
    if (urlList.classList.contains("removed")) {
        expandCategory(urlList);
    } else {
        collapseCategory(urlList);
    }
}

function collapseCategory(urlList) {
    urlList.classList.add("removed");
}

function expandCategory(urlList) {
    urlList.classList.remove("removed");
}

// example category id would be "bookmark-category-audio-visual"
function addBookmarkCategory(categoryName) {
    if (!document.getElementById("bookmark-category-" + normifyCategories(categoryName))) {
        let categoryHeader = document.createElement('div');
        categoryHeader.classList.add("d-flex", "flex-row", "bookmark-category-header");

        let categorySymbol = document.createElement("p");
        categorySymbol.classList.add("m-0", "align-middle", "bookmark-category-symbol");
        categorySymbol.textContent = getCategoryEmoji(categoryName);

        let categoryTitle = document.createElement("p");
        categoryTitle.classList.add("m-0", "pl-1", "flex-grow-1", "bookmark-category-title")
        categoryTitle.textContent = categoryName

        let collapseIcon = document.createElement("a")
        collapseIcon.classList.add("btn", "bookmark-toggle-collapse-icon")

        let collapseHelper = document.createElement("i");
        collapseHelper.classList.add("fa fa-angle-right fa-2x")
        collapseIcon.appendChild(collapseHelper);

        categoryHeader.append(categorySymbol, categoryTitle, collapseIcon, collapseHelper);
        bookmarkList.append(categoryHeader)
    }
}

function normifyCategories(categoryName) {
    let words = categoryName.split(' ');
    let retString = "";
    for (var i = 0; i < words.length; i++) {
        retString = retString + words[i].toLowerCase() + "-";
    }
    return retString.substring(0, retString.length - 1);
}

browser.storage.onChanged.addListener(onStorageChange);

function onStorageChange(changes) {
    if (changes.temp) {
        processChangesToTabQueue(changes.temp);
    }
    if (changes.bookmarks) {
        processChangesToBookmarkList(changes.bookmarks);
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

function processChangesToBookmarkList(bookmarkChanges) {
    processBookmarkAddition(bookmarkChanges);
    processBookmarkRemovals(bookmarkChanges);
}

function processBookmarkAddition(bookmarkChanges) {
    addBookmarkListings(bookmarkChanges.newValue.filter(bookmark => !bookmarkChanges.oldValue.includes(bookmark)))
}

function processBookmarkRemovals(bookmarkChanges) {
    removeBookmarkListings(bookmarkChanges.oldValue.filter(bookmark => !bookmarkChanges.newValue.includes(bookmark)))
}