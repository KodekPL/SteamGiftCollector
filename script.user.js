// ==UserScript==
// @name        Steamgifts Collector
// @description Collects unlisted gifts from SteamGifts.com
// @author      Kodek
// @namespace   csg
// @include     *steamgifts.com/discussions*
// @version     2.0.3
// @downloadURL https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @updateURL   https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @run-at      document-end
// @grant       none
// ==/UserScript==

// Settings
var scanPagesCount = 4; // How many forum pages to scan?

var isRunning = false; // Is script in progress

var giftCardsDiv; // Div with all gift cards
var invalidGiftCardsDiv; // Div with worth invalid gift cards
var validHeadingTitleDiv; // Div with valid gifts count
var invalidHeadingTitleDiv; // Div with invalid gifts count
var giftsLoadingDiv; // Div with collecting information
var giftsLoadingText; // Div with progress text

var forumPagesTrackerCount = 0; // Holds amount of checked forum pages
var topicsPagesTracker = []; // Holds all collected topics pages
var topicsPagesTrackerCount = 0; // Holds amount of checked topic pages
var topicsTracker = []; // Holds all collected topic urls
var giftsTracker = []; // Holds all collected gifts
var giftsTopicsTracker = {}; // Holds gift link and topic it came from

var sortedGiftCards = new Array(); // Holds sorted by time valid gifts

var progressGiftsCount = 0; // Hold amount of gifts that are in progress
var collectedGiftsCount = 0; // Holds amount of collected gifts
var collectedValidGiftsCount = 0; // Holds amount of collected valid gifts
var collectedInvalidGiftsCount = 0; // Hold amount of collected invalid gifts

//////
// RUNTIME: Startup - Add 'Collect Gifts' button to the sidebar
//////
$(document).ready(function() {
    var sidebarDiv = document.getElementsByClassName("sidebar")[0];

    var startButton = document.createElement("div");
    startButton.setAttribute("class", "sidebar__action-button");
    startButton.innerHTML = "Collect Gifts";

    sidebarDiv.appendChild(startButton);

    startButton.onclick = function() {
        startCollecting();
    };
});

//////
// RUNTIME: Start collecting process
//////
function startCollecting() {
    if (isRunning) {
        return;
    }

    isRunning = true;

    prepareGiftCardsContainer();
    asyncCollectTopics();
}

//////
// RUNTIME: Prepares inner div to contain gift cards
//////
function prepareGiftCardsContainer() {
    // Remove default website code
    document.getElementsByClassName("page__inner-wrap")[0].remove();

    // Get website content display div
    var contentDiv = document.getElementsByClassName("page__outer-wrap")[0];

    // Setup progress information
    giftsLoadingDiv = document.createElement("div");
    giftsLoadingDiv.setAttribute("style", "width:100%; text-align:center; display:block; margin-left:auto; margin-right:auto; padding:5px;");

    var giftsLoadingIcon = document.createElement("i");
    giftsLoadingIcon.setAttribute("class", "fa fa-refresh fa-spin");
    giftsLoadingIcon.setAttribute("style", "font-size:350%;");

    giftsLoadingText = document.createElement("span");
    giftsLoadingText.innerHTML = " Scanning for gifts...";
    giftsLoadingText.setAttribute("class", "featured__heading__medium");
    giftsLoadingText.setAttribute("style", "font-size:250%; vertical-align:middle;");
    giftsLoadingText.setAttribute("title", "Valid/Checked/Overall");

    giftsLoadingDiv.appendChild(giftsLoadingIcon);
    giftsLoadingDiv.appendChild(giftsLoadingText);

    // Setup gift cards div
    giftCardsDiv = document.createElement("div");
    giftCardsDiv.setAttribute("class", "giveaway__columns");
    giftCardsDiv.setAttribute("style", "display:block; text-align:center;");

    // Setup heading for valid gifts
    var validHeadingDiv = document.createElement("div");
    validHeadingDiv.setAttribute("class", "page__heading");

    validHeadingTitleDiv = document.createElement("div");
    validHeadingTitleDiv.setAttribute("id", "valid_gifts_count");
    validHeadingTitleDiv.setAttribute("class", "page__heading__breadcrumbs");
    validHeadingTitleDiv.innerHTML = "Valid Gifts (0)";

    validHeadingDiv.appendChild(validHeadingTitleDiv);

    // Setup heading for invalid gifts
    var invalidHeadingDiv = document.createElement("div");
    invalidHeadingDiv.setAttribute("class", "page__heading");

    invalidHeadingTitleDiv = document.createElement("div");
    invalidHeadingTitleDiv.setAttribute("id", "invalid_gifts_count");
    invalidHeadingTitleDiv.setAttribute("class", "page__heading__breadcrumbs");
    invalidHeadingTitleDiv.innerHTML = "Invalid Gifts (0)";

    invalidHeadingDiv.appendChild(invalidHeadingTitleDiv);

    // Setup invalid gift cards div
    invalidGiftCardsDiv = document.createElement("div");
    invalidGiftCardsDiv.setAttribute("class", "giveaway__columns");
    invalidGiftCardsDiv.setAttribute("style", "display:block; text-align:center;");

    // Apply content
    contentDiv.appendChild(giftsLoadingDiv);
    contentDiv.appendChild(validHeadingDiv);
    contentDiv.appendChild(giftCardsDiv);
    contentDiv.appendChild(invalidHeadingDiv);
    contentDiv.appendChild(invalidGiftCardsDiv);
}

