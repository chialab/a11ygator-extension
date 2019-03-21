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

async function updateSettings(tab) {
    let settings = await getStorage({ standard: 'WCAG2AA' });
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

async function inspect(selector) {
    return await new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(`inspect(document.querySelector('${selector}'))`, (result, isException) => {
            if (isException) {
                reject(new Error(`failed to inspect ${selector}`));
            } else {
                resolve(result);
            }
        });
    });
}

async function sendRequest(tab, run = true) {
    await addContentFile(tab, 'lib/js/HTMLCS.js');
    await addContentFile(tab, 'lib/js/runner.js');
    await updateSettings(tab);
    return await executeScript(tab, {
        code: `window.a11ygator.run(${run ? 'true' : 'false'})`,
    });
}

async function removeBadge(tab) {
    chrome.browserAction.setBadgeText({
        tabId: tab.id,
        text: '',
    });
}

async function setBadge(tab, number, color) {
    chrome.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: color,
    });
    chrome.browserAction.setBadgeText({
        tabId: tab.id,
        text: `${number}`,
    });
}