taimuRipu = async () => {
  await new Promise((e, t) => {
    if (!chrome.storage.local)
      chrome.runtime.sendMessage({ message: "init-setting" });
    setTimeout(() => {
      chrome.storage.local.get(
        [
          "skipCount",
          "isAd",
          "videoContainer",
          "videoPlayer",
          "previewText",
          "previewTextAlt",
          "skipButton",
          "skipButtonAlt",
          "surveyButton",
          "staticAds",
        ],
        function (e) {
          const t = document.querySelector(e.isAd),
            i = document.querySelector(e.previewText),
            o = document.querySelector(e.previewTextAlt);
          t && chrome.runtime.sendMessage({ message: "taimu-ripu-ads" }),
            e.staticAds.forEach((e) => {
              const t = document.querySelector(e);
              t && (t.style.display = "none");
            });
          const skb = document.querySelector(e.skipButtonAlt);
          skb && chrome.runtime.sendMessage({ message: "taimu-ripu-skb" });
        }
      ),
        e();
    }, 100);
  }),
    taimuRipu();
};
taimuRipu();

function getElementPosition(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_ELEMENT_POSITION") {
    const position = getElementPosition(message.selector);
    sendResponse(position);
  }
});
