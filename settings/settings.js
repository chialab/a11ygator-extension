(() => {
    const form = document.querySelector('form');

    chrome.storage.local.get({
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

        chrome.storage.local.set(data, () => {});
    });
})();