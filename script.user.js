// ==UserScript==
// @name        Steamgifts Collector
// @description Collects unlisted gifts from SteamGifts.com
// @author      Kodek
// @namespace   csg
// @include     *steamgifts.com/discussions*
// @version     2.8.1
// @downloadURL https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @updateURL   https://github.com/KodekPL/SteamGiftCollector/raw/master/script.user.js
// @run-at      document-end
// @grant       none
// ==/UserScript==

// Settings
var scanPagesCount = 4; // How many forum pages to scan?

var isRunning = false; // Is script in progress
var isRefreshing = false; // Is script refresing collected gifts?

var giftCardsDiv; // Div with all gift cards
var invalidGiftCardsDiv; // Div with worth invalid gift cards
var validHeadingTitleDiv; // Div with valid gifts count
var invalidHeadingTitleDiv; // Div with invalid gifts count
var giftsLoadingDiv; // Div with collecting information
var giftsLoadingText; // Div with progress text
var giftsRefreshButton; // Div with refresh button
var giftsDisplayButton; // Div with gifts display button
var manualRosterBox; // Text area with manual roster links

var soundComplete; // Holds audio of complete sound

var forumPagesTrackerCount = 0; // Holds amount of checked forum pages
var topicsPagesTracker = []; // Holds all collected topics pages
var topicsPagesTrackerCount = 0; // Holds amount of checked topic pages
var topicsTracker = []; // Holds all collected topic urls
var giftsTracker = []; // Holds all collected gifts
var validGiftsTracker = []; // Holds all collected valid gifts
var giftsTopicsTracker = {}; // Holds gift link and topic it came from
var topicsTitlesTracker = {}; // Holds topic title and link it came from

var sortedGiftCards = new Array(); // Holds sorted by time valid gifts

var hiddenGifts = []; // Holds hidden gifts ids
var likeGames = []; // Holds liked games ids
var hasCardsGames = []; // Holds steam games ids with cards
var hasNotCardsGames = []; // Holds steam games ids without cards

var displayMode = 0; // Hold the active display mode for gifts
var displayGiftsCount = 0; // Hold amount of gifts that are being displayed

var progressGiftsCount = 0; // Hold amount of gifts that are in progress
var collectedGiftsCount = 0; // Holds amount of collected gifts
var collectedValidGiftsCount = 0; // Holds amount of collected valid gifts
var collectedInvalidGiftsCount = 0; // Hold amount of collected invalid gifts

//////
// RUNTIME: Startup - Add 'Collect Gifts' button to the sidebar
//////
$(document).ready(function() {
    var sidebarDiv = document.getElementsByClassName("sidebar")[0];

    // Start button
    var startButton = document.createElement("div");
    startButton.setAttribute("class", "sidebar__action-button");
    startButton.innerHTML = "Collect Gifts";

    var versionInfoText = document.createElement("span");
    versionInfoText.setAttribute("class", "sidebar__entry__points");
    versionInfoText.innerHTML = "(" + GM_info.script.version + ")";

    startButton.appendChild(versionInfoText);

    startButton.onclick = function() {
        loadHasCardsArray();
        loadHiddenGiftsArray();
        loadLikedGamesArray();
        saveManualRoster();
        startCollecting();
    };

    // Manual roster box
    manualRosterBox = document.createElement("textarea");
    manualRosterBox.setAttribute("name", "manual-roster");
    manualRosterBox.setAttribute("style", "overflow: hidden; word-wrap: break-word; height: 100px;");
    manualRosterBox.setAttribute("title", "Manual Roster");

    loadManualRoster();

    sidebarDiv.appendChild(startButton);
    sidebarDiv.appendChild(manualRosterBox);

    // Preload sounds
    preloadSounds();
});

//////
// RUNTIME: Save manual roster
//////
function saveManualRoster() {
    localStorage.sgc_manualRoster = manualRosterBox.value;
}

//////
// RUNTIME: Load manual roster
//////
function loadManualRoster() {
    var storage = localStorage.sgc_manualRoster;

    if (storage) {
        manualRosterBox.value = storage;
    }
}

//////
// RUNTIME: Save hasCards array
//////
function saveHasCardsArray() {
    localStorage.sgc_hasCards = JSON.stringify(hasCardsGames);
    localStorage.sgc_hasNotCards = JSON.stringify(hasNotCardsGames);
}

