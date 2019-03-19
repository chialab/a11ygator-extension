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

function toReport(results) {
    let res = results
        .filter((report) => report.selector)
        .map((report) => {
            let data = {
                code: report.code,
                message: report.message,
                type: report.type,
                element: $(report.selector),
            }
            data.__proto__ = null;
            return data;
        });
    res.__proto__ = null;
    return res;
}

chrome.devtools.panels.elements.createSidebarPane('A11ygator', (sidebar) => {
    sidebar.setPage('devtools/report.html');
});
