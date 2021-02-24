// ==UserScript==
// @name         Back2stackoverflow
// @namespace    https://github.com/reneeter123
// @version      1.0.4
// @description  Userscript for redirect to stackoverflow.com from machine-translated sites.
// @author       ReNeeter
// @homepageURL  https://github.com/reneeter123/Back2stackoverflow
// @downloadURL  https://raw.githubusercontent.com/reneeter123/Back2stackoverflow/master/back2stackoverflow.user.js
// @updateURL    https://raw.githubusercontent.com/reneeter123/Back2stackoverflow/master/back2stackoverflow.user.js
// @noframes
// @match        https://*.answer-id.com/*
// @match        https://ask-ubuntu.ru/questions/*/*
// @match        *://de.askdev.info/questions/*/*
// @match        https://askdev.io/*questions/*/*
// @match        https://askvoprosy.com/voprosy/*
// @match        *://bildiredi.com/*
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

async function redirectToSource() {
    const sourceURL = await (async function () {
        const hostname = location.hostname;
        let sourceElement;
        switch (hostname) {
            case 'askdev.io':
                sourceElement = document.querySelector('.question-text > .aa-link');

                return await fetch(sourceElement.href,
                    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'show=1' })
                    .then(response => response.text())
                    .then(text => new DOMParser().parseFromString(text, 'text/html').getElementsByClassName('alert-link')[0].href);
            case 'askvoprosy.com':
                const urlLastPart = location.pathname.split('/').filter(Boolean).pop();

                return await fetch(`https://api.stackexchange.com/search?intitle=${urlLastPart}&site=stackoverflow`)
                    .then(response => response.json())
                    .then(json => {
                        const item = json.items[0];
                        return item ? item.link : `https://stackexchange.com/search?q=${urlLastPart}`;
                    });
            case 'qa-stack.pl':
            case 'qastack.cn':
            case 'qastack.co.in':
            case 'qastack.com.br':
            case 'qastack.com.de':
            case 'qastack.com.ua':
            case 'qastack.fr':
            case 'qastack.id':
            case 'qastack.in.th':
            case 'qastack.info.tr':
            case 'qastack.it':
            case 'qastack.jp':
            case 'qastack.kr':
            case 'qastack.lk':
            case 'qastack.mx':
            case 'qastack.net.bd':
            case 'qastack.ru':
            case 'qastack.vn':
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
                const selectors = {
                    'answer-id.com': '.v-card__actions > a:nth-of-type(2)',
                    'ask-ubuntu.ru': '.col-sm-4 > .q-source',
                    'de.askdev.info': '.question-text > .a-link',
                    'bildiredi.com': '.footer_question:last-of-type > a',
                    'fooobar.com': '.question-text > .aa-link'
                };

                sourceElement = document.querySelector(selectors[Object.keys(selectors).find(value => hostname.endsWith(value))]);
                return sourceElement ? sourceElement.href : null;
        }
    })();

    if (sourceURL) location.replace(sourceURL);
}

'use strict';

redirectToSource();

// For Ajax sites
const observer = new MutationObserver(redirectToSource);
observer.observe(document.getElementsByTagName('title')[0], { childList: true });