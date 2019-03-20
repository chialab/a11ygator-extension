const reports = {};

async function handleReport(report) {
    if (!report || !report.result) {
        return await removeBadge();
    }

    if (report.counts.errors > 0) {
        await setBadge(report.counts.errors, '#E74C3C');
    } else if (report.counts.warnings > 0) {
        await setBadge(report.counts.warnings, '#F39C12');
    } else if (report.counts.notices > 0) {
        await setBadge(report.counts.notices, '#3498DB');
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

function handleMessage(request, sender) {
    if (request.type === 'allygator_report' && sender.tab) {
        reports[sender.tab.id] = request;
        getCurrentTab()
            .then((tab) => {
                if (tab && tab.id === sender.tab.id) {
                    return handleReport(request);
                }
            })
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
    for (let id in reports) {
        let tab = await getTabById(id);
        if (tab) {
            reload(tab);
        }
        delete reports[id];
    }
    let currentTab = await getCurrentTab();
    await checkButtonStatus(currentTab);
});

chrome.runtime.onMessage.addListener(handleMessage);

chrome.tabs.onUpdated.addListener((id, info, tab) => {
    deleteStatus(tab.id);
    checkButtonStatus(tab);
});

chrome.tabs.onCreated.addListener((tab) => {
    deleteStatus(tab.id);
    checkButtonStatus(tab);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    let tab = await getTabById(tabId);
    checkButtonStatus(tab);
});

chrome.windows.onFocusChanged.addListener(async () => {
    try {
        let tab = await getCurrentTab();
        if (tab && tab.id >= 0) {
            checkButtonStatus(tab);
        }
    } catch (error) {
        //
    }
});

chrome.tabs.onRemoved.addListener((id) => {
    deleteStatus(id);
});
