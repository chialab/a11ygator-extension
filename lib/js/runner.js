(() => {
    if (window.a11ygator) {
        return;
    }

    var browser = browser || chrome;

    let settings = {};

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

    async function innerRun() {
        try {
            let counts = {
                errors: 0,
                warnings: 0,
                notices: 0,
            };
            let issues = await new Promise((resolve, reject) => {
                window.HTMLCS.process(settings.standard || 'WCAG2AA', document, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(window.HTMLCS.getMessages());
                });
            });
            issues = issues
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
                        selector: getCssSelectorForElement(issue.element)
                    };
                })
                .sort((issue1, issue2) => {
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

    window.a11ygator = {
        run: async (run = true) => {
            if (!observer && run) {
                let timeout;
                observer = new MutationObserver(() => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        lastResult = null;
                        window.a11ygator.run();
                    }, 1000);
                });
                observer.observe(document.documentElement, config);
            }

            let res;
            if (lastResult) {
                res = lastResult;
            } else if (currentRun) {
                res = await currentRun;
            } else if (run) {
                currentRun = innerRun();
                lastResult = res = await currentRun;
                currentRun = null;
            }

            try {
                browser.runtime.sendMessage(Object.assign({
                    type: 'allygator_report',
                }, res));
            } catch (error) {
                //
            }
        },
        settings: settings,
        set(options) {
            Object.assign(settings, options);
            innerRun();
        },
    };
})();