function render(html) {
    const frame = document.getElementById('report');

    if (frame.innerHTML !== html) {
        frame.innerHTML = html;
    }
}

function template(data) {
    let errors = 0;
    let warnings = 0;
    let notices = 0;

    data.forEach((issue) => {
        switch (issue.type) {
            case 'error':
                errors++;
                break;
            case 'warning':
                warnings++;
                break;
            case 'notice':
                notices++;
                break;
        }
    });
    return `<h2>Page report</h2><p>
        ${errors ? `<span class="errors">Errors: ${errors}</span>` : ''}
        ${warnings ? `<span class="warnings">Warnings: ${warnings}</span>` : ''}
        ${notices ? `<span class="notices">Notices: ${notices}</span>` : ''}
        ${!errors && !warnings && !notices ? 'No issues detected 💪' : ''}
    </p>`;
}

async function handleReport(report) {
    if (!report) {
        return;
    }
    if (report.result) {
        render(template(report.result));
    } else {
        render('');
    }
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
    return await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) {
                return reject();
            }
            resolve(tabs[0]);
        });
    })
}

async function sendRequest() {
    return await new Promise(async (resolve) => {
        chrome.runtime.sendMessage({
            type: 'allygator_request',
            tab: await getCurrentTab(),
        }, resolve);
    });
}

async function handleMessage(request, sender, sendResponse) {
    let tab = await getCurrentTab();
    if (request.type === 'allygator_report' && sender.tab && sender.tab.id === tab.id) {
        handleReport({
            result: request.result,
            error: request.error,
        });
    }
}

window.addEventListener('load', async () => {
    chrome.runtime.onMessage.addListener(handleMessage);
    let report = await sendRequest();
    await handleReport(report);
});
