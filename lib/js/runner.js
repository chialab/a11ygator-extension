var browser = browser || chrome;

if (!DocumentFragment.prototype.getElementsByTagName) {
    DocumentFragment.prototype.getElementsByTagName = function(tagName) {
        return this.querySelectorAll(tagName);
    };
}

function buildElementIdentifier(element) {
    let identifier = element.tagName;
    if (element.parentNode && element.parentNode.tagName) {
        let child = element;
        let index = 0;
        while ((child = child.previousElementSibling) != null) index++;
        if (index !== 0) {
            identifier += `:nth-child(${index + 1})`;
        }
    }
    return identifier;
}

function getCssSelectorForElement(element) {
    let identifier = buildElementIdentifier(element);
    let selectorParts = [identifier];
    let parent = element.parentNode;
    while (parent && parent.tagName) {
        selectorParts.unshift(buildElementIdentifier(parent));
        parent = parent.parentNode;
    }
    return selectorParts.join(' > ');
}

const ISSUE_MAP = {
    1: 'error',
    2: 'warning',
    3: 'notice'
};

function collectRoots(element = document, roots = [], parents = []) {
    if (element.shadowRoot instanceof DocumentFragment) {
        parents.push(element);
        roots.push([element.shadowRoot, parents]);
        element = element.shadowRoot;
        element.documentElement = element.documentElement || element;
    } else if (element.nodeType === Node.DOCUMENT_NODE) {
        roots.push([element, parents.slice(0)]);
    }
    const childNodes = element.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        let node = childNodes[i];
        if (node.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }
        collectRoots(node, roots, parents.slice(0));
    }
    return roots;
}

async function innerRun(settings) {
    try {
        const counts = {
            errors: 0,
            warnings: 0,
            notices: 0,
        };
        const roots = collectRoots();
        const issues = (await Promise.all(
            roots.map(([root]) => new Promise((resolve, reject) => {
                HTMLCS.process(settings.standard || 'WCAG2AA', root, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(HTMLCS.getMessages());
                });
            }))
        )).map((list, index) => {
            const [, parents] = roots[index];
            return list
                .filter((issue) => !(issue.element instanceof DocumentFragment))
                .filter((issue) => !(issue.element.nodeType === Node.DOCUMENT_NODE))
                .map((issue) => {
                    switch (issue.type) {
                        case 1:
                            counts.errors++;
                            break;
                        case 2:
                            counts.warnings++;
                            break;
                        case 3:
                            counts.notices++;
                            break;
                    }
                    return {
                        code: issue.code,
                        context: issue.element.outerHTML,
                        message: issue.msg,
                        type: ISSUE_MAP[issue.type] || 'unknown',
                        typeCode: issue.type,
                        selector: [...parents, issue.element].map(getCssSelectorForElement).join(' /deep/ ')
                    };
                })
        }).reduce((acc, list) => {
            acc.push(...list);
            return acc;
        }, []).sort((issue1, issue2) => {
            if (issue1.typeCode < issue2.typeCode) {
                return -1;
            } else if (issue1.typeCode > issue2.typeCode) {
                return 1;
            }
            return 0;
        });
        return {
            result: issues,
            counts: counts,
        };
    } catch (err) {
        return {
            error: err,
        };
    }
}

let config = {
    attributes: true,
    childList: true,
    subtree: true
};
let observer;
let currentRun;
let lastResult;

const a11ygator = {
    run: async (run, refresh) => {
        run = run !== false;

        if (!observer && run) {
            let timeout;
            observer = new MutationObserver(() => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    lastResult = null;
                    a11ygator.run();
                }, 1000);
            });
            observer.observe(document.documentElement, config);
        }

        let res;
        if (refresh || (run && !currentRun && !lastResult)) {
            currentRun = innerRun(a11ygator.settings);
            lastResult = res = await currentRun;
            currentRun = null;
        } else if (currentRun) {
            res = await currentRun;
        } else {
            res = lastResult;
        }

        try {
            browser.runtime.sendMessage(Object.assign({
                type: 'a11ygator_report',
            }, res));
        } catch (error) {
            //
        }
    },
    settings: {},
};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'a11ygator_request') {
        if (request.settings) {
            a11ygator.settings = request.settings;
        }
        a11ygator.run(request.run, request.refresh);
        sendResponse(true);
    }
});