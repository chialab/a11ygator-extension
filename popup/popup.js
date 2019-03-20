function render(html) {
    const frame = document.getElementById('report');

    if (frame.innerHTML !== html) {
        frame.innerHTML = html;
    }
}

function template(counts) {
    return `<h2>Page report</h2><p>
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
        render(template(report.counts));
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
    chrome.runtime.onMessage.addListener(handleMessage);
    sendRequest(await getCurrentTab());
});
