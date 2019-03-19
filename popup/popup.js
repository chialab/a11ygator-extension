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

function handleMessage(request, sender) {
    getCurrentTab()
        .then((tab) => {
            if (request.type === 'allygator_report' && sender.tab && sender.tab.id === tab.id) {
                handleReport({
                    result: request.result,
                    error: request.error,
                });
            }
        })
        .catch(() => {});
    return true;
}

window.addEventListener('load', async () => {
    chrome.runtime.onMessage.addListener(handleMessage);
    let report = await sendRequest();
    await handleReport(report);
});
