function getButtonIClick(buttonNum) {
  console.log(toString(buttonNum));
  return () => {
    chrome.browserAction.setBadgeText({ text: buttonNum.toString() })
  };
}

const content = document.getElementById("popup-content");

for (let i = 0; i < 4; i++) {
  console.log(i);
  let newButton = content.appendChild(document.createElement("div"));
  newButton.textContent = "Button" + i;
  newButton.classList.add("button");
  newButton.classList.add("button" + i);
  newButton.addEventListener("click", getButtonIClick(i));
}
