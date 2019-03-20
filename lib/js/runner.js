(() => {
    if (window.a11ygator) {
        return;
    }

    let lastResult;
    let lastError;
    let timeout;
    let settings = {};

    function isOnlySiblingOfType(element, siblings) {
        const siblingsOfType = siblings.filter((sibling) => {
            return (sibling.tagName === element.tagName);
        });
        return (siblingsOfType.length <= 1);
    }

    function buildElementIdentifier(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        let identifier = element.tagName.toLowerCase();
        if (!element.parentNode) {
            return identifier;
        }
        const siblings = [...element.parentNode.childNodes].filter((node) => node.nodeType === window.Node.ELEMENT_NODE);
        const childIndex = siblings.indexOf(element);
        if (!isOnlySiblingOfType(element, siblings) && childIndex !== -1) {
            identifier += `:nth-child(${childIndex + 1})`;
        }
        return identifier;
    }

    function getCssSelectorForElement(element, selectorParts = []) {
        if (element.nodeType === window.Node.ELEMENT_NODE) {
            const identifier = buildElementIdentifier(element);
            selectorParts.unshift(identifier);
            if (!element.id && element.parentNode) {
                return getCssSelectorForElement(element.parentNode, selectorParts);
            }
        }
        return selectorParts.join(' > ');
    }

    const ISSUE_MAP = {
        1: 'error',
        2: 'warning',
        3: 'notice'
    };

    function innerRun() {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            let counts = {
                errors: 0,
                warnings: 0,
                notices: 0,
            };
            try {
                let issues = await new Promise((resolve, reject) => {
                    window.HTMLCS.process(settings.standard || 'WCAG2AA', document, (error) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(window.HTMLCS.getMessages());
                    });
                });
                issues.sort((issue1, issue2) => {
                    if (issue1.type < issue2.type) {
                        return -1;
                    } else if (issue1.type > issue2.type) {
                        return 1;
                    }
                    return 0;
                });
                issues.forEach((issue) => {
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
                });
                lastResult = issues;
                lastError = null;
            } catch (err) {
                lastError = err;
                lastResult = null;
            }
            try {
                chrome.runtime.sendMessage({
                    type: 'allygator_report',
                    result: lastResult && lastResult
                        .slice(0, 100)
                        .map((issue) => ({
                            code: issue.code,
                            context: issue.element.outerHTML,
                            message: issue.msg,
                            type: ISSUE_MAP[issue.type] || 'unknown',
                            typeCode: issue.type,
                            selector: getCssSelectorForElement(issue.element)
                        })),
                    error: lastError,
                    counts: counts,
                });
            } catch (error) {
                //
            }
        }, 1000);
    }

    let config = {
        attributes: true,
        childList: true,
        subtree: true
    };
    let observer;

    window.a11ygator = {
        run: () => {
            if (!observer) {
                observer = new MutationObserver(innerRun);
                observer.observe(document.body, config);
            }
            innerRun();
        },
        settings: settings,
        set(options) {
            Object.assign(settings, options);
            innerRun();
        },
        get result() {
            return lastError || lastResult;
        },
    };

    innerRun();
})();