//////
// RUNTIME: Load hasCards array
//////
function loadHasCardsArray() {
    var hasCardsJson = localStorage.sgc_hasCards;

    if (hasCardsJson) {
        hasCardsGames = JSON.parse(hasCardsJson);
    }

    var hasNotCardsJson = localStorage.sgc_hasNotCards;

    if (hasNotCardsJson) {
        hasNotCardsGames = JSON.parse(hasNotCardsJson);
    }
}

//////
// RUNTIME: Save hidden gifts array
//////
function saveHiddenGiftsArray() {
    localStorage.sgc_hiddenGifts = JSON.stringify(hiddenGifts);
}

//////
// RUNTIME: Load hidden gifts array
//////
function loadHiddenGiftsArray() {
    var hiddenGiftsJson = localStorage.sgc_hiddenGifts;

    if (!hiddenGiftsJson) {
        return;
    }

    hiddenGifts = JSON.parse(hiddenGiftsJson);
}

//////
// RUNTIME: Save liked games array
//////
function saveLikedGamesArray() {
    localStorage.sgc_likeGames = JSON.stringify(likeGames);
}

//////
// RUNTIME: Load liked games array
//////
function loadLikedGamesArray() {
    var likeGamesJson = localStorage.sgc_likeGames;

    if (!likeGamesJson) {
        return;
    }

    likeGames = JSON.parse(likeGamesJson);
}

//////
// RUNTIME: Track manual roster
//////
function trackManualRoster() {
    trackGiveawayUrls(localStorage.sgc_manualRoster, "http://www.steamgifts.com/");
}

//////
// RUNTIME: Preload sounds
//////
function preloadSounds() {
    soundComplete = new Audio("https://raw.githubusercontent.com/KodekPL/SteamGiftCollector/master/completeSound.wav");
}

//////
// RUNTIME: Play complete sound
//////
function playCompleteSound() {
    soundComplete.play();
}

//////
// RUNTIME: Start collecting process
//////
function startCollecting() {
    if (isRunning) {
        return;
    }

    isRunning = true;

    console.log("Collecting started (" + GM_info.script.version + ")");

    prepareGiftCardsContainer();
    asyncCollectTopics();
}

//////
// RUNTIME: End collecting process
//////
function endCollecting() {
    // Hide progress info
    giftsLoadingDiv.setAttribute("class", "is-hidden");

    // Show refresh button
    giftsRefreshButton.setAttribute("class", "featured__action-button");

    // Show display mode button
    giftsDisplayButton.setAttribute("class", "featured__action-button");

    // Set title
    document.title = "Collecting complete!";

    // Play complete sound
    playCompleteSound();
}

