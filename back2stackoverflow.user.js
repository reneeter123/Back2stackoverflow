// ==UserScript==
// @name         Back2stackoverflow
// @namespace    https://github.com/reneeter123
// @version      1.0.11
// @description  Userscript for redirect to stackoverflow.com from machine-translated sites.
// @author       ReNeeter
// @homepageURL  https://github.com/reneeter123/Back2stackoverflow
// @downloadURL  https://raw.githubusercontent.com/reneeter123/Back2stackoverflow/master/back2stackoverflow.user.js
// @updateURL    https://raw.githubusercontent.com/reneeter123/Back2stackoverflow/master/back2stackoverflow.user.js
// @grant        GM_xmlhttpRequest
// @noframes
// @match        https://qa.1r1g.com/sf/ask/*/
// @match        https://*.answer-id.com/*
// @match        https://ask-ubuntu.ru/questions/*/*
// @match        *://de.askdev.info/questions/*/*
// @match        https://askdev.io/*questions/*/*
// @match        https://askubuntu.ru/questions/*
// @match        https://askvoprosy.com/voprosy/*
// @match        *://bildiredi.com/*
// @match        https://*.bilee.com/*.html
// @match        *://ciupacabra.com/*
// @match        https://code-examples.net/*/q/*
// @match        https://fooobar.com/questions/*/*
// @match        https://qa-stack.pl/*/*/*
// @match        https://qastack.cn/*/*/*
// @match        https://qastack.co.in/*/*/*
// @match        https://qastack.com.br/*/*/*
// @match        https://qastack.com.de/*/*/*
// @match        https://qastack.com.ua/*/*/*
// @match        https://qastack.fr/*/*/*
// @match        https://qastack.id/*/*/*
// @match        https://qastack.in.th/*/*/*
// @match        https://qastack.info.tr/*/*/*
// @match        https://qastack.it/*/*/*
// @match        https://qastack.jp/*/*/*
// @match        https://qastack.kr/*/*/*
// @match        https://qastack.lk/*/*/*
// @match        https://qastack.mx/*/*/*
// @match        https://qastack.net.bd/*/*/*
// @match        https://qastack.ru/*/*/*
// @match        https://qastack.vn/*/*/*
// ==/UserScript==

function getURLLastPart() {
    // Return the last part of the URL
    return location.pathname.split('/').filter(Boolean).pop();
}

async function searchStackoverflow(searchText) {
    // Search with Stack Exchange's API
    return await fetch(`https://api.stackexchange.com/search?intitle=${searchText}&site=stackoverflow`)
        .then(response => response.json())
        .then(json => {
            const item = json.items[0];
            return item ? item.link : `https://stackexchange.com/search?q=${searchText}`;
        });
}

async function redirectToSource() {
    const sourceURL = await (async function () {
        const hostname = location.hostname;
        let selectors;
        let sourceElement;
        switch (true) {
            case 'qa.1r1g.com' == hostname:
            case 'askubuntu.ru' == hostname:
            case hostname.endsWith('bilee.com'):
                // Search using Google Translate
                selectors = {
                    'qa.1r1g.com': '.col a',
                    'askubuntu.ru': '.catalog-container > .block-title',
                    'bilee.com': 'a > .text-uppercase'
                };

                sourceElement = document.querySelector(selectors[Object.keys(selectors).find(value => hostname.endsWith(value))]);

                const postURL = 'https://www.google.com/async/translate?';
                const postHeader = { 'Content-Type': 'application/x-www-form-urlencoded' };
                const postData = `async=translate,sl:auto,tl:en,st:${encodeURIComponent(sourceElement.textContent)},id:0,qc:true,ac:true,_fmt:pc`;

                async function redirectUseTranslator(response) {
                    location.replace(
                        await searchStackoverflow(
                            new DOMParser().parseFromString(response.match(/<.+>/), 'text/html').getElementById('tw-answ-target-text').textContent));
                }
                if (typeof GM_xmlhttpRequest == 'function') {
                    // For Tampermonkey & Violentmonkey
                    GM_xmlhttpRequest({ url: postURL, method: 'POST', headers: postHeader, data: postData, onload: response => redirectUseTranslator(response.response) });
                }
                else {
                    // For Greasemonkey
                    redirectUseTranslator(await fetch(postURL, { method: 'POST', headers: postHeader, body: postData }).then(response => response.text()));
                }

                return;
            case 'askdev.io' == hostname:
                // Send a post request with parameters to the source acquisition page
                sourceElement = document.querySelector('.question-text > .aa-link');

                return await fetch(sourceElement.href,
                    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'show=1' })
                    .then(response => response.text())
                    .then(text => new DOMParser().parseFromString(text, 'text/html').getElementsByClassName('alert-link')[0].href);
            case 'askvoprosy.com' == hostname:
                // Search for part of the URL in Stack Exchange
                return await searchStackoverflow(getURLLastPart());
            case 'code-examples.net' == hostname:
                return `https://stackoverflow.com/questions/${parseInt(getURLLastPart(), 16)}`;
            case 'qa-stack.pl' == hostname:
            case 'qastack.cn' == hostname:
            case 'qastack.co.in' == hostname:
            case 'qastack.com.br' == hostname:
            case 'qastack.com.de' == hostname:
            case 'qastack.com.ua' == hostname:
            case 'qastack.fr' == hostname:
            case 'qastack.id' == hostname:
            case 'qastack.in.th' == hostname:
            case 'qastack.info.tr' == hostname:
            case 'qastack.it' == hostname:
            case 'qastack.jp' == hostname:
            case 'qastack.kr' == hostname:
            case 'qastack.lk' == hostname:
            case 'qastack.mx' == hostname:
            case 'qastack.net.bd' == hostname:
            case 'qastack.ru' == hostname:
            case 'qastack.vn' == hostname:
                // Replace part of the URL of the source
                sourceElement = document.querySelector('.text-muted > a:last-of-type');

                if (sourceElement) {
                    const url = new URL(sourceElement.href);
                    url.pathname = url.pathname.replace(/^\/.+?\//, '/questions/');
                    return url.href;
                }
                else {
                    return;
                }
            default:
                // Select the source element
                selectors = {
                    'answer-id.com': '.v-card__actions > a:nth-of-type(2)',
                    'ask-ubuntu.ru': '.col-sm-4 > .q-source',
                    'de.askdev.info': '.question-text > .a-link',
                    'bildiredi.com': '.footer_question:last-of-type > a',
                    'ciupacabra.com': '.footer_question:last-of-type > a',
                    'fooobar.com': '.question-text > .aa-link'
                };

                sourceElement = document.querySelector(selectors[Object.keys(selectors).find(value => hostname.endsWith(value))]);
                return sourceElement ? sourceElement.href : null;
        }
    })();

    // Determine if the source exists
    if (sourceURL) {
        function redirectIf(isFound) {
            isFound ? location.replace(sourceURL) : alert('Back2stackoverflow:\nSource not found');
        }
        if (typeof GM_xmlhttpRequest == 'function') {
            // For Tampermonkey & Violentmonkey
            GM_xmlhttpRequest({ url: sourceURL, onload: response => redirectIf(response.status != 404) });
        }
        else {
            // For Greasemonkey
            redirectIf(await fetch(sourceURL).then(response => response.ok));
        }
    }
}

'use strict';

redirectToSource();

// For Ajax sites
const observer = new MutationObserver(redirectToSource);
observer.observe(document.getElementsByTagName('title')[0], { childList: true });