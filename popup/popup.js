function render(html) {
    const frame = document.getElementById('report');

    if (frame.innerHTML !== html) {
        frame.innerHTML = html;
    }
}

function template(report) {
    if (!report.counts) {
        return '';
    }
    return `<div class="title"><h2>Page report</h2><a class="download-report" href="data: text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report))}" download="report.json">Download</a></div>
    <p>
        ${report.counts.errors ? `<span class="errors">Errors: ${report.counts.errors}</span>` : ''}
        ${report.counts.warnings ? `<span class="warnings">Warnings: ${report.counts.warnings}</span>` : ''}
        ${report.counts.notices ? `<span class="notices">Notices: ${report.counts.notices}</span>` : ''}
        ${!report.counts.errors && !report.counts.warnings && !report.counts.notices ? 'No issues detected 💪' : ''}
    </p>`;
}

async function handleReport(report) {
    if (!report) {
        return;
    }
    if (!report.error) {
        render(template(report))
    } else {
        render('');
    }
}

function handleMessage(request, sender) {
    getCurrentTab()
        .then((tab) => {
            if (request.type === 'allygator_report' && sender.tab && sender.tab.id === tab.id) {
                handleReport(request);
            }
        })
        .catch(() => {});
    return true;
}

window.addEventListener('load', async () => {
    browser.runtime.onMessage.addListener(handleMessage);
    let tab = await getCurrentTab();
    sendRequest(tab);
});
