function getButtonIClick(buttonNum) {
  return () => {
    console.log("runnning");
    chrome.browserAction.setBadgeText({ text: buttonNum.toString() })
  };
}

const content = document.getElementById("tab-list");

for (let i = 0; i < 4; i++) {
  let newListItem = content.appendChild(document.createElement("li"));
  newListItem.classList.add("tab");

  let newButton = newListItem.appendChild(document.createElement("div"));
  newButton.textContent = "Button" + i;
  newButton.classList.add("button");
  newButton.classList.add("button" + i);
  newButton.addEventListener("click", getButtonIClick(i));
}
