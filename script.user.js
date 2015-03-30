// ==UserScript==
// @name        Steamgifts Collector
// @description Collects unlisted gifts from SteamGifts.com
// @author      Kodek
// @namespace   csg
// @include     *steamgifts.com/discussions*
// @version     1.0.6
// @downloadURL https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @updateURL   https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @run-at      document-end
// @grant       none
// ==/UserScript==

var orgTitle = "";

var forumUrls = [];
var checkedForumUrls = 0;

var giftUrls = [];
var checkedGiftUrls = 0;

var validGiftUrls = [];
var invalidGiftUrls = [];

$(document).ready(function() {
    orgTitle = document.title;
    document.title = orgTitle + " (collecting)";

    scanForTopics();
    asyncScanForGifts();
});

function scanForTopics() {
    console.log("Scanning for topics...");

    for (var i = 0; i < document.links.length; i++) {
        if (document.links[i].hostname === location.hostname) {
            var url = document.links[i].href;

            if (url.indexOf('/discussion/') >= 0 && !containsString(forumUrls, url)) {
                forumUrls.push(url);
            }
        }
    }

    console.log("Scanned " + forumUrls.length + " topics...");
}

function asyncScanForGifts() {
    console.log("Scanning for gifts...");

    for (var i = 0; i < forumUrls.length; i++) {
        $.ajax({
            url : forumUrls[i],
            success : function (source) {
                var urls = findUrls(source);

                for (var i = 0; i < urls.length; i++) {
                    var url = urls[i];

                    if (url.indexOf('/giveaway/') >= 0 && !containsString(giftUrls, url)) {
                        giftUrls.push(url);
                    }
                }
            },
            complete: function() {
                checkedForumUrls++;

                if (checkedForumUrls >= forumUrls.length) {
                    onGiftScanComplete();
                }
            }
        });
    }
}

function onGiftScanComplete() {
    console.log("Scanned " + giftUrls.length + " gifts...");

    asyncScanForValidGifts();
}

function asyncScanForValidGifts() {
    console.log("Validating gifts...");

    for (var i = 0; i < giftUrls.length; i++) {
        $.ajax({
            url : giftUrls[i],
            success : function (source) {
                if (isValidGift(source)) {
                    validGiftUrls.push(this.url);
                } else {
                    invalidGiftUrls.push(this.url);
                }
            },
            complete: function() {
                checkedGiftUrls++;

                if (checkedGiftUrls >= giftUrls.length) {
                    onValidGiftScanComplete();
                }
            }
        });
    }
}

function onValidGiftScanComplete() {
    console.log("Validated " + validGiftUrls.length + " gifts...");

    document.title = orgTitle + " (done)";

    var linksWindow = window.open();

    linksWindow.document.write("<title>Collected Gifts - " + orgTitle + "</title>");
    linksWindow.document.write("<h1>Valid gifts (" + validGiftUrls.length + "):</h1><br>");

    for (var i = 0; i < validGiftUrls.length; i++) {
        linksWindow.document.write("<a href='" + validGiftUrls[i] + "'><img src='" + validGiftUrls[i] + "/signature.png'>" + "</a>");

        if (i % 2 == 1) {
            linksWindow.document.write("<br>");
        }
    }

    linksWindow.document.write("<h1>Invalid gifts (" + invalidGiftUrls.length + "):</h1><br>");

    for (var i = 0; i < invalidGiftUrls.length; i++) {
        linksWindow.document.write("<a href='" + invalidGiftUrls[i] + "'>" + invalidGiftUrls[i] + "</a><br>");
    }
}

function isValidGift(source) {
    // Contributor Level Required check
    if (source.indexOf('featured__column--contributor-level--negative') >= 0) {
        return false;
    }
    
    // Exists in Account check (TODO: change this)
    if (source.indexOf('Exists in Account') >= 0) {
        return false;
    }

    // Not Enough Points check (as valid gift)
    if (source.indexOf('sidebar__error') >= 0) {
        return true;
    }

    // Already Entered check
    if (source.indexOf('sidebar__entry-insert is-hidden') >= 0) {
        return false;
    }

    // No Entry check
    if (source.indexOf('entry_insert') == -1) {
        return false;
    }

    return true;
}

function containsString(array, text) {
    var i = array.length;

    while (i--) {
        if (array[i].toUpperCase() === text.toUpperCase()) {
            return true;
        }
    }

    return false;
}

function findUrls(text) {
    var source = (text || '').toString();
    var urlArray = [];
    var matchArray;

    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

    while((matchArray = regexToken.exec(source)) !== null) {
        var token = matchArray[0];

        urlArray.push(token);
    }

    return urlArray;
}
