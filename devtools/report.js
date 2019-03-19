function render(html) {
    const frame = document.getElementById('report');

    if (frame.innerHTML !== html) {
        frame.innerHTML = html;
    }
    window.scroll(0, 0);
}

function template(data) {
    let issues = data
        .slice(0)
        .sort((issue1, issue2) => {
            if (issue1.typeCode !== issue2.typeCode) {
                return parseFloat(issue1.typeCode) - parseFloat(issue2.typeCode);
            }
            return 0;
        });
    return `<ul class="results-list">
        ${issues.map((issue) => `
        <li class="result ${issue.type}" data-selector="${issue.selector}">
            <h2 class="issue-title">${issue.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
            <p class="issue-rule">${issue.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <pre class="issue-code"><code>${(issue.context || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </li>
        `).join('\n')}
    </ul>`;
}

async function handleReport(response) {
    if (!response) {
        return;
    }
    if (response.result) {
        let counts = {
            errorCount: response.result.filter(issue => issue.type === 'error').length,
            warningCount: response.result.filter(issue => issue.type === 'warning').length,
            noticeCount: response.result.filter(issue => issue.type === 'notice').length
        };

        let errorsButtons = document.querySelector('button[value="errors"]');
        let warningsButtons = document.querySelector('button[value="warnings"]');
        let noticesButtons = document.querySelector('button[value="notices"]');

        errorsButtons.setAttribute('data-count', counts.errorCount);
        if (!counts.errorCount) {
            errorsButtons.setAttribute('disabled', '');
        } else {
            errorsButtons.removeAttribute('disabled');
        }
        warningsButtons.setAttribute('data-count', counts.warningCount);
        if (!counts.warningCount) {
            warningsButtons.setAttribute('disabled', '');
        } else {
            warningsButtons.removeAttribute('disabled');
        }
        noticesButtons.setAttribute('data-count', counts.noticeCount);
        if (!counts.noticeCount) {
            noticesButtons.setAttribute('disabled', '');
        } else {
            noticesButtons.removeAttribute('disabled');
        }

        render(template(response.result));
    } else {
        render('<p>Nothing to show.</p>');
    }
}

function handleButtons() {
    let currentSelector = null;
    let hoverSelector = null;

    document.querySelectorAll('nav button').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll(`[data-selector].active`).forEach((element) => element.classList.remove('active'));
            currentSelector = null;
            hoverSelector = null;
            document.body.classList.remove('filter-errors', 'filter-warnings', 'filter-notices');
            if (button.value) {
                document.body.classList.add(`filter-${button.value}`);
            }
        });
    });

    if (chrome.devtools && chrome.devtools.inspectedWindow) {
        document.body.classList.add('inspectable');

        window.addEventListener('focus', () => {
            disabled = false;
        });

        document.addEventListener('click', (event) => {
            let target = event.target.closest('[data-selector]');
            hoverSelector = null;
            if (target) {
                if (currentSelector === target.dataset.selector) {
                    currentSelector = null;
                    target.classList.remove('active');
                } else {
                    document.querySelectorAll(`[data-selector].active`).forEach((element) => element.classList.remove('active'));
                    chrome.devtools.inspectedWindow.eval(`inspect($('${target.dataset.selector}'))`);
                    currentSelector = target.dataset.selector;
                    target.classList.add('active');
                }
            }
        });

        document.addEventListener('mousemove', (event) => {
            if (currentSelector) {
                return;
            }
            let target = event.target.closest('[data-selector]');
            if (target && hoverSelector !== target.dataset.selector) {
                chrome.devtools.inspectedWindow.eval(`inspect($('${target.dataset.selector}'))`);
                hoverSelector = target.dataset.selector;
            }
        });
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
    if (chrome.devtools && chrome.devtools.inspectedWindow) {
        return await getTabById(chrome.devtools.inspectedWindow.tabId);
    }
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
    handleButtons();
    chrome.runtime.onMessage.addListener(handleMessage);
    let report = await sendRequest();
    await handleReport(report);
});
