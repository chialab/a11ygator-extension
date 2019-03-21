function render(html) {
    const frame = document.getElementById('report');

    if (frame.innerHTML !== html) {
        frame.innerHTML = html;
    }
}

function template(counts) {
    if (!counts) {
        return '';
    }
    return `<div class="title"><h2>Page report</h2><a class="download-report">Download</a></div>
    <p>
        ${counts.errors ? `<span class="errors">Errors: ${counts.errors}</span>` : ''}
        ${counts.warnings ? `<span class="warnings">Warnings: ${counts.warnings}</span>` : ''}
        ${counts.notices ? `<span class="notices">Notices: ${counts.notices}</span>` : ''}
        ${!counts.errors && !counts.warnings && !counts.notices ? 'No issues detected 💪' : ''}
    </p>`;
}

async function handleReport(report) {
    if (!report) {
        return;
    }
    if (!report.error) {
        render(template(report.counts))
        window.report = report;
        document.querySelector('.download-report').addEventListener('click', () => {
            const payload = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(window.report))}`;
            const downloadElement = document.querySelector('.download-report');
            downloadElement.href = `data: ${payload}`;
            downloadElement.download = 'report.json';
        });

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
