var browser = browser || chrome;

browser.devtools.panels.elements.createSidebarPane('A11ygator', (sidebar) => {
    sidebar.setPage('devtools/report.html');
});
