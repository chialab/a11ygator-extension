(() => {
    const form = document.querySelector('form');

    browser.storage.local.get({
        standard: 'WCAG2AA',
    }, (settings) => {
        for (let key in settings) {
            form.elements[key].value = settings[key];
        }
    });

    form.addEventListener('change', () => {
        let data = {
            standard: form.elements.standard.value,
        };

        browser.storage.local.set(data, () => {});
    });
})();