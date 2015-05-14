// ==UserScript==
// @name        Steamgifts Collector
// @description Collects unlisted gifts from SteamGifts.com
// @author      Kodek
// @namespace   csg
// @include     *steamgifts.com/discussions*
// @version     1.7
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
var giftTopics = {};
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
                        var giftUrl = url.split('/', 6).join('/');

                        giftUrls.push(giftUrl);
                        giftTopics[giftUrl] = this.url;

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

    content += ("<style>#gift_table td {text-align: center}</style>");

    content += ("<title>Collected Gifts - " + orgTitle + "</title>");

    // Heading - Valid Gifts
    content += ("<div class='page__heading'><div class='page__heading__breadcrumbs'>Valid Gifts (" + validGiftUrls.length + ")</div></div>");

    content += "<table align='center' id='gift_table'>";

    var tableImgData = "";
    var tableLinkData = "";

    for (var i = 0; i < validGiftUrls.length; i++) {
        tableImgData += ("<td><a href='" + validGiftUrls[i] + "' target='_blank'><img src='" + validGiftUrls[i] + "/signature.png'></a></td>");
        tableLinkData += ("<td><a class='giveaway__username' href='" + validGiftUrls[i] + "' target='_blank'>" + validGiftUrls[i].split('/', 5).join('/') + "</a> [<a class='giveaway__username' href='" + giftTopics[validGiftUrls[i]] + "' target='_blank'>Thread</a>]</td>");

        if ((i + 1) % 2 == 0 || (i == (validGiftUrls.length - 1) && (i + 1) % 2 == 1)) {
            content += ("<tr>" + tableImgData + "</tr><tr>" + tableLinkData + "</tr>");

            tableImgData = "";
            tableLinkData = "";
        }
    }

    content += "</table><br>";

    // Invalid Gifts
    for (var key in invalidGiftUrls) {
        if (invalidGiftUrls.hasOwnProperty(key)) {
            var invalidArray = invalidGiftUrls[key];

            content += ("<div class='page__heading'><div class='page__heading__breadcrumbs'>Invalid gifts - " + key + " (" + invalidArray.length + ")</div></div><br>");

            for (var i = 0; i < invalidArray.length; i++) {
                content += ("<a class='giveaway__username' href='" + invalidArray[i] + "' target='_blank'>" + invalidArray[i] + "</a> [<a class='giveaway__username' href='" + giftTopics[invalidArray[i]] + "' target='_blank'>Thread</a>]<br>");
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
    var canJoinGift = false;
    var reasonForInvalid = "Other";

    var endPoint = source.indexOf('page__description');

    //
    // Requirements Checks
    //

    // Error Entry Button check
    if (hasStringBefore(source, 'sidebar__error', endPoint)) {
        // Not Enough Points (Can Join Overall)
        canJoinGift = true;

        // Exists in Account check
        if (hasStringBefore(source, 'Exists in Account', endPoint)) {
            reasonForInvalid = "Exists in Account";
            canJoinGift = false;
        }

        // Missing Base Game check
        if (hasStringBefore(source, 'Missing Base Game', endPoint)) {
            reasonForInvalid = "Missing Base Game";
            canJoinGift = false;
        }
    }

    // Entry check (There is button to join)
    if (hasStringBefore(source, 'entry_insert', endPoint)) {
        canJoinGift = true;
    }

    // Contributor Level Required check
    if (hasStringBefore(source, 'contributor-level--negative', endPoint)) {
        reasonForInvalid = "Too Low Level";
        canJoinGift = false;
    }

    // Already Entered check
    if (hasStringBefore(source, 'sidebar__entry-insert is-hidden', endPoint)) {
        reasonForInvalid = "Already Entered";
        canJoinGift = false;
    }

    //
    // Public Gift Checks
    //

    // Has at least one element for non-public gift
    if (hasStringBefore(source, 'featured__outer-wrap--giveaway', endPoint) && !hasStringBefore(source, 'featured__column--whitelist', endPoint) && !hasStringBefore(source, 'featured__column--group', endPoint) && !hasStringBefore(source, 'featured__column--invite-only', endPoint)) {
        reasonForInvalid = "Public Gift";
        canJoinGift = false;
    }

    //
    // Time Checks
    //

    // Ended check
    if (hasStringBefore(source, 'Ended', endPoint)) {
        reasonForInvalid = "Ended";
        canJoinGift = false;
    }

    // Begins check
    if (hasStringBefore(source, 'Begins', endPoint)) {
        reasonForInvalid = "Not yet started";
        canJoinGift = false;
    }

    //
    // Other Checkings
    //

    // Whitelist check
    if (hasStringBefore(source, 'featured__column--whitelist', endPoint)) {
        reasonForInvalid = "Whitelist";
        canJoinGift = false;
    }

    // Restricted Region
    if (hasStringBefore(source, 'This giveaway is restricted to the following region', endPoint)) {
        reasonForInvalid = "Restricted Regions";
        canJoinGift = false;
    }

    // No Permission - Steam Group
    if (hasStringBefore(source, 'You do not have permission to view this giveaway', endPoint) && hasStringBefore(source, 'Steam group', endPoint)) {
        reasonForInvalid = "No Permission - Steam Group";
        canJoinGift = false;
    }

    // No Permission - Blacklist
    if (hasStringBefore(source, 'You do not have permission to view this giveaway', endPoint) && hasStringBefore(source, 'blacklist', endPoint)) {
        reasonForInvalid = "No Permission - Blacklist";
        canJoinGift = false;
    }

    // No Permission - Whitelist
    if (hasStringBefore(source, 'You do not have permission to view this giveaway', endPoint) && hasStringBefore(source, 'whitelist', endPoint)) {
        reasonForInvalid = "No Permission - Whitelist";
        canJoinGift = false;
    }

    // Deleted
    if (hasStringBefore(source, 'Deleted', endPoint)) {
        reasonForInvalid = "Deleted";
        canJoinGift = false;
    }

    if (canJoinGift) {
        return null;
    }

    return reasonForInvalid;
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