//////
// RUNTIME: Collect forum topics
//////
function asyncCollectTopics() {
    console.log("Scanning pages for topics...");

    for (var i = 1; i <= scanPagesCount; i++) {
        $.ajax({
            url : "http://www.steamgifts.com/discussions/search?page=" + i,
            success : function (source) {
                // Replace hrefs with site domain to extract topic urls easier
                var fixSource = source.replace(/href="/g, "http://www.steamgifts.com");
                var extractedUrls = extractUrls(fixSource);

                for (var i = 0; i < extractedUrls.length; i++) {
                    var url = extractedUrls[i];

                    // Look for urls that contains discussion and aren't already on tracker list
                    if (url.indexOf("/discussion/") >= 0 && !containsString(topicsTracker, url)) {
                        topicsTracker.push(url);
                    }
                }

                forumPagesTrackerCount++;

                if (forumPagesTrackerCount >= scanPagesCount) {
                    asyncScanForTopicPages();
                }
            }
        });
    }
}

//////
// RUNTIME: Collect topics pages
//////
function asyncScanForTopicPages() {
    console.log("Scanned " + scanPagesCount + " pages and found " + topicsTracker.length + " topics.");
    console.log("Scanning for topics pages...");

    for (var i = 0; i < topicsTracker.length; i++) {
        $.ajax({
            url : topicsTracker[i],
            success : function (source) {
                // Collect all giveaway urls within first topic page
                trackGiveawayUrls(source, this.url);

                var pagesCount = 0;

                // Scan for last page of topic
                for (var i = 200; i > 0; i--) {
                    if (source.indexOf("search?page=" + i) >= 0) {
                        pagesCount = i;
                        break;
                    }
                }

                // Collect links to topic pages (start with second page as the first was already checked)
                for (var i2 = 2; i2 <= pagesCount; i2++) {
                    var topicPageUrl = this.url + "/search?page=" + i2;

                    if (!containsString(topicsPagesTracker, topicPageUrl)) {
                        topicsPagesTracker.push(topicPageUrl);
                    }
                }

                topicsPagesTrackerCount++;

                if (topicsPagesTrackerCount >= topicsTracker.length) {
                    asyncScanTopicsForGifts();
                }
            }
        });
    }
}

//////
// RUNTIME: Collect gifts from topics
//////
function asyncScanTopicsForGifts() {
    console.log("Scanned " + topicsPagesTracker.length + " topics pages...");
    console.log("Scanning for gifts...");

    for (var i = 0; i < topicsPagesTracker.length; i++) {
        $.ajax({
            url : topicsPagesTracker[i],
            success : function (source) {
                trackGiveawayUrls(source, this.url);
            }
        });
    }
}

//////
// RUNTIME: Display gift card with given source
//////
function displayGiftCard(url, source) {
    // Get gift data
    var giftGameTitle = getGiftGameTitle(source);
    var giftGameImage = getGiftGameImage(source);
    var giftEntries = getGiftEntries(source);
    var giftTime = getGiftTime(source);
    var giftAuthor = getGiftAuthor(source);
    var giftAuthorAvatar = getGiftAuthorAvatar(source);
    var hasJoined = hasJoinedGift(source);

    // Prepare gift data
    if(giftGameTitle.length > 20) {
        giftGameTitle = giftGameTitle.substring(0, 20) + "...";
    }

    // Create card
    var cardContentDiv = document.createElement("div");
    cardContentDiv.setAttribute("class", "giveaway__column");
    cardContentDiv.setAttribute("style", "display:inline-block; margin:5px; " + (hasJoined ? "opacity:0.4; " : "") + ((giftEntries < 100) ? "background:linear-gradient(#B9D393,#F0F2F5);" : ""));

    // Add game image to card
    var gameImageDiv = document.createElement("div");

    var gameImgUrl = document.createElement("a");
    gameImgUrl.target = "_blank";
    gameImgUrl.href = url;

    var gameImg = document.createElement("img");
    gameImg.setAttribute("style", "display:block; margin:0 auto; padding:5px; width:292px; height:136px;");
    gameImg.src = giftGameImage;

    gameImgUrl.appendChild(gameImg);

    var avatarImg = document.createElement("img");
    avatarImg.setAttribute("style", "width:3%; height:auto; position:absolute; margin:-48px 104px;");
    avatarImg.src = giftAuthorAvatar;

    gameImageDiv.appendChild(gameImgUrl);
    gameImageDiv.appendChild(avatarImg);

    cardContentDiv.appendChild(gameImageDiv);

    // Add game title to card
    var gameTitleDiv = document.createElement("div");
    gameTitleDiv.setAttribute("class", "featured__heading__medium");
    gameTitleDiv.setAttribute("style", "text-align:center; font-size:16px;");
    gameTitleDiv.innerHTML = giftGameTitle + " (" + giftEntries + " entries)";

    cardContentDiv.appendChild(gameTitleDiv);

    // Add info div for time and author
    var giftInfoDiv = document.createElement("div");
    giftInfoDiv.setAttribute("class", "featured__column");
    giftInfoDiv.setAttribute("style", "text-align:left;");

    cardContentDiv.appendChild(giftInfoDiv);

    // Add time to info div
    var giftTimeIcon = document.createElement("i");
    giftTimeIcon.setAttribute("class", "fa fa-clock-o");
    giftTimeIcon.setAttribute("style", "color:#6B7A8C;");

    var giftTimeText = document.createElement("span");
    giftTimeText.setAttribute("title", giftTime[0]);
    giftTimeText.setAttribute("style", "color:#6B7A8C;");
    giftTimeText.innerHTML = " " + giftTime[1];

    var giftAuthorText = document.createElement("a");
    giftAuthorText.href = giftsTopicsTracker[url];
    giftAuthorText.target = "_blank";
    giftAuthorText.setAttribute("style", "color:#6B7A8C; float:right; text-align:right;");
    giftAuthorText.innerHTML = "Created by: " + giftAuthor;

    giftInfoDiv.appendChild(giftTimeIcon);
    giftInfoDiv.appendChild(giftTimeText);
    giftInfoDiv.appendChild(giftAuthorText);

    // Add card and sort
    sortedGiftCards.push({node: cardContentDiv, time: convertRemainingToInt(giftTime[1])});

    sortedGiftCards.sort(function(a, b) {
        return a.time - b.time;
    });

    // Remove displayed cards and display sorted cards
    giftCardsDiv.innerHTML = "";

    for (var i = 0; i < sortedGiftCards.length; i++) {
        giftCardsDiv.appendChild(sortedGiftCards[i]["node"]);
    }
}

//////
// RUNTIME: Display invalid gift card with given source
//////
function displayInvalidGiftCard(url, source, reason) {
    // Extract title from source
    var titleStartPoint = source.indexOf("table__column__secondary-link");
    var titleEndPoint = titleStartPoint + 64;
    var giftGameTitle = source.substring(titleStartPoint, titleEndPoint).split(">")[1].split("<")[0];

    // Create card
    var cardContentDiv = document.createElement("div");
    cardContentDiv.setAttribute("class", "giveaway__column");
    cardContentDiv.setAttribute("style", "display:inline-block; margin:5px;");

    // Add game title to card
    var gameTitleDiv = document.createElement("div");
    gameTitleDiv.setAttribute("class", "featured__heading__medium");
    gameTitleDiv.setAttribute("style", "text-align:center; font-size:16px;");

    var gameTitleUrl = document.createElement("a");
    gameTitleUrl.href = url;
    gameTitleUrl.target = "_blank";
    gameTitleUrl.innerHTML = giftGameTitle;

    gameTitleDiv.appendChild(gameTitleUrl);

    cardContentDiv.appendChild(gameTitleDiv);

    // Add info div for reason
    var giftInfoDiv = document.createElement("div");
    giftInfoDiv.setAttribute("class", "featured__column");
    giftInfoDiv.setAttribute("style", "text-align:center;");

    cardContentDiv.appendChild(giftInfoDiv);

    var giftReasonText = document.createElement("span");
    giftReasonText.setAttribute("style", "color:#6B7A8C;");
    giftReasonText.innerHTML = reason;

    giftInfoDiv.appendChild(giftReasonText);

    // Add button to the topic
    var giftTopicButtonDiv = document.createElement("div");
    giftTopicButtonDiv.setAttribute("class", "sidebar__action-button");
    giftTopicButtonDiv.setAttribute("onclick", "window.open(\"" + giftsTopicsTracker[url] + "\", \"_blank\")");
    giftTopicButtonDiv.innerHTML = "Open Topic";

    cardContentDiv.appendChild(giftTopicButtonDiv);

    invalidGiftCardsDiv.appendChild(cardContentDiv);
}

//////
// RUNTIME: End collecting process
//////
function endCollecting() {
    giftsLoadingDiv.setAttribute("style", "display:none;");
}

//////
// UTIL: Convert remaning time to integer seconds
//////
function convertRemainingToInt(stringTime) {
    var value = parseInt(stringTime.split(" ")[0]);

    if (stringTime.indexOf("week") > -1) {
        return value * 7 * 24 * 60 * 60;
    } else if (stringTime.indexOf("day") > -1) {
        return value * 24 * 60 * 60;
    } else if (stringTime.indexOf("hour") > -1) {
        return value * 60 * 60;
    } else if (stringTime.indexOf("minute") > -1) {
        return value * 60;
    } else {
        return 0;
    }
}

//////
// UTIL: Collect all gifts urls from given source
//////
function trackGiveawayUrls(source, urlsSource) {
    var extractedUrls = extractUrls(source);

    for (var i = 0; i < extractedUrls.length; i++) {
        var url = extractedUrls[i];

        // Look for giveaway on steamgift that not already tracked
        if (url.indexOf("/giveaway/") >= 0 && url.indexOf("steamgifts.com") >= 0 && !containsString(giftsTracker, url)) {
            giftsTracker.push(url);

            // Add gift source
            giftsTopicsTracker[url] = urlsSource;

            progressGiftsCount++;

            $.ajax({
                url : url,
                success : function (source) {
                    trackGiveawayUrls(source, this.url);

                    if (isGiftValid(source)) {
                        collectedValidGiftsCount++;
                        validHeadingTitleDiv.innerHTML = "Valid Gifts (" + collectedValidGiftsCount + ")";

                        displayGiftCard(this.url, source);
                    } else {
                        collectedInvalidGiftsCount++;
                        invalidHeadingTitleDiv.innerHTML = "Invalid Gifts (" + collectedInvalidGiftsCount + ")";

                        var invalidGiftReason = getInvalidGiftReason(source);

                        if (invalidGiftReason !== null) {
                            displayInvalidGiftCard(this.url, source, invalidGiftReason);
                        }
                    }

                    giftsLoadingText.innerHTML = " Collecting gifts... (" + collectedValidGiftsCount + "/" + collectedGiftsCount + "/" + progressGiftsCount + ")";
                },
                complete: function () {
                    collectedGiftsCount++;

                    if (collectedGiftsCount >= progressGiftsCount) {
                        endCollecting();
                    }
                }
            });
        }
    }
}

//////
// UTIL: Returns if gift is valid
//////
function isGiftValid(source) {
    // Use the search bar as the end point
    var endPoint = source.indexOf("fa-search");

    //
    // Requirements Checks
    //

    // Error Entry Button check
    if (hasStringBefore(source, "sidebar__error", endPoint)) {
        // Exists in Account check
        if (hasStringBefore(source, "Exists in Account", endPoint)) {
            return false;
        }

        // Missing Base Game check
        if (hasStringBefore(source, "Missing Base Game", endPoint)) {
            return false;
        }

        // Contributor Level Required check
        if (hasStringBefore(source, "contributor-level--negative", endPoint)) {
            return false;
        }

        // Pass Not Enough Points
        return true;
    }

    // Looks like non-public gift
    if (hasStringBefore(source, "featured__outer-wrap--giveaway", endPoint) && !hasStringBefore(source, "featured__column--whitelist", endPoint) && !hasStringBefore(source, "featured__column--group", endPoint) && !hasStringBefore(source, "featured__column--invite-only", endPoint)) {
        return false;
    }

    // Ended check
    if (hasStringBefore(source, "Ended", endPoint)) {
        return false;
    }

    // Begins check
    if (hasStringBefore(source, "Begins", endPoint)) {
        return false;
    }

    // Already Entered check
    if (hasStringBefore(source, "sidebar__entry-insert is-hidden", endPoint)) {
        return true;
    }

    // Entry check (There is button to join)
    if (hasStringBefore(source, "entry_insert", endPoint)) {
        return true;
    }

    // Whitelist check
    if (hasStringBefore(source, "featured__column--whitelist", endPoint)) {
        return false;
    }

    return false;
}

//////
// UTIL: Returns worth lookup invalid gift reason
//////
function getInvalidGiftReason(source) {
    // No Permission - Steam Group
    if (source.indexOf("You do not have permission") > -1 && source.indexOf("Steam group") > -1) {
        return "No Permission (Steam Group)";
    }

    return null;
}

//////
// UTIL: Returns gift game image from given source
//////
function getGiftGameImage(source) {
    var extractedUrls = extractUrls(source);

    for (var i = 0; i < extractedUrls.length; i++) {
        var url = extractedUrls[i];

        // Look for image with steam domain and header
        if (url.indexOf(".jpg") >= 0 && url.indexOf("steamstatic.com") >= 0 && url.indexOf("header") >= 0) {
            return url;
        }
    }
}

//////
// UTIL: Returns gift game title from given source
//////
function getGiftGameTitle(source) {
    // Get start point of title
    var titleStartPoint = source.indexOf("<title>");

    // End point of title
    var titleEndPoint = source.indexOf("</title>");

    return source.substring(titleStartPoint + 7, titleEndPoint);
}

//////
// UTIL: Returns gift entries amount as integer from given source
//////
function getGiftEntries(source) {
    // Get start point of entries
    var entriesStartPoint = source.indexOf("live__entry-count");

    // Get end point of entries
    var entriesEndPoint = entriesStartPoint + 32;

    // Cut substring with arrow parentheses characters
    var splitEntriesString = source.substring(entriesStartPoint, entriesEndPoint).split(">");
    var stringEntriesResult = splitEntriesString[1].split("<")[0];

    // Turn string result into int
    var intEntriesResult = parseInt(stringEntriesResult.replace(/,/g, ""));

    return intEntriesResult;
}

//////
// UTIL: Returns gift remaining time from given source
//////
function getGiftTime(source) {
    var endTime;
    var remainingTime;

    // Get end point of time data
    var timeEndPoint = source.indexOf("remaining");

    if (timeEndPoint == -1) {
        return "NULL";
    }

    // Get start point of time data
    var timeStartPoint = timeEndPoint - 80;

    // Cut substring with quotes characters
    var splitTimeString = source.substring(timeStartPoint, timeEndPoint).split("\"");

    // Get end time result from split string
    endTime = splitTimeString[4];

    // Get remaning time result
    remainingTime = splitTimeString[5];
    remainingTime = remainingTime.substring(1, remainingTime.length);
    remainingTime += "remaining";

    // Return result
    return [endTime, remainingTime];
}

//////
// UTIL: Returns gift author from given source
//////
function getGiftAuthor(source) {
    // Get start point of author data
    var authorStartPoint = source.split("/user/", 2).join("/user/").length;

    // Get end point of author data
    var authorEndPoint = authorStartPoint + 36;

    // Cut substring with arrow parentheses characters
    var splitAuthorString = source.substring(authorStartPoint, authorEndPoint).split(">");
    var authorResult = splitAuthorString[1].split("<")[0];

    return authorResult;
}

//////
// UTIL: Returns gift author avatar from given source
//////
function getGiftAuthorAvatar(source) {
    var avatarsCount = 0;
    var extractedUrls = extractUrls(source);

    for (var i = 0; i < extractedUrls.length; i++) {
        var url = extractedUrls[i];

        // Look for image with steam domain and header
        if (url.indexOf(".jpg") >= 0 && url.indexOf("akamaihd.net") >= 0 && url.indexOf("avatars") >= 0) {
            avatarsCount++;

            if (avatarsCount == 2) {
                return url;
            }
        }
    }
}

//////
// UTIL: Returns if has already enter gift from given source
//////
function hasJoinedGift(source) {
    return source.indexOf("sidebar__entry-insert is-hidden") >= 0;
}

//////
// UTIL: Extracts all urls from given source
//////
function extractUrls(source) {
    var urlRegexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

    var urlArray = [];

    var matchArray;
    while((matchArray = urlRegexToken.exec(source)) !== null) {
        urlArray.push(matchArray[0]);
    }

    return urlArray;
}

//////
// UTIL: Check if array contains string
//////
function containsString(array, text) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].toUpperCase() === text.toUpperCase()) {
            return true;
        }
    }

    return false;
}

//////
// UTIL: Check if string has text before end point
//////
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
