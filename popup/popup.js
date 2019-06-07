function render(nodes) {
    const frame = document.getElementById('report');

    frame.childNodes.forEach((node) => {
        frame.removeChild(node);
    });

    nodes.forEach((node) => {
        frame.appendChild(node);
    });
}

function template(report) {
    if (!report.counts) {
        return [];
    }

    const div = document.createElement('div');
    div.classList.add('title');

    const h2 = document.createElement('h2');
    h2.innerText = 'Page report';

    const a = document.createElement('a');
    a.classList.add('download-report');
    a.href = `data: text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report))}`;
    a.setAttribute('download', 'report.json');
    a.innerText = 'Download';

    div.appendChild(h2);
    div.appendChild(a);

    const p = document.createElement('p');
    if (report.counts.errors) {
        const span = document.createElement('span');
        span.classList.add('errors');
        span.innerText = `Errors: ${report.counts.errors}`;
        p.appendChild(span);
    }

    if (report.counts.warnings) {
        const span = document.createElement('span');
        span.classList.add('warnings');
        span.innerText = `Warnings: ${report.counts.warnings}`;
        p.appendChild(span);
    }

    if (report.counts.notices) {
        const span = document.createElement('span');
        span.classList.add('notices');
        span.innerText = `Notices: ${report.counts.notices}`;
        p.appendChild(span);
    }

    if (!report.counts.errors && !report.counts.warnings && !report.counts.notices) {
        p.innerText = 'No issues detected 💪';
    }

    return [div, p];
}

async function handleReport(report) {
    if (!report) {
        return;
    }
    if (!report.error) {
        render(template(report))
    } else {
        render();
    }
}

function handleMessage(request, sender) {
    getCurrentTab()
        .then((tab) => {
            if (request.type === 'a11ygator_report' && sender.tab && sender.tab.id === tab.id) {
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
