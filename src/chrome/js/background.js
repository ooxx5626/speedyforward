function init() {
  console.info("Initializing settings...");
  const url = chrome.runtime.getURL("assets/settings.json");
  fetch(url, { method: "GET" })
    .then(function (t) {
      return t.json();
    })
    .then(function (t) {
      chrome.storage.local.set({
        isAd: t.isAd,
        videoContainer: t.videoContainer,
        videoPlayer: t.videoPlayer,
        previewText: t.previewText,
        previewTextAlt: t.previewTextAlt,
        staticAds: t.staticAds,
        skipButton: t.skipButton,
        skipButtonAlt: t.skipButtonAlt,
        surveyButton: t.surveyButton,
      });
    });
}

async function simulateClick(tabId, selector) {
  // 先從content script獲取元素位置
  const position = await new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "GET_ELEMENT_POSITION",
        selector: selector,
      },
      (response) => {
        resolve(response);
      }
    );
  });

  if (!position) {
    console.warn(`selector: ` + selector + ` not found`);
    return;
  }

  try {
    // 附加debugger
    await new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });

    console.log("Debugger attached successfully");

    // 模擬按下滑鼠
    await new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(
        { tabId },
        "Input.dispatchMouseEvent",
        {
          type: "mousePressed",
          x: position.x,
          y: position.y,
          button: "left",
          clickCount: 1,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });

    // 模擬釋放滑鼠
    await new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(
        { tabId },
        "Input.dispatchMouseEvent",
        {
          type: "mouseReleased",
          x: position.x,
          y: position.y,
          button: "left",
          clickCount: 1,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  } catch (error) {
    console.error("Click simulation failed:", JSON.stringify(error));
  } finally {
    // 確保debugger被分離
    chrome.debugger.detach({ tabId });
  }
}

// 處理skip廣告
async function handleSkipAd(tabId) {
  chrome.storage.local.get(["skipButtonAlt"], async function (t) {
    simulateClick(tabId, t.skipButtonAlt);
  });
  chrome.storage.local.get(["skipButton"], async function (t) {
    simulateClick(tabId, t.skipButton);
  });
}

// 處理廣告快進
function handleAdForward(tabId) {
  chrome.storage.local.get(["videoPlayer", "isAd"], function (t) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (selector, isAdSelector) => {
        const player = document.querySelector(selector);
        if (player) {
          const originalPlay = player.play;
          player.play = function () {
            // 檢查 duration 是否有效
            if (this.duration && Number.isFinite(this.duration)) {
              // 再次確認檢查是否為廣告
              if (document.querySelector(isAdSelector))
                this.currentTime = this.duration;
            } else {
              // 如果 duration 無效，每秒檢查直到有效
              const checkDuration = setInterval(() => {
                if (this.duration && Number.isFinite(this.duration)) {
                  // 再次確認檢查是否為廣告
                  if (document.querySelector(isAdSelector))
                    this.currentTime = this.duration;
                  clearInterval(checkDuration);
                }
              }, 100);

              // 設置超時，避免無限檢查
              setTimeout(() => clearInterval(checkDuration), 5000);
            }
            return originalPlay.call(this);
          };
          player.play();
          player.play = originalPlay;
        }
      },
      args: [t.videoPlayer, t.isAd],
    });
  });
}

// 監聽消息
chrome.runtime.onMessage.addListener((message, sender) => {
  if (!sender.tab) return;

  const tabId = sender.tab.id;

  switch (message.message) {
    case "taimu-ripu-ads":
      handleAdForward(tabId);
      break;
    case "taimu-ripu-skb":
      handleSkipAd(tabId);
      break;
    case "init-setting":
      init();
      break;
  }
});

// 安裝/更新監聽
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed");

  switch (details.reason) {
    case "install":
      console.info("EXTENSION INSTALLED");
      chrome.storage.local.set({ skipCount: 0 });
      init();
      break;
    case "update":
      chrome.storage.local.get(["skipCount"]).then((data) => {
        if (typeof data.skipCount === "undefined") {
          chrome.storage.local.set({ skipCount: 0 });
        }
        console.info("EXTENSION UPDATED");
      });
      init();
      break;
    default:
      chrome.storage.local.get(["skipCount"]).then((data) => {
        if (typeof data.skipCount === "undefined") {
          chrome.storage.local.set({ skipCount: 0 });
        }
        console.info("BROWSER UPDATED");
      });
      init();
  }
});
