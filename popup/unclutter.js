const tabList = document.getElementById("tab-list");

browser.storage.local.get("temp").then(loadInitialTabList);

function loadInitialTabList(tabs) {
    if (!tabs || !tabs.temp) {
        return;
    }

    addTabListings(tabs.temp);
}

function addTabListings(tabIdsToBeAdded) {
    console.log(tabIdsToBeAdded);
    Array.prototype.forEach.call(tabIdsToBeAdded, tabId => {
        addTabListing(Number.parseInt(tabId));
    });
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
        activateListingTooltips(listingElement.id);
        animateListingElementEntry(listingElement);
    });

    console.log(`Created listing for ${tabId}`);
}

async function createListingElement(tabId) {
    let listing = document.createElement("li");
    listing.classList.add("list-group-item", "container-fluid", "tab-listing", "removed");
    listing.id = `tab-listing-${tabId}`;
    let tabPromise = browser.tabs.get(tabId);
    listing.appendChild(createListingContentElement(tabPromise));

    return listing;
}

function createListingContentElement(tabPromise) {
    let listingContent = document.createElement("div");
    listingContent.classList.add("row", "no-gutters", "tab-listing-content");
    listingContent.append(createListingLeftSectionElement(tabPromise),
        createListingRightSectionElement(tabPromise));
    return listingContent;
}

function createListingLeftSectionElement(tabPromise) {
    let listingLeftSection = document.createElement("div");
    listingLeftSection.classList.add("col-8", "tab-left-section");
    listingLeftSection.append(createListingTitleTextElement(tabPromise));
    return listingLeftSection;
}

function createListingTitleTextElement(tabPromise) {
    let listingTitleText = document.createElement("p");
    listingTitleText.classList.add("align-middle", "tab-text");
    tabPromise.then(tab => {
        listingTitleText.textContent = fitTitleTextToListing(tab.title);
    });
    return listingTitleText;
}

const GLOBAL_TITLE_LENGTH_LIMIT = 18;

function fitTitleTextToListing(title) {
    if (title.length < GLOBAL_TITLE_LENGTH_LIMIT) {
        return title;
    }

    title = title.substring(0, GLOBAL_TITLE_LENGTH_LIMIT);
    title = title.substring(0, title.lastIndexOf(" "));
    title = `${title}...`;

    return title;
}

function createListingRightSectionElement(tabPromise) {
    let listingRightSection = document.createElement("div");
    listingRightSection.classList.add("col-4", "tab-right-section");
    listingRightSection.append(createListingActionsElement(tabPromise));
    return listingRightSection;
}

function createListingActionsElement(tabPromise) {
    let listingActions = document.createElement("div");
    listingActions.classList.add("btn-group", "btn-group-lg", "float-right", "tab-options");
    listingActions.append(createListingDeleteButtonElement(tabPromise),
        createListingSaveCloseButtonElement(tabPromise),
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
        listingDeleteButton.addEventListener("click", () => {
            // TODO: Implement the deletion button functionality
            console.log("Delete clicked for " + tab.id);
        });
    });

    return listingDeleteButton;
}

function createListingDeleteIconElement() {
    let listingDeleteIcon = document.createElement("i");
    listingDeleteIcon.classList.add("fa", "fa-trash", "fa-2x");
    return listingDeleteIcon;
}

function createListingSaveCloseButtonElement(tabPromise) {
    let listingSaveCloseButton = document.createElement("a");
    listingSaveCloseButton.classList.add("btn", "tab-button");
    listingSaveCloseButton.setAttribute("data-toggle", "tooltip");
    listingSaveCloseButton.setAttribute("title", "Save and Close");
    listingSaveCloseButton.appendChild(createListingSaveCloseIconElement());

    tabPromise.then(tab => {
        listingSaveCloseButton.addEventListener("click", () => {
            // TODO: Implement save/close button functionality
            console.log("SaveClose clicked for " + tab.id);
        });
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
        listingDismissButton.addEventListener("click", () => {
            // TODO: Implement dismiss function functionality
            removeTabListing(tab.id);
            console.log("Dismiss clicked for " + tab.id);
        });
    });

    return listingDismissButton;
}

function createListingDismissIconElement() {
    let listingDeleteIcon = document.createElement("i");
    listingDeleteIcon.classList.add("fa", "fa-times", "fa-2x");
    return listingDeleteIcon;
}

function activateListingTooltips(listingId) {
    $(`#${listingId}`).tooltip({
        selector: "[data-toggle=tooltip]"
    });
}

function animateListingElementEntry(listingElement) {
    setTimeout(() => {
        listingElement.classList.remove("removed");
    }, 5);
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
    Array.prototype.forEach.call(tabQueueChanges.newValue, tabId => {
        if (!(Array.prototype.includes.call(tabQueueChanges.oldValue, tabId))) {
            addTabListing(Number.parseInt(tabId));
        }
    });
}

function processQueueRemovals(tabQueueChanges) {
    Array.prototype.forEach.call(tabQueueChanges.oldValue, tabId => {
        if (!(Array.prototype.includes.call(tabQueueChanges.newValue, tabId))) {
            removeTabListing(Number.parseInt(tabId));
        }
    });
}

function removeTabListings(tabIdsToBeRemoved) {
    Array.prototype.forEach.call(tabIdsToBeRemoved, tabId => {
        removeTabListing(Number.parseInt(tabId));
    });
}

function removeTabListing(tabId) {
    let listingToBeRemoved = document.getElementById(`tab-listing-${tabId}`);

    collapseListing(listingToBeRemoved);
    queueListingRemoval(listingToBeRemoved);
}

function collapseListing(listing) {
    listing.classList.add("removed");
}

function queueListingRemoval(listing) {
    // FIXME: Edge case where the listing is not deleted from the table because the button was hit before the tooltip appears
    $(`#${listing.id}`).find("[data-toggle=tooltip]").on('hidden.bs.tooltip', () => {
        listingSafeDelete(listing);
    });
    console.log(`Queued removal for ${listing.id}`);
}

function listingSafeDelete(listing) {
    if (!(listing && listing.parentElement)) {
        return;
    }
    deleteListing(listing);
}

function deleteListing(listing) {
    if (listing.parentElement.querySelector(":hover") === listing) {
        listing.addEventListener("mouseleave", () => {
            deleteListingElement(listing);
        });
    } else {
        deleteListingElement(listing);
    }
}

function deleteListingElement(listing) {
    console.log("Removed listing for " + listing.id);
    preventBorderArtifacts(listing);
    tabList.removeChild(listing);
    listing.remove();
}

function preventBorderArtifacts(listing) {
    listing.style.border = "none";
}