function getArtefacts() {
  // "https://ooxx5626.github.io/speedyforward/assets/setting.json"
  const url = chrome.runtime.getURL("assets/settings.json");
  fetch(url, { method: "GET" })
    .then(function (e) {
      return e.json();
    })
    .then(function (e) {
      chrome.storage.local.set({
        isAd: e.isAd,
        videoContainer: e.videoContainer,
        videoPlayer: e.videoPlayer,
        previewText: e.previewText,
        previewTextAlt: e.previewTextAlt,
        staticAds: e.staticAds,
        skipButton: e.skipButton,
        skipButtonAlt: e.skipButtonAlt,
        surveyButton: e.surveyButton,
      });
    })
    .catch((e) => {
      console.error(e);
      (speedyForwardJson = document.querySelector("#note").textContent =
        "Check that you're connected to the Internet"),
        (document.querySelector("#note").style.display = "block");
    });
}
chrome.storage.local.get(["skipCount"], function (e) {
  (document.querySelector("#skipCount").value = e.skipCount),
    (document.querySelector(".vad").textContent = e.skipCount);
}),
  chrome.tabs.query({ active: !0, currentWindow: !0 }, function (e) {
    String(e[0].url).includes("youtube.com") &&
      (String(e[0].url).includes("/watch")
        ? (document.querySelector("#video-feed").classList.add("type-active"),
          (document.querySelector("#video-feed").firstChild.src =
            "../assets/popup/video-feed-active.svg"),
          document
            .querySelector("#suggested-feed")
            .classList.add("type-active"),
          (document.querySelector("#suggested-feed").firstChild.src =
            "../assets/popup/suggested-feed-active.svg"))
        : (document.querySelector("#home-feed").classList.add("type-active"),
          (document.querySelector("#home-feed").firstChild.src =
            "../assets/popup/home-feed-active.svg")));
  }),
  document.querySelector("#more").addEventListener("click", function (e) {
    document.querySelector("#more-select").classList.toggle("countactive");
  }),
  document.querySelector("#update").addEventListener("click", function (e) {
    getArtefacts(),
      (document.querySelector("#update").textContent = "Updated!");
  });
