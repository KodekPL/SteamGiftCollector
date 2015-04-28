// ==UserScript==
// @name        Steamgifts Collector
// @description Collects unlisted gifts from SteamGifts.com
// @author      Kodek
// @namespace   csg
// @include     *steamgifts.com/discussions*
// @version     1.5.1
// @downloadURL https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @updateURL   https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @run-at      document-end
// @grant       none
// ==/UserScript==

// Is running?
var isRunning = false;

// Settings
var scanPagesCount = 4;

// Collected forum pages
var forumPageUrls = [];
var checkedForumPageUrls = 0;

// Collected topics
var topicUrls = [];
var checkTopicUrls = 0;

// Collected gifts
var giftUrls = [];
var checkedTopicsForGiftsUrls = 0;
var checkedGiftUrls = 0;

// Validated gifts
var validGiftUrls = []; // Array
var invalidGiftUrls = {}; // Map (String <-> Array)

// Progress data
var orgTitle = "";

var avegareGiftsPerTopic = 3;
var foundTopicPages = 0;

var actionsDone = 0;
var actionsEstimated = 0;

////////////////////
////////////////////
/// BUTTON SETUP ///
////////////////////
////////////////////
$(document).ready(function() {
    var sidebar = document.getElementsByClassName('sidebar')[0];

    var initButton = document.createElement('div');

    var buttonStatus = document.createElement('div');
    buttonStatus.setAttribute('id', 'collector-status');
    buttonStatus.innerHTML = 'Collect All Gifts';

    initButton.innerHTML = '<div id="collector-button" class="sidebar__action-button">' + buttonStatus.outerHTML + '</div>';

    sidebar.appendChild(initButton);

    initButton.onclick = function() {
        initScan();
    };
});

///////////////////////////
///////////////////////////
/// STEP 1 - START SCAN ///
///////////////////////////
///////////////////////////

function initScan() {
    if (isRunning) {
        return;
    }

    isRunning = true;

    orgTitle = document.title;

    disableButton();
    updateScanStatusData();

    asyncScanPagesForTopics();
}

////////////////////////////////////
////////////////////////////////////
/// STEP 2 - COLLECT FORUM PAGES ///
////////////////////////////////////
////////////////////////////////////

