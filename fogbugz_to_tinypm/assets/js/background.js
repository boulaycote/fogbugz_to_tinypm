function ShouldShow (tabId, changeInfo, tab) {
	var url = tab.url;
	if (url.match(/^https?:\/\/.*\.tinypm\.com\/.*$/)){
		chrome.pageAction.show(tabId);
	}
};
chrome.tabs.onUpdated.addListener(ShouldShow);
