var browser = browser || chrome;

async function executeScript(tab, code) {
    const promise = new Promise((resolve, reject) => {
        try {
            if (browser.devtools && browser.devtools.inspectedWindow) {
                browser.devtools.inspectedWindow.eval(code, (result, isException) => {
                    if (isException) {
                        reject(new Error(`failed to eval ${code}`));
                    } else {
                        resolve(result);
                    }
                });
                return;
            }
            browser.tabs.executeScript(tab.id, { code: code }, (results) => {
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
    return await promise;
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
        return {
            id: browser.devtools.inspectedWindow.tabId,
        };
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
    let tab = await getCurrentTab();
    let script = '';
    selector
        .split('/deep/')
        .map((s) => s.trim())
        .forEach((s, i) => {
            if (i === 0) {
                script += `document.querySelector('${s}')`;
                return;
            }
            script += `.shadowRoot.querySelector('${s}')`;
        });
    return await executeScript(tab, `inspect(${script})`);
}

async function sendRuntimeMessage(message) {
    return browser.runtime.sendMessage(message);
}

async function sendRequest(tab, run = true, refresh = false) {
    if (browser.devtools && browser.devtools.inspectedWindow) {
        return await sendRuntimeMessage({
            type: 'a11ygator_devtools_request',
            tab: {
                id: browser.devtools.inspectedWindow.tabId,
            },
            run,
            refresh,
        });
    }
    return await new Promise(async (resolve, reject) => {
        let settings = await getStorage({ standard: 'WCAG2AA' });
        browser.tabs.sendMessage(tab.id, {
            type: 'a11ygator_request',
            settings,
            run,
            refresh,
        }, (handled) => {
            let error = browser.runtime.lastError;
            if (!error && handled) {
                resolve();
            } else {
                reject(new Error('unhandled request'));
            }
        });
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