function asyncScanPagesForTopics() {
    console.log("Scanning pages for topics...");

    for (var i = 1; i <= scanPagesCount; i++) {
        $.ajax({
            url : "http://www.steamgifts.com/discussions/search?page=" + i,
            success : function (source) {
                // TODO: Collect topic urls better
                var fixedSource = source.replace(/href="/g, "http://www.steamgifts.com/");
                var urls = findUrls(fixedSource);

                for (var i = 0; i < urls.length; i++) {
                    var url = urls[i];

                    if (url.indexOf('/discussion/') >= 0 && !containsString(forumPageUrls, url)) {
                        forumPageUrls.push(url);

                        updateScanStatusData();
                    }
                }

                checkedForumPageUrls++;

                if (checkedForumPageUrls >= scanPagesCount) {
                    asyncScanForTopicPages();
                }
            }
        });
    }
}

/////////////////////////////////////
/////////////////////////////////////
/// STEP 3 - COLLECT FORUM TOPICS ///
/////////////////////////////////////
/////////////////////////////////////

function asyncScanForTopicPages() {
    console.log("Scanned " + scanPagesCount + " pages and found " + forumPageUrls.length + " topics...");
    console.log("Scanning for topic pages...");

    for (var i = 0; i < forumPageUrls.length; i++) {
        $.ajax({
            url : forumPageUrls[i],
            success : function (source) {
                var pagesCount = 0;

                // Scan for links to next pages
                for (var i = 1; i <= 100; i++) {
                    if (source.indexOf("search?page=" + i) == -1) {
                        pagesCount = i - 1;
                        break;
                    }
                }

                // If found non, set to the first page
                if (pagesCount == 0) {
                    pagesCount = 1;
                }

                foundTopicPages += pagesCount;

                // Collect links to topic pages
                for (var i = 1; i <= pagesCount; i++) {
                    var topicPageUrl = this.url + "/search?page=" + i;

                    if (!containsString(topicUrls, topicPageUrl)) {
                        topicUrls.push(topicPageUrl);

                        updateScanStatusData();
                    }
                }

                checkTopicUrls++;

                if (checkTopicUrls >= forumPageUrls.length) {
                    asyncScanForGifts();
                }
            }
        });
    }
}

//////////////////////////////////////////
//////////////////////////////////////////
/// STEP 4 - COLLECT GIFTS FROM TOPICS ///
//////////////////////////////////////////
//////////////////////////////////////////

function asyncScanForGifts() {
    console.log("Scanned " + topicUrls.length + " topic pages...");
    console.log("Scanning for gifts...");

    for (var i = 0; i < topicUrls.length; i++) {
        $.ajax({
            url : topicUrls[i],
            success : function (source) {
                var urls = findUrls(source);

                for (var i = 0; i < urls.length; i++) {
                    var url = urls[i];

                    if (url.indexOf('/giveaway/') >= 0 && url.indexOf('steamgifts.com') >= 0 && !containsString(giftUrls, url)) {
                        // Remove anything past gift id in the url
                        giftUrls.push(url.split('/', 6).join('/'));

                        updateScanStatusData();
                    }
                }

                checkedTopicsForGiftsUrls++;

                if (checkedTopicsForGiftsUrls >= topicUrls.length) {
                    asyncScanForValidGifts();
                }
            }
        });
    }
}

/////////////////////////////////////////
/////////////////////////////////////////
/// STEP 5 - VALIDATE COLLECTED GIFTS ///
/////////////////////////////////////////
/////////////////////////////////////////

function asyncScanForValidGifts() {
    console.log("Scanned " + giftUrls.length + " gifts...");

    avegareGiftsPerTopic = giftUrls.length / (scanPagesCount * 100);

    console.log("Average gifts per topic page: " + avegareGiftsPerTopic);
    console.log("Validating gifts...");

    for (var i = 0; i < giftUrls.length; i++) {
        $.ajax({
            url : giftUrls[i],
            success : function (source) {
                var validResult = isValidGift(source);

                if (validResult == null) {
                    // Add to valid gifts
                    validGiftUrls.push(this.url);

                    updateScanStatusData();
                } else {
                    // Add to invalid gifts with result

                    var invalidArray = [];

                    if (invalidGiftUrls[validResult] != null) {
                        invalidArray = invalidGiftUrls[validResult];
                    }

                    invalidArray.push(this.url);
                    invalidGiftUrls[validResult] = invalidArray;

                    updateScanStatusData();
                }

                checkedGiftUrls++;

                if (checkedGiftUrls >= giftUrls.length) {
                    onValidGiftScanComplete();
                }
            },
            error: function() {
                // Add to invalid gifts as error

                var invalidArray = [];

                if (invalidGiftUrls['Errors'] != null) {
                    invalidArray = invalidGiftUrls['Errors'];
                }

                invalidArray.push(this.url);
                invalidGiftUrls['Errors'] = invalidArray;

                updateScanStatusData();

                checkedGiftUrls++;

                if (checkedGiftUrls >= giftUrls.length) {
                    onValidGiftScanComplete();
                }
            }
        });
    }
}

///////////////////////////////
///////////////////////////////
/// STEP 6 - DISPLAY RESULT ///
///////////////////////////////
///////////////////////////////

function onValidGiftScanComplete() {
    console.log("Validated " + validGiftUrls.length + " gifts...");

    document.title = orgTitle + " (done)";

    document.getElementsByClassName('page__inner-wrap')[0].remove();

    var contentDiv = document.getElementsByClassName('page__outer-wrap')[0];
    var content = "";

    content += ("<title>Collected Gifts - " + orgTitle + "</title>");

    // Heading - Valid Gifts
    content += ("<div class='page__heading'><div class='page__heading__breadcrumbs'>Valid Gifts (" + validGiftUrls.length + ")</div></div>");

    for (var i = 0; i < validGiftUrls.length; i++) {
        content += ("<a href='" + validGiftUrls[i] + "'><img src='" + validGiftUrls[i] + "/signature.png'>" + "</a>");
    }

    // Invalid Gifts
    for (var key in invalidGiftUrls) {
        if (invalidGiftUrls.hasOwnProperty(key)) {
            var invalidArray = invalidGiftUrls[key];

            content += ("<div class='page__heading'><div class='page__heading__breadcrumbs'>Invalid gifts - " + key + " (" + invalidArray.length + ")</div></div><br>");

            for (var i = 0; i < invalidArray.length; i++) {
                content += ("<a class='giveaway__username' href='" + invalidArray[i] + "'>" + invalidArray[i] + "</a><br>");
            }

            content += "<br>";
        }
    }

    contentDiv.innerHTML = content;
}

/////////////
/////////////
/// UTILS ///
/////////////
/////////////

// Disable of scan button
function disableButton() {
    var button = document.getElementById('collector-button');

    button.className = 'sidebar__action-button is-disabled';
}

// Update scan progress data
function updateScanStatusData() {
    // (Pages * 100 Topics) + ((Pages * 100 Topics * Average Amount of Gifts Per Topic) * Twice of collecting and validation of gifts)
    actionsEstimated = (scanPagesCount * 100) + ((scanPagesCount * 100 * avegareGiftsPerTopic) * 2) + foundTopicPages;

    actionsDone++;

    var percent = Math.round(actionsDone / actionsEstimated * 100);

    updateStatus('Collecting... (' + percent + '%)');
}

// User friendly scan status update
function updateStatus(text) {
    var buttonStatus = document.getElementById('collector-status');

    buttonStatus.innerHTML = text;

    document.title = orgTitle + " - " + text;
}

// Gift validation
function isValidGift(source) {
    var endPoint = source.indexOf('Description');

    // Contributor Level Required check
    if (hasStringBefore(source, 'featured__column--contributor-level--negative', endPoint)) {
        return "Too Low Level";
    }

    // Error Entry Button check
    if (hasStringBefore(source, 'sidebar__error', endPoint)) {
        // Exists in Account check
        if (hasStringBefore(source, 'Exists in Account', endPoint)) {
            return "Exists in Account";
        }

        // Missing Base Game check
        if (hasStringBefore(source, 'Missing Base Game', endPoint)) {
            return "Missing Base Game";
        }

        // Not Enough Points check (VALID GIFT)
        return null;
    }

    // Already Entered check
    if (hasStringBefore(source, 'sidebar__entry-insert is-hidden', endPoint)) {
        return "Already Entered";
    }

    // Whitelist check
    if (hasStringBefore(source, 'featured__column--whitelist', endPoint)) {
        return "Whitelist";
    }

    // Begins check
    if (hasStringBefore(source, 'Begins', endPoint)) {
        return "Not yet started";
    }

    // Ended check
    if (hasStringBefore(source, 'Ended', endPoint)) {
        return "Ended";
    }

    // Restricted Region
    if (hasStringBefore(source, 'This giveaway is restricted to the following region', endPoint)) {
        return "Restricted Regions";
    }

    // No Permission
    if (hasStringBefore(source, 'You do not have permission to view this giveaway', endPoint)) {
        return "No Permission";
    }

    // Deleted
    if (hasStringBefore(source, 'Deleted', endPoint)) {
        return "Deleted";
    }

    // No Entry check
    if (!hasStringBefore(source, 'entry_insert', -1)) {
        return "Other";
    }

    return null;
}

// Checking if text has string before point
function hasStringBefore(source, text, endPoint) {
    var index = source.indexOf(text);

    if (index >= 0) {
        if (endPoint == -1) {
            return true;
        } else {
            return index < endPoint;
        }
    }

    return false;
}

// Checking if array contains string
function containsString(array, text) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].toUpperCase() === text.toUpperCase()) {
            return true;
        }
    }

    return false;
}

// Finding urls in text
function findUrls(source) {
    var urlRegexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;
    var urlArray = [];
    var matchArray;

    while((matchArray = urlRegexToken.exec(source)) !== null) {
        urlArray.push(matchArray[0]);
    }

    return urlArray;
}
