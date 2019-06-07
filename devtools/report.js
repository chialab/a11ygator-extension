function render(...nodes) {
    const frame = document.getElementById('report');

    frame.childNodes.forEach((node) => {
        frame.removeChild(node);
    });
    nodes.forEach((node) => {
        frame.appendChild(node);
    });
    window.scroll(0, 0);
}

function template(issues) {
    const ul = document.createElement('ul');
    ul.classList.add('results-list');

    issues.forEach((issue) => {
        const li = document.createElement('li');
        li.classList.add('result', issue.type);
        li.setAttribute('data-selector', issue.selector);

        const h2 = document.createElement('h2');
        h2.classList.add(`issue-title`);
        h2.innerText = issue.message;

        const p = document.createElement('p');
        p.classList.add('issue-role');
        p.innerText = issue.code;

        const pre = document.createElement('pre');
        pre.classList.add('issue-code');

        const code = documen.createElement('code');
        code.innerText = issue.context || '';

        pre.appendChild(code);
        li.appendChild(h2);
        li.appendChild(p);
        li.appendChild(pre);

        ul.appendChild(li);
    });

    return ul;
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
        const p = document.createElement('p');
        p.innerText = 'Nothing to show.';
        render(p);
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

    if (browser.devtools && browser.devtools.inspectedWindow) {
        document.body.classList.add('inspectable');

        window.addEventListener('focus', () => {
            disabled = false;
        });

        document.addEventListener('click', async (event) => {
            let target = event.target.closest('[data-selector]');
            hoverSelector = null;
            if (target) {
                if (currentSelector === target.dataset.selector) {
                    currentSelector = null;
                    target.classList.remove('active');
                } else {
                    document.querySelectorAll(`[data-selector].active`).forEach((element) => element.classList.remove('active'));
                    currentSelector = target.dataset.selector;
                    target.classList.add('active');
                    await inspect(currentSelector);
                }
            }
        });

        document.addEventListener('mousemove', async (event) => {
            if (currentSelector) {
                return;
            }
            let target = event.target.closest('[data-selector]');
            if (target && hoverSelector !== target.dataset.selector) {
                hoverSelector = target.dataset.selector;
                await inspect(hoverSelector);
            }
        });
    }
}

function handleMessage(request) {
    getCurrentTab()
        .then((tab) => {
            if (request.type === 'a11ygator_devtools_report' && request.tab.id === tab.id) {
                handleReport(request);
            }
        })
        .catch(() => {});
    return true;
}

browser.runtime.onMessage.addListener(handleMessage);

if (browser.devtools.inspectedWindow) {
    if (browser.devtools.inspectedWindow.onResourceAdded) {
        browser.devtools.inspectedWindow.onResourceAdded.addListener(async () => {
            handleButtons();
            let tab = await getCurrentTab();
            sendRequest(tab, true, true);
        });
    }

    if (browser.devtools.inspectedWindow.onResourceContentCommitted) {
        browser.devtools.inspectedWindow.onResourceContentCommitted.addListener(async () => {
            handleButtons();
            let tab = await getCurrentTab();
            sendRequest(tab, true, true);
        });
    }
}

if (browser.tabs) {
    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (tab.id === browser.devtools.inspectedWindow.tabId) {
            setButtonsState({
                errors: 0,
                warnings: 0,
                notices: 0,
            });
            render();
        }
        if (changeInfo.status == 'complete' && tab.id === browser.devtools.inspectedWindow.tabId) {
            sendRequest(await getCurrentTab());
        }
    });
}

window.addEventListener('load', async () => {
    handleButtons();
    let tab = await getCurrentTab();
    sendRequest(tab);
});
