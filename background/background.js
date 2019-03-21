async function handleReport(tab, report) {
    if (!report || !report.result) {
        return await removeBadge(tab);
    }

    if (report.counts.errors > 0) {
        await setBadge(tab, report.counts.errors, '#E74C3C');
    } else if (report.counts.warnings > 0) {
        await setBadge(tab, report.counts.warnings, '#F39C12');
    } else if (report.counts.notices > 0) {
        await setBadge(tab, report.counts.notices, '#3498DB');
    }
}

async function checkStatus(tab) {
    if (!tab) {
        return;
    }

    try {
        await sendRequest(tab, false);
        chrome.browserAction.enable(tab.id);
    } catch(error) {
        await clearStatus(tab);
    }
}

function handleMessage(request, sender) {
    if (request.type === 'allygator_report' && sender.tab) {
        handleReport(sender.tab, request)
    }
    return true;
}

async function clearStatus(tab) {
    await removeBadge(tab);
    chrome.browserAction.disable(tab.id);
}

chrome.runtime.onInstalled.addListener(async () => {
    let currentTab = await getCurrentTab();
    await checkStatus(currentTab);
});

chrome.runtime.onMessage.addListener(handleMessage);

chrome.tabs.onUpdated.addListener((id, info, tab) => {
    checkStatus(tab);
});

chrome.tabs.onCreated.addListener((tab) => {
    checkStatus(tab);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    let tab = await getTabById(tabId);
    checkStatus(tab);
});
