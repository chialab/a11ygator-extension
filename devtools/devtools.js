var browser = browser || chrome;

if (browser.devtools.panels.elements) {
    browser.devtools.panels.elements.createSidebarPane('A11ygator', (sidebar) => {
        sidebar.setPage('/devtools/report.html');
    });
}
