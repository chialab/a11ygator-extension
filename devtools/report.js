function render(html) {
    const frame = document.getElementById('report');

    if (frame.innerHTML !== html) {
        frame.innerHTML = html;
    }
    window.scroll(0, 0);
}

function template(issues) {
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

function setButtonsState(counts) {
    let errorsButtons = document.querySelector('button[value="errors"]');
    let warningsButtons = document.querySelector('button[value="warnings"]');
    let noticesButtons = document.querySelector('button[value="notices"]');

    errorsButtons.setAttribute('data-count', counts.errors);
    if (!counts.errors) {
        errorsButtons.setAttribute('disabled', '');
    } else {
        errorsButtons.removeAttribute('disabled');
    }
    warningsButtons.setAttribute('data-count', counts.warnings);
    if (!counts.warnings) {
        warningsButtons.setAttribute('disabled', '');
    } else {
        warningsButtons.removeAttribute('disabled');
    }
    noticesButtons.setAttribute('data-count', counts.notices);
    if (!counts.notices) {
        noticesButtons.setAttribute('disabled', '');
    } else {
        noticesButtons.removeAttribute('disabled');
    }
}

async function handleReport(response) {
    if (!response) {
        return;
    }
    if (response.result) {
        setButtonsState(response.counts);
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
                    chrome.devtools.inspectedWindow.eval(`inspect(document.querySelector('${target.dataset.selector}'))`);
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
                chrome.devtools.inspectedWindow.eval(`inspect(document.querySelector('${target.dataset.selector}'))`);
                hoverSelector = target.dataset.selector;
            }
        });
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

chrome.runtime.onMessage.addListener(handleMessage);

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.id === chrome.devtools.inspectedWindow.tabId) {
        setButtonsState({
            errors: 0,
            warnings: 0,
            notices: 0,
        });
        render('');
    }
    if (changeInfo.status == 'complete' && tab.id === chrome.devtools.inspectedWindow.tabId) {
        sendRequest(await getCurrentTab());
    }
});

window.addEventListener('load', async () => {
    handleButtons();
    sendRequest(await getCurrentTab());
});
