var browser = browser || chrome;

async function executeScript(tab, details) {
    return await new Promise((resolve, reject) => {
        try {
            browser.tabs.executeScript(tab.id, details, (results) => {
                let error = browser.runtime.lastError;
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        } catch (error) {
            reject(error);
        }
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
        browser.storage.local.get(defaults, resolve);
    });
}

async function getTabById(id) {
    return await new Promise((resolve, reject) => {
        browser.tabs.get(id, (tab) => {
            if (!tab) {
                return reject();
            }
            resolve(tab);
        });
    });
}

async function getCurrentTab() {
    if (browser.devtools && browser.devtools.inspectedWindow) {
        return await getTabById(browser.devtools.inspectedWindow.tabId);
    }
    return await new Promise((resolve, reject) => {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) {
                return reject();
            }
            resolve(tabs[0]);
        });
    })
}

async function inspect(selector) {
    return await new Promise((resolve, reject) => {
        browser.devtools.inspectedWindow.eval(`inspect(document.querySelector('${selector}'))`, (result, isException) => {
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
    browser.browserAction.setBadgeText({
        tabId: tab.id,
        text: '',
    });
}

async function setBadge(tab, number, color) {
    browser.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: color,
    });
    browser.browserAction.setBadgeText({
        tabId: tab.id,
        text: `${number}`,
    });
}