<h1>
    <img src="resources/icon.png" width="50" style="margin-right: 10px;"> A11ygator
</h1>

Validate the accessibility of your website using A11ygator against W3C's Web Content Accessibility Guidelines.

### Quick validation

Get a quick report of the page from the extension popup.

### DevTools

For a complete report of the page, use the Chrome DevTools section (`Elements > A11ygator`). You can inspect and live debug accessibility issues.

## Install


TODO

## Development

Check out the repository and [load the unpacked extension](https://developer.chrome.com/extensions/getstarted).

### Build

Create a `.crx` file:

* Navigate to `chrome://extensions/`
* Click "Pack extension" and browse to the repository
* Click the "Pack extension" button

Build for publication:

* Run `make pack` in the root of the project

## Publish

* Navigate to [https://chrome.google.com/webstore/developer/dashboard](https://chrome.google.com/webstore/developer/dashboard)

## Credits

A11ygator runs on the top of [HTML Code Sniffer](https://github.com/squizlabs/HTML_CodeSniffer) powered by Squiz Labs.

## License

MIT