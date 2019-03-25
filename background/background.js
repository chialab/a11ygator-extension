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
        browser.browserAction.enable(tab.id);
    } catch(error) {
        await clearStatus(tab);
    }
}

function handleMessage(request, sender) {
    if (request.type === 'a11ygator_report' && sender.tab) {
        handleReport(sender.tab, request);
        sendRuntimeMessage({
            type: 'a11ygator_devtools_report',
            result: request.result,
            error: request.error,
            counts: request.counts,
            tab: {
                id: sender.tab.id,
            },
        });
    } else if (request.type === 'a11ygator_devtools_request') {
        sendRequest(request.tab, request.run, request.refresh);
    }
    return true;
}

async function clearStatus(tab) {
    await removeBadge(tab);
    browser.browserAction.disable(tab.id);
}

browser.runtime.onInstalled.addListener(async () => {
    let currentTab = await getCurrentTab();
    await checkStatus(currentTab);
});

browser.runtime.onMessage.addListener(handleMessage);

browser.tabs.onUpdated.addListener((id, info, tab) => {
    checkStatus(tab);
});

browser.tabs.onCreated.addListener((tab) => {
    checkStatus(tab);
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
    let tab = await getTabById(tabId);
    checkStatus(tab);
});
