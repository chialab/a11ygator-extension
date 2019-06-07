'use strict';

// Elements for testing
let _ol = document.createElement('ol');
let _li1 = document.createElement('li');
let _li2 = document.createElement('li');
let _li3 = document.createElement('li');

_ol.appendChild(_li1)
_ol.appendChild(_li2)
_ol.appendChild(_li3)


/**
* Global variables
*/
test('ISSUE_MAP is correct', ISSUE_MAP[1] === 'error' && ISSUE_MAP[2] === 'warning' && ISSUE_MAP[3] === 'notice');

/**
* buildElementIdentifier
*/
test('buildElementIdentifier can build a simple id', buildElementIdentifier(_ol) === 'OL');
test('buildElementIdentifier can create an id for an element with no sibling inside an other element', buildElementIdentifier(_li1) === 'LI');
test('buildElementIdentifier can create an id for an element with a sibling inside an other element', buildElementIdentifier(_li2) === 'LI:nth-child(2)');
test('buildElementIdentifier can create an id for an element with more than one sibling  inside an other element', buildElementIdentifier(_li3) === 'LI:nth-child(3)');

/**
* getCssSelectorForElement
*/
test('getCssSelectorForElement can create a simple selector', getCssSelectorForElement(_ol) === 'OL')
test('getCssSelectorForElement can create a selector for an element with no sibling inside an other element', getCssSelectorForElement(_li1) === 'OL > LI');
test('getCssSelectorForElement can create a selector for an element with a sibling inside an other element', getCssSelectorForElement(_li2) === 'OL > LI:nth-child(2)');
test('getCssSelectorForElement can create a selector for an element with more than one sibling  inside an other element', getCssSelectorForElement(_li3) === 'OL > LI:nth-child(3)');


console.log();
