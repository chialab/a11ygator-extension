const reports = {};

async function handleReport(report) {
    if (!report || !report.result) {
        return await removeBadge();
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
        await setBadge(errorsCount, '#E74C3C');
    } else if (warningsCount > 0) {
        await setBadge(warningsCount, '#F39C12');
    } else if (noticesCount > 0) {
        await setBadge(noticesCount, '#3498DB');
    }
}

async function checkButtonStatus(tab) {
    if (!tab) {
        return;
    }

    if (!tab.url || tab.url.match(/^chrome:/)) {
        await clearStatus(tab.id);
        return;
    }

    await removeBadge();

    if (tab.id in reports) {
        await handleReport(reports[tab.id]);
    }
}

async function checkStatus(tab) {
    if (!tab) {
        return;
    }

    await checkButtonStatus(tab);
    await addContentFile(tab, 'lib/js/HTMLCS.js');
    await addContentFile(tab, 'lib/js/runner.js');
    await executeScript(tab, {
        code: 'window.a11ygator.run()',
    });

    chrome.browserAction.enable(tab.id);
    let settings = await getStorage({ standard: 'WCAG2AA' });
    await updateSettings(tab, settings);
}

function handleMessage(request, sender, sendResponse) {
    if (request.type === 'allygator_report' && sender.tab) {
        let report = {
            result: request.result,
            error: request.error,
        };
        reports[sender.tab.id] = report;
        getCurrentTab()
            .then((tab) => {
                if (tab && tab.id === sender.tab.id) {
                    return handleReport(report);
                }
            })
            .catch(() => {});
    } else if (request.type === 'allygator_request') {
        checkStatus(request.tab)
            .then(() => sendResponse(reports[request.id]))
            .catch(() => {});
    }
    return true;
}

async function clearStatus(id) {
    await deleteStatus(id);
    await removeBadge();
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
