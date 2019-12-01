const tabList = document.getElementById("tab-list");

browser.storage.local.get("temp").then(loadInitialTabList);

// TODO: Add bookmarks view
// TODO: Add settings view

// TODO: Add visual categorization system to tab view

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
    // addListingElementToTabView(createPadding());
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

function createPadding() {
    let listing = document.createElement("li");
    listing.classList.add("container-fluid", "tab-listing");
    return listing
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
    let tab_true = await browser.tabs.get(tabId)
    let categorizer = new Categorizer();
    return categorizer.search_category(tab_true.url)
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
    listingIconSection.classList.add("col-1", "tab-left-section");
    listingIconSection.appendChild(createListingFavIconElement(tabPromise));
    return listingIconSection;
}

function createListingLeftSectionElement(tabPromise) {
    let listingLeftSection = document.createElement("div");
    listingLeftSection.classList.add("col-6", "tab-left-section");
    listingLeftSection.append(createListingTitleTextElement(tabPromise));
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

    return link.indexOf("www.") === -1 ? link.substring(0, endIndex).replace("https://", "www.") :
        link.substring(0, endIndex).replace("https://", "");
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

    let listingMidRow = document.createElement("div")
    listingMidRow.classList.add("row", "tab-category-row")
    if (categories.length === 1) {
        listingMidRow.append(createCategoryIcons(categories[0], true))
    } else if (categories.length >= 2) {
        listingMidRow.append(createCategoryIcons(categories[0], false), createCategoryIcons(categories[1], false))
    }

    listingMiddleContainer.append(listingMidRow)

    return listingMiddleContainer
}

function createCategoryIcons(category, largeText) {
    let categoryIcon = document.createElement("div");
    categoryIcon.setAttribute("data-toggle", "tooltip");
    categoryIcon.setAttribute("title", category);
    if (largeText) {
        categoryIcon.classList.add("col-12", "align-middle", "tab-category", "large")
    } else {
        categoryIcon.classList.add("col-6", "align-middle", "tab-category")
    }
    categoryIcon.textContent = getCategoryEmoji(category)
    return categoryIcon
}

function getCategoryEmoji(category) {
    switch (category) {
        case "Adult": {
            return String.fromCodePoint(0x1F51E)
        }

        case "Arts": {
            return String.fromCodePoint(0x1F3A8)
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