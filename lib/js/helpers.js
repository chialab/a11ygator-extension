async function executeScript(tab, details) {
    return await new Promise((resolve) => {
        chrome.tabs.executeScript(tab.id, details, resolve);
    });
}

async function addContentFile(tab, file) {
    return await executeScript(tab, {
        file: file,
    });
}

async function updateSettings(tab, settings) {
    return await executeScript(tab, {
        code: `window.a11ygator.set(${JSON.stringify(settings)})`,
    });
}

async function getStorage(defaults = {}) {
    return await new Promise((resolve) => {
        chrome.storage.local.get(defaults, resolve);
    });
}

async function getTabById(id) {
    return await new Promise((resolve, reject) => {
        chrome.tabs.get(id, (tab) => {
            if (!tab) {
                return reject();
            }
            resolve(tab);
        });
    });
}

async function getCurrentTab() {
    if (chrome.devtools && chrome.devtools.inspectedWindow) {
        return await getTabById(chrome.devtools.inspectedWindow.tabId);
    }
    return await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) {
                return reject();
            }
            resolve(tabs[0]);
        });
    })
}

async function reload(tab) {
    return await new Promise((resolve) => {
        chrome.tabs.reload(tab.id, resolve)
    });
}

async function sendRequest(tab) {
    await addContentFile(tab, 'lib/js/HTMLCS.js');
    await addContentFile(tab, 'lib/js/runner.js');
    let settings = await getStorage({ standard: 'WCAG2AA' });
    await updateSettings(tab, settings);
    await executeScript(tab, {
        code: 'window.a11ygator.run()',
    });
}

async function removeBadge() {
    chrome.browserAction.setBadgeText({ text: '' });
}

async function setBadge(number, color) {
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
    chrome.browserAction.setBadgeText({ text: `${number}` });
}