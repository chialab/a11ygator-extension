<p align="center">
    <img src="resources/icon.png" width="100">
</p>
<h1 align="center">A11ygator</h1>
<p align="center">
    <a href="https://chrome.google.com/webstore/detail/a11ygator/imfmlpemomjmfncnmkjdeeinbkichaio">Chrome extension</a> |
    <a href="https://www.w3.org/WAI/standards-guidelines/wcag/">WCAG home</a> |
    <a href="https://github.com/chialab/a11ygator-extension">Source</a> |
    <a href="https://www.chialab.io">Authors</a>
</p>

Validate the accessibility of your website against W3C's Web Content Accessibility Guidelines.

A11ygator is a free tool for web developers to check compliance with the WCAG rules. Once the extension has started, it will observe for content changes in the HTML document and it will generate a report with errors, warnings and notices.

Thanks to the integration with DevTools, it is easy to inspect elements and quickly update CSS rules or HTML attributes in order to match the required WCAG standard.

### Quick validation

Get a quick report of the page from the extension popup.

![Popup example](./store/popup.jpg)

### DevTools

For a complete report of the page, use the Chrome DevTools section (`Elements > A11ygator`). You can inspect and live debug accessibility issues.

![Devtools example](./store/inspect.gif)

### Change the standard to validate

You can change the WCAG standard for validation (default is WCAG2AA). Right-click the extension icon and select `Options`.

## Development

Check out the repository and [load the unpacked extension](https://developer.chrome.com/extensions/getstarted).

### Build

#### Chrome extension

Create a `.crx` file:

* Navigate to `chrome://extensions/`.
* Click "Pack extension" and browse to the repository.
* Click the "Pack extension" button.

Build for publication:

* Run `make pack` in the root of the project

### Publish

#### Chrome store

* Navigate to [https://chrome.google.com/webstore/developer/dashboard](https://chrome.google.com/webstore/developer/dashboard).
* Edit the A11ygator item.
* Upload the zip file.
* Publish.

## Credits

A11ygator runs on the top of [HTML Code Sniffer](https://github.com/squizlabs/HTML_CodeSniffer) powered by Squiz Labs.

## License

A11ygator is released under the [MIT](./LICENSE) license.