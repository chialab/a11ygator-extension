const reports = {};

function removeBadge() {
    chrome.browserAction.setBadgeText({ text: '' });
}

function setBadge(number, color) {
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
    chrome.browserAction.setBadgeText({ text: `${number}` });
}

function handleReport(report) {
    if (!report || !report.result) {
        return removeBadge();
    }
    let errorsCount = 0;
    let warningsCount = 0;
    let noticesCount = 0;
    report.result.forEach((issue) => {
        switch (issue.type) {
            case 'error':
                errorsCount++;
                break;
            case 'warning':
                warningsCount++;
                break;
            default:
                noticesCount++;
        }
    });

    if (errorsCount > 0) {
        setBadge(errorsCount, '#E74C3C');
    } else if (warningsCount > 0) {
        setBadge(warningsCount, '#F39C12');
    } else if (noticesCount > 0) {
        setBadge(noticesCount, '#3498DB');
    }
}

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

async function checkButtonStatus(tab) {
    if (!tab) {
        return;
    }

    if (!tab.url || tab.url.match(/^chrome:/)) {
        await clearStatus(tab.id);
        return;
    }

    removeBadge();

    if (tab.id in reports) {
        handleReport(reports[tab.id]);
    }
}

async function checkStatus(tab) {
    if (!tab) {
        return;
    }

    await checkButtonStatus(tab);
    await addContentFile(tab, 'content/HTMLCS.js');
    await addContentFile(tab, 'content/runner.js');
    await executeScript(tab, {
        code: 'window.a11ygator.run()',
    });

    chrome.browserAction.enable(tab.id);
    let settings = await getStorage({ standard: 'WCAG2AA' });
    await updateSettings(tab, settings);
}

async function getStorage(defaults = {}) {
    return await new Promise((resolve) => {
        chrome.storage.local.get(defaults, resolve);
    });
}

async function getCurrentTab() {
    return await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) {
                return reject();
            }
            resolve(tabs[0]);
        });
    })
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

async function handleMessage(request, sender, sendResponse) {
    if (request.type === 'allygator_report' && sender.tab) {
        let report = {
            result: request.result,
            error: request.error,
        };
        reports[sender.tab.id] = report;
        let currentTab = await getCurrentTab();
        if (currentTab && currentTab.id === sender.tab.id) {
            handleReport(report);
        }
    } else if (request.type === 'allygator_request') {
        await checkStatus(request.tab);
        sendResponse(reports[request.id]);
    }
}

async function clearStatus(id) {
    await deleteStatus(id);
    removeBadge();
    chrome.browserAction.disable(id);
}

async function deleteStatus(id) {
    delete reports[id];
}

chrome.runtime.onInstalled.addListener(async () => {
    let currentTab = await getCurrentTab();
    await checkButtonStatus(currentTab);
});

chrome.runtime.onMessage.addListener(handleMessage);

chrome.tabs.onUpdated.addListener((id, info, tab) => {
    checkButtonStatus(tab);
});

chrome.tabs.onCreated.addListener((tab) => {
    checkButtonStatus(tab);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    let tab = await getTabById(tabId);
    checkButtonStatus(tab);
});

chrome.tabs.onRemoved.addListener((id) => {
    deleteStatus(id);
});
