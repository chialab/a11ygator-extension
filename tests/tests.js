'use strict';
(() => {

let testList = document.getElementById('test-list');

/*
* Diplaying a simple test case both on #test-list and in the console
*/
const test = (what, result) => {
    let resultString = '<h2 class="test-text">' + what + '</h2><br>'; 
    let testLi = document.createElement('li');
    
    console.log(what);
    if (result) {
        console.log('%c SUCCEEDED ', 'background:rgb(50, 180, 50); color: #fff');
        resultString += '<span class="good test-result">SUCCEEDED</span>';
    }
    else {
        console.log('%c FAILED ', 'background:rgb(180, 50, 50); color: #fff');
        resultString += '<span class="bad test-result">FAILED</span>';
    }
    console.log();
    
    testLi.innerHTML = resultString;
    testList.appendChild(testLi);
}


// TODO test cases
test('Test true', true);
test('Test false', false);


})();