//////
// RUNTIME: Prepares inner div to contain gift cards
//////
function prepareGiftCardsContainer() {
    // Set title
    document.title = "Collecting gifts...";

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
    validHeadingDiv.setAttribute("style", "margin:0px 32px;");

    // Valid Heading Title
    validHeadingTitleDiv = document.createElement("div");
    validHeadingTitleDiv.setAttribute("id", "valid_gifts_count");
    validHeadingTitleDiv.setAttribute("class", "page__heading__breadcrumbs");
    validHeadingTitleDiv.innerHTML = "Valid Gifts (0)";

    // Gifts Refresh Button
    giftsRefreshButton = document.createElement("div");
    giftsRefreshButton.setAttribute("id", "gifts_refresh");
    giftsRefreshButton.setAttribute("class", "featured__action-button is-hidden");
    giftsRefreshButton.innerHTML = "Refresh";
    giftsRefreshButton.onclick = function() {
        refreshCollection();
    };

    // Gifts Display Button
    giftsDisplayButton = document.createElement("div");
    giftsDisplayButton.setAttribute("id", "gifts_display_switch");
    giftsDisplayButton.setAttribute("class", "featured__action-button is-hidden");
    giftsDisplayButton.innerHTML = "All";
    giftsDisplayButton.onclick = function() {
        switchDisplayCollection();
    };

    validHeadingDiv.appendChild(validHeadingTitleDiv);
    validHeadingDiv.appendChild(giftsDisplayButton);
    validHeadingDiv.appendChild(giftsRefreshButton);

    // Setup heading for invalid gifts
    var invalidHeadingDiv = document.createElement("div");
    invalidHeadingDiv.setAttribute("class", "page__heading");
    invalidHeadingDiv.setAttribute("style", "margin:0px 32px;");

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

    // Reset count tracker before starting
    forumPagesTrackerCount = 0;

    for (var i = 1; i <= scanPagesCount; i++) {
        $.ajax({
            url : "http://www.steamgifts.com/discussions/search?page=" + i,
            success : function (source) {
                if (!source || source.length < 2) {
                    $.ajax(this);
                    return;
                }

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

    // Reset tracker count before starting
    topicsPagesTrackerCount = 0;

    // Reverse order of added topics to start iteration with new ones
    topicsTracker.reverse();

    for (var i = 0; i < topicsTracker.length; i++) {
        $.ajax({
            url : topicsTracker[i],
            success : function (source) {
                if (!source || source.length < 2) {
                    $.ajax(this);
                    return;
                }

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

    // Reverse order of added topics pages to start iteration with new ones
    topicsPagesTracker.reverse();

    for (var i = 0; i < topicsPagesTracker.length; i++) {
        $.ajax({
            url : topicsPagesTracker[i],
            success : function (source) {
                if (!source || source.length < 2) {
                    $.ajax(this);
                    return;
                }

                trackGiveawayUrls(source, this.url);
            }
        });
    }

    trackManualRoster();
}

//////
// RUNTIME: Display gift card with given source
//////
function displayGiftCard(url, source) {
    var giftId = getGiftId(url);

    if (containsObject(hiddenGifts, giftId)) {
        return;
    }

    // Get gift data
    var giftGameTitle = getGiftGameTitle(source);
    var giftType = getGiftType(source);
    var giftLevel = getGiftLevel(source);
    var giftGameImage = getGiftGameImage(source);
    var giftPoints = getGiftPoints(source);
    var giftEntries = getGiftEntries(source);
    var giftTime = getGiftTime(source);
    var giftAuthor = getGiftAuthor(source);
    var giftAuthorAvatar = getGiftAuthorAvatar(source);
    var hasJoined = hasJoinedGift(source);
    var steamPage = getSteamPage(source);
    var steamId = getSteamId(source);

    // Get gift sort data
    var sortValue = 0;
    sortValue += convertRemainingToInt(giftTime[1]);
    sortValue += giftGameTitle.charCodeAt(0);

    // Prepare gift data
    if(giftGameTitle.length > 30) {
        giftGameTitle = giftGameTitle.substring(0, 30) + "...";
    }

    // Create card
    var cardContentDiv = document.createElement("div");
    cardContentDiv.setAttribute("class", "giveaway__column");
    cardContentDiv.setAttribute("style", "display:inline-block; margin:5px; " + (hasJoined ? "opacity:0.4; " : "") + ((giftEntries < 100) ? "background:linear-gradient(#B9D393,#F0F2F5);" : ""));

    // Invite only icon
    if (giftType == 1) {
        var inviteOnlyDiv = document.createElement("div");
        inviteOnlyDiv.setAttribute("title", "Invite Only");
        inviteOnlyDiv.setAttribute("class", "featured__column featured__column--invite-only");
        inviteOnlyDiv.setAttribute("style", "position:absolute; margin:7px 7px;");

        var inviteOnlyIcon = document.createElement("i");
        inviteOnlyIcon.setAttribute("class", "fa fa-lock");

        inviteOnlyDiv.appendChild(inviteOnlyIcon);

        cardContentDiv.appendChild(inviteOnlyDiv);
    }

    // Steam group icon
    if (giftType == 2) {
        var groupNames = getGiftGroups(source);

        if (groupNames.length > 36) {
            groupNames = groupNames.substring(0, 36) + "...";
        }

        var steamGroupDiv = document.createElement("div");
        steamGroupDiv.setAttribute("class", "featured__column featured__column--group");
        steamGroupDiv.setAttribute("style", "position:absolute; margin:7px 7px;");

        var steamGroupIcon = document.createElement("i");
        steamGroupIcon.setAttribute("class", "fa fa-fw fa-user");

        var steamGroupName = document.createElement("span");
        steamGroupName.innerHTML = groupNames;

        steamGroupDiv.appendChild(steamGroupIcon);
        steamGroupDiv.appendChild(steamGroupName);

        cardContentDiv.appendChild(steamGroupDiv);
    }

    // Gift level icon
    if (giftLevel > 0) {
        var giftLevelDiv = document.createElement("div");
        giftLevelDiv.setAttribute("title", "Contributor Level");
        giftLevelDiv.setAttribute("class", "featured__column featured__column--contributor-level featured__column--contributor-level--positive");
        giftLevelDiv.setAttribute("style", "position:absolute; margin:7px 265px;");
        giftLevelDiv.innerHTML = giftLevel + ((giftLevel < 10) ? "+" : "");

        cardContentDiv.appendChild(giftLevelDiv);
    }

    // Add game image to card
    var gameImageDiv = document.createElement("div");

    var gameImgUrl = document.createElement("a");
    gameImgUrl.target = "_blank";
    gameImgUrl.href = url;

    var gameImg = document.createElement("img");
    gameImg.setAttribute("style", "display:block; margin:0 auto; padding:5px; width:292px; height:136px; border-radius: 10px;");
    gameImg.src = giftGameImage;

    gameImgUrl.appendChild(gameImg);

    var avatarImg = document.createElement("img");
    avatarImg.setAttribute("style", "width:3%; height:auto; position:absolute; margin:-48px 104px; border-radius: 10px;");
    avatarImg.src = giftAuthorAvatar;

    gameImageDiv.appendChild(gameImgUrl);
    gameImageDiv.appendChild(avatarImg);

    cardContentDiv.appendChild(gameImageDiv);

    // Add option buttons
    var optionButtonsDiv = document.createElement("div");
    optionButtonsDiv.setAttribute("class", "nav__left-container");
    optionButtonsDiv.setAttribute("style", "justify-content: center;");

    // Has Cards Button
    var hasCardsButtonDiv = document.createElement("div");
    hasCardsButtonDiv.setAttribute("class", "nav__button-container");
    hasCardsButtonDiv.setAttribute("style", "background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");

    var hasCardsButton = document.createElement("div");
    hasCardsButton.setAttribute("class", "nav__button");
    if (containsObject(hasCardsGames, steamId)) {
        hasCardsButton.setAttribute("style", "width: 41px; background-image: linear-gradient(#67C7CF 0px, #52B1C2 8px, #399AA6 100%);");
    } else {
        hasCardsButton.setAttribute("style", "width: 41px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
    }
    hasCardsButton.setAttribute("title", "Game has cards?");
    hasCardsButton.setAttribute("id", "hasCardsButton");
    hasCardsButton.setAttribute("steamid", steamId);
    hasCardsButton.onclick = function() {
        var findAttribute = steamId;

        // Add/Remove element from array
        if (!containsObject(hasCardsGames, findAttribute)) {
            hasCardsGames.push(findAttribute);

            if (containsObject(hasNotCardsGames, findAttribute)) {
                hasNotCardsGames.splice(hasNotCardsGames.indexOf(findAttribute), 1);
            }
        }

        saveHasCardsArray();

        var allDivElements = document.getElementsByTagName('div');

        // Find all card button div elements with steam id
        for (var i = 0; i < allDivElements.length; i++) {
            if (allDivElements[i].getAttribute("id") == "hasCardsButton" && allDivElements[i].getAttribute("steamid") == findAttribute) {
                allDivElements[i].setAttribute("style", "width: 41px; background-image: linear-gradient(#67C7CF 0px, #52B1C2 8px, #399AA6 100%);");
            }

            if (allDivElements[i].getAttribute("id") == "hasNotCardsButton" && allDivElements[i].getAttribute("steamid") == findAttribute) {
                allDivElements[i].setAttribute("style", "width: 41px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
            }
        }
    }

    var hasCardsIcon = document.createElement("i");
    hasCardsIcon.setAttribute("class", "fa fa-tablet");

    var hasNotCardsButton = document.createElement("div");
    hasNotCardsButton.setAttribute("class", "nav__button");
    if (containsObject(hasNotCardsGames, steamId)) {
        hasNotCardsButton.setAttribute("style", "width: 41px; background-image: linear-gradient(#9567CF 0px, #8C52C2 8px, #6D39A6 100%);");
    } else {
        hasNotCardsButton.setAttribute("style", "width: 41px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
    }
    hasNotCardsButton.setAttribute("title", "Game has not cards?");
    hasNotCardsButton.setAttribute("id", "hasNotCardsButton");
    hasNotCardsButton.setAttribute("steamid", steamId);
    hasNotCardsButton.onclick = function() {
        var findAttribute = steamId;

        // Add/Remove element from array
        if (!containsObject(hasNotCardsGames, findAttribute)) {
            hasNotCardsGames.push(findAttribute);

            if (containsObject(hasCardsGames, findAttribute)) {
                hasCardsGames.splice(hasCardsGames.indexOf(findAttribute), 1);
            }
        }

        saveHasCardsArray();

        var allDivElements = document.getElementsByTagName('div');

        // Find all card button div elements with steam id
        for (var i = 0; i < allDivElements.length; i++) {
            if (allDivElements[i].getAttribute("id") == "hasNotCardsButton" && allDivElements[i].getAttribute("steamid") == findAttribute) {
                allDivElements[i].setAttribute("style", "width: 41px; background-image: linear-gradient(#9567CF 0px, #8C52C2 8px, #6D39A6 100%);");
            }

            if (allDivElements[i].getAttribute("id") == "hasCardsButton" && allDivElements[i].getAttribute("steamid") == findAttribute) {
                allDivElements[i].setAttribute("style", "width: 41px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
            }
        }
    }

    var hasNotCardsIcon = document.createElement("i");
    hasNotCardsIcon.setAttribute("class", "fa fa-tablet");

    hasCardsButton.appendChild(hasCardsIcon);
    hasCardsButtonDiv.appendChild(hasCardsButton);

    hasNotCardsButton.appendChild(hasNotCardsIcon);
    hasCardsButtonDiv.appendChild(hasNotCardsButton);

    optionButtonsDiv.appendChild(hasCardsButtonDiv);

    // Like Button
    var likeButtonDiv = document.createElement("div");
    likeButtonDiv.setAttribute("class", "nav__button-container");
    likeButtonDiv.setAttribute("style", "background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");

    var likeButton = document.createElement("div");
    likeButton.setAttribute("class", "nav__button");
    if (containsObject(likeGames, steamId)) {
        likeButton.setAttribute("style", "width: 65px; background-image: linear-gradient(#CC44A9 0px, #E154BC 8px, #A63182 100%);");
    } else {
        likeButton.setAttribute("style", "width: 65px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
    }
    likeButton.setAttribute("title", "Like the game?");
    likeButton.setAttribute("id", "likeGameButton");
    likeButton.setAttribute("steamid", steamId);
    likeButton.onclick = function() {
        var findAttribute = steamId;
        var isLiking = false;

        // Add/Remove element from array
        if (!containsObject(likeGames, findAttribute)) {
            likeGames.push(findAttribute);
            isLiking = true;
        } else {
            likeGames.splice(likeGames.indexOf(findAttribute), 1);
            isLiking = false;
        }

        saveLikedGamesArray();

        var allDivElements = document.getElementsByTagName('div');

        // Find and like all game buttons div element with steam id
        for (var i = 0; i < allDivElements.length; i++) {
            if (allDivElements[i].getAttribute("id") == "likeGameButton" && allDivElements[i].getAttribute("steamid") == findAttribute) {
                if (isLiking) {
                    allDivElements[i].setAttribute("style", "width: 65px; background-image: linear-gradient(#CC44A9 0px, #E154BC 8px, #A63182 100%);");
                } else {
                    allDivElements[i].setAttribute("style", "width: 65px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
                }
            }
        }
    }

    var likeIcon = document.createElement("i");
    likeIcon.setAttribute("class", "fa fa-heart");

    likeButton.appendChild(likeIcon);
    likeButtonDiv.appendChild(likeButton);
    optionButtonsDiv.appendChild(likeButtonDiv);

    // Hide Button
    var hideButtonDiv = document.createElement("div");
    hideButtonDiv.setAttribute("class", "nav__button-container");
    hideButtonDiv.setAttribute("style", "background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");

    var hideButton = document.createElement("div");
    hideButton.setAttribute("class", "nav__button");
    if (containsObject(hiddenGifts, giftId)) {
        hideButton.setAttribute("style", "width: 14px; background-image: linear-gradient(#CF6767 0px, #C25252 8px, #A63939 100%);");
    } else {
        hideButton.setAttribute("style", "width: 14px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
    }
    hideButton.setAttribute("title", "Hide giveaway?");
    hideButton.setAttribute("id", "hideGiftButton");
    hideButton.setAttribute("giftid", giftId);
    hideButton.onclick = function() {
        var findAttribute = giftId;
        var isHidden = false;

        // Add/Remove element from array
        if (!containsObject(hiddenGifts, findAttribute)) {
            hiddenGifts.push(findAttribute);
            isHidden = true;
        } else {
            hiddenGifts.splice(hiddenGifts.indexOf(findAttribute), 1);
            isHidden = false;
        }

        saveHiddenGiftsArray();

        var allDivElements = document.getElementsByTagName('div');

        // Find and hide gift button div element with gift id
        for (var i = 0; i < allDivElements.length; i++) {
            if (allDivElements[i].getAttribute("id") == "hideGiftButton" && allDivElements[i].getAttribute("giftid") == findAttribute) {
                if (isHidden) {
                    allDivElements[i].setAttribute("style", "width: 14px; background-image: linear-gradient(#CF6767 0px, #C25252 8px, #A63939 100%);");
                } else {
                    allDivElements[i].setAttribute("style", "width: 14px; background-image: linear-gradient(#CFCFCF 0px, #BABABA 8px, #A3A3A3 100%);");
                }

                break;
            }
        }
    }

    var hideIcon = document.createElement("i");
    hideIcon.setAttribute("class", "fa fa-times");

    hideButton.appendChild(hideIcon);
    hideButtonDiv.appendChild(hideButton);
    optionButtonsDiv.appendChild(hideButtonDiv);

    cardContentDiv.appendChild(optionButtonsDiv);

    // Add game title to card
    var gameTitleDiv = document.createElement("div");
    gameTitleDiv.setAttribute("class", "featured__heading__medium");
    gameTitleDiv.setAttribute("style", "text-align:center; font-size:16px;");
    gameTitleDiv.innerHTML = "<a href=\"" + steamPage + "\" target=\"_blank\">" + giftGameTitle + "</a>";

    cardContentDiv.appendChild(gameTitleDiv);

    // Add game entries and points to card
    var gameStatusDiv = document.createElement("div");
    gameStatusDiv.setAttribute("class", "giveaway__heading__thin");
    gameStatusDiv.setAttribute("style", "line-height:10px;");
    gameStatusDiv.innerHTML = giftEntries + " entries (" + giftPoints + "P)";

    cardContentDiv.appendChild(gameStatusDiv);

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
    sortedGiftCards.push({node: cardContentDiv, sort: sortValue});

    sortedGiftCards.sort(function(a, b) {
        return a.sort - b.sort;
    });

    // Remove displayed cards and display sorted cards
    giftCardsDiv.innerHTML = "";

    for (var i = 0; i < sortedGiftCards.length; i++) {
        giftCardsDiv.appendChild(sortedGiftCards[i]['node']);
    }

    updateDisplayCollection();
}

//////
// RUNTIME: Display invalid gift card with given source
//////
function displayInvalidGiftCard(url, source, reason) {
    // Extract game title from source
    var gameTitleStartPoint = source.indexOf("table__column__secondary-link");
    var gameTitleEndPoint = gameTitleStartPoint + 64;
    var giftGameTitle = source.substring(gameTitleStartPoint, gameTitleEndPoint).split(">")[1].split("<")[0];

    var topicTitle = topicsTitlesTracker[giftsTopicsTracker[url]];

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
    if (!topicTitle) {
        giftTopicButtonDiv.innerHTML = "Open source";
    } else {
        // Cut topic title if too long
        if (topicTitle.length > 23) {
            topicTitle = topicTitle.substring(0, 23) + "...";
        }

        giftTopicButtonDiv.innerHTML = topicTitle;
    }

    cardContentDiv.appendChild(giftTopicButtonDiv);

    invalidGiftCardsDiv.appendChild(cardContentDiv);
}

//////
// RUNTIME: Switch display mode for collected gifts
//////
function switchDisplayCollection() {
    displayMode++;

    if (displayMode > 2) {
        displayMode = 0;
    }

    updateDisplayCollection();
}

//////
// RUNTIME: Display collected gifts in a different way
//////
function updateDisplayCollection() {
    if (displayMode === 0) { // Display All Mode
        giftsDisplayButton.innerHTML = "All";
    } else if (displayMode == 1) { // Display Invite Only Mode
        giftsDisplayButton.innerHTML = "Invite Only";
    } else if (displayMode == 2) { // Display Group Only Mode
        giftsDisplayButton.innerHTML = "Group Only";
    }

    // Reset display gifts count
    displayGiftsCount = 0;

    for (var i = 0; i < sortedGiftCards.length; i++) {
        var cardDiv = sortedGiftCards[i]['node'];
        var giftType = getGiftType(cardDiv.innerHTML);

        if (displayMode === 0) { // Display All Mode
            cardDiv.setAttribute("class", "giveaway__column");

            displayGiftsCount++;
        } else if (displayMode == 1) { // Display Invite Only Mode
            if (giftType == 1) {
                cardDiv.setAttribute("class", "giveaway__column");

                displayGiftsCount++;
            } else {
                cardDiv.setAttribute("class", "giveaway__column is-hidden");
            }
        } else if (displayMode == 2) { // Display Group Only Mode
            if (giftType == 2) {
                cardDiv.setAttribute("class", "giveaway__column");

                displayGiftsCount++;
            } else {
                cardDiv.setAttribute("class", "giveaway__column is-hidden");
            }
        }
    }

    validHeadingTitleDiv.innerHTML = "Valid Gifts (" + displayGiftsCount + "/" + collectedValidGiftsCount + ")";
}

//////
// RUNTIME: Refresh collected gifts and collect again
//////
function refreshCollection() {
    if (isRefreshing) {
        return;
    }

    isRefreshing = true;

    // Copy tracked gifts without valid gifts
    var copyGiftsTracker = [];

    for(var i = 0; i < giftsTracker.length; i++) {
        if (!containsString(validGiftsTracker, giftsTracker[i])) {
            copyGiftsTracker.push(giftsTracker[i]);
        }
    }

    // Replace tracked gifts with array without valid gifts
    giftsTracker = copyGiftsTracker;

    // Reset collecting variables
    sortedGiftCards = new Array();
    progressGiftsCount = 0;
    collectedGiftsCount = 0;
    collectedValidGiftsCount = 0;

    // Start collecting again
    asyncCollectTopics();

    // Set title
    document.title = "Refreshing gifts...";

    // Change refresh button
    giftsRefreshButton.setAttribute("class", "featured__action");
    giftsRefreshButton.innerHTML = "<i class=\"fa fa-refresh fa-spin\"></i>";

    // Show progress info
    giftsLoadingDiv.setAttribute("class", "");
    giftsLoadingText.innerHTML = " Refreshing gifts...";
    giftsLoadingText.setAttribute("title", "Valid/Last Valid");
}

//////
// RUNTIME: End refresing process
//////
function endRefresh() {
    isRefreshing = false;

    // Reset refresh button
    giftsRefreshButton.setAttribute("class", "featured__action-button");
    giftsRefreshButton.innerHTML = "Refresh";

    // Hide progress info
    giftsLoadingDiv.setAttribute("class", "is-hidden");

    // Set title
    document.title = "Collecting complete!";
}

//////
// UTIL: Collect all gifts urls from given source
//////
function trackGiveawayUrls(source, urlsSource) {
    var extractedUrls = extractUrls(source);

    for (var i = 0; i < extractedUrls.length; i++) {
        var url = extractedUrls[i];

        // Look for giveaway on steamgift that not already tracked
        if (url.indexOf("/giveaway/") >= 0 && url.indexOf("steamgifts.com") >= 0) {
            // Count amount of slashes in url
            var urlParts = (url.match(/\//g) || []).length;

            // If url has less than 5 slashes, add one at the end
            if (urlParts < 5) {
                url += "/";
            } else {
                // If url has more than 5 slashes, remove unnecessary part of the url
                // Leave only gift id in the url
                url = url.split("/", 5).join("/") + "/";
            }

            if (containsString(giftsTracker, url)) {
                continue;
            }

            var giftId = getGiftId(url);

            giftsTracker.push(url);

            // Add gift source
            giftsTopicsTracker[url] = urlsSource;

            // Add topic title (if is topic) - extract topic title from source
            if (urlsSource.indexOf("/discussion/") >= 0) {
                var topicTitleStartPoint = source.indexOf("<title>") + 7;
                var topicTitleEndPoint = source.indexOf("</title>");
                var topicTitle = source.substring(topicTitleStartPoint, topicTitleEndPoint);

                topicsTitlesTracker[urlsSource] = topicTitle;
            }

            progressGiftsCount++;

            $.ajax({
                url: url,
                isRepeating: false,
                repeatCount: 0,
                success: function(source) {
                    if (this.repeatCount < 4 && (!source || source.length < 2)) {
                        this.isRepeating = true;
                        this.repeatCount++;

                        $.ajax(this);
                        return;
                    }

                    this.isRepeating = false;

                    trackGiveawayUrls(source, this.url);

                    if (isGiftValid(source)) {
                        collectedValidGiftsCount++;
                        validHeadingTitleDiv.innerHTML = "Valid Gifts (" + collectedValidGiftsCount + "/" + collectedValidGiftsCount + ")";

                        if (!containsString(validGiftsTracker, this.url)) {
                            validGiftsTracker.push(this.url);
                        }

                        displayGiftCard(this.url, source);
                    } else {
                        collectedInvalidGiftsCount++;
                        invalidHeadingTitleDiv.innerHTML = "Invalid Gifts (" + collectedInvalidGiftsCount + ")";

                        var invalidGiftReason = getInvalidGiftReason(source);

                        if (invalidGiftReason !== null) {
                            displayInvalidGiftCard(this.url, source, invalidGiftReason);
                        }
                    }

                    if (!isRefreshing) {
                        giftsLoadingText.innerHTML = " Collecting gifts... (" + collectedValidGiftsCount + "/" + collectedGiftsCount + "/" + progressGiftsCount + ")";
                    } else {
                        giftsLoadingText.innerHTML = " Refreshing gifts... (" + collectedValidGiftsCount + "/" + validGiftsTracker.length + ")";
                    }
                },
                complete: function() {
                    if (this.isRepeating) {
                        this.isRepeating = false;
                        return;
                    }

                    collectedGiftsCount++;

                    if (collectedGiftsCount >= progressGiftsCount) {
                        if (!isRefreshing) {
                            endCollecting();
                        } else {
                            endRefresh();
                        }
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

    // Looks like non-public gift
    if (hasStringBefore(source, "featured__outer-wrap--giveaway", endPoint) && !hasStringBefore(source, "featured__column--whitelist", endPoint) && !hasStringBefore(source, "featured__column--group", endPoint) && !hasStringBefore(source, "featured__column--invite-only", endPoint)) {
        return false;
    }

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
// UTIL: Returns gift id from given url
//////
function getGiftId(url) {
    if (!url || url.split("/").length < 5) {
        return "-1";
    }

    return url.split("/")[4];
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
// UTIL: Returns gift type from given source
//////
function getGiftType(source) {
    // Invite only type
    if (source.indexOf("featured__column--invite-only") > -1) {
        return 1;
    }

    // Steam group type
    if (source.indexOf("featured__column--group") > -1) {
        return 2;
    }

    // Unknown type
    return 0;
}

//////
// UTIL: Returns gift level as integer from given source
//////
function getGiftLevel(source) {
    // Get start point of entries
    var levelStartPoint = source.indexOf("featured__column--contributor-level--positive");

    if (levelStartPoint == -1) {
        return -1;
    }

    // Get end point of entries
    var levelEndPoint = levelStartPoint + 86;

    // Cut substring with arrow parentheses characters
    var splitLevelString = source.substring(levelStartPoint, levelEndPoint).split(">");
    var stringLevelResult = splitLevelString[1].split("<")[0];

    // Turn string result into int
    var intLevelResult = parseInt(stringLevelResult.replace(/\D/g, ''));

    return intLevelResult;
}

//////
// UTIL: Returns gift points amount as integer from given source
//////
function getGiftPoints(source) {
    // Get start point (if there is more small headings, check for the second heading)
    var pointsStartPoint;

    if (source.match(/featured__heading__small/g).length > 1) {
        pointsStartPoint = source.split("featured__heading__small", 2).join("featured__heading__small").length;
    } else {
        pointsStartPoint = source.indexOf("featured__heading__small");
    }

    // Get end point
    var pointsEndPoint = pointsStartPoint + 34;

    // Cut substring with arrow parentheses characters
    var splitPointsString = source.substring(pointsStartPoint, pointsEndPoint).split(">");
    var stringPointsResult = splitPointsString[1].split("<")[0];
    stringPointsResult = stringPointsResult.substring(1, stringPointsResult.length - 2);

    // Turn string result into int
    var intPointsResult = parseInt(stringPointsResult.replace(/,/g, ""));

    return intPointsResult;
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
// UTIL: Returns gift groups from given source
//////
function getGiftGroups(source) {
    // Get start point of author data
    var groupStartPoint = source.indexOf("featured__column featured__column--group") + 49;

    // Get end point of author data
    var groupEndPoint = groupStartPoint + 69;

    // Cut substring with quotes characters
    var splitGroupString = source.substring(groupStartPoint, groupEndPoint).split("\"");

    return splitGroupString[0];
}

//////
// UTIL: Returns if has already enter gift from given source
//////
function hasJoinedGift(source) {
    return source.indexOf("sidebar__entry-insert is-hidden") >= 0;
}

//////
// UTIL: Returns steam page url from given source
//////
function getSteamPage(source) {
    var extractedUrls = extractUrls(source);

    for (var i = 0; i < extractedUrls.length; i++) {
        var url = extractedUrls[i];

        if (url.indexOf("store.steampowered.com") >= 0) {
            return url;
        }
    }

    return undefined;
}

//////
// UTIL: Returns steam game id from given source
//////
function getSteamId(source) {
    var steamPage = getSteamPage(source);

    if (!steamPage || steamPage.split("/").length < 5) {
        return -1;
    }

    return parseInt(steamPage.split("/")[4]);
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
// UTIL: Check if array contains object
//////
function containsObject(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj) {
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
