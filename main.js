"use strict";

// Setup
let hiveAutoQueue = new Module("LatiteHiveAutoQueue", "Hive Auto Queue", "Automatically queue to the next game", 0);
client.getModuleManager().registerModule(hiveAutoQueue);

// Input box for map dodging
let mapDodger = hiveAutoQueue.addTextSetting("mapDodger", "Map Dodge List", "The maps to dodge", " ");
let showNotification = hiveAutoQueue.addBoolSetting("showNotification", "Show Plugin Notifications",
    "Show's all the plugin notification", true);
// Current game mode
let gameMode = null;

// Party settings for games such as grav, dr, etc.
let partyMembers = [];
let deadMembers = [];
let aliveMembers = [];

// Team for BED and SKY (Games with a team system)
let team = null;

// Murder mystery will be handled differently since there is no way to know that your party member died

let pluginSentCmd = false;
const COLOR_CODE = '\u00A7'; // Unicode for §

function sendNotification(message) {
    if(showNotification.getValue()) {
        client.showNotification(message);
    }
}

/**
 * Function to find the current game mode by using /connection command
 * and extract game mode from the chat response.
 */
function findGamemode() {
    game.executeCommand("/connection");
    pluginSentCmd = true;

    client.on("receive-chat", chat => {
        let message = chat.message;

        if (chat.sender === "" && message.includes("You are connected to server name")) {
            chat.cancel = true;
            gameMode = message.split("You are connected to server name")[1].replace(/\d+/g, "").trim();
            sendNotification("Found game mode: " + gameMode);
            queueNextGame();
            pluginSentCmd = false;
        } else {
            chat.cancel = message.includes("You are connected to server");
        }
    });
}

/**
 * Function to find the party members using /party list command.
 */
function findPartyMembers() {
    let collectingMembers = false; // Flag to track if we are collecting members

    game.executeCommand("/p list");

    client.on("receive-chat", chat => {
        let message = chat.message.trim();

        if (chat.sender === "") {
            if (isStartOfPartyList(message)) {
                collectingMembers = true;
            }

            if (collectingMembers) {
                processPartyMember(message);
            }
        }
    });

    function isStartOfPartyList(message) {
        return message.includes("Members");
    }

    function isPartyMemberMessage(message) {
        return message.startsWith(COLOR_CODE + '7') || message.startsWith(COLOR_CODE + 'a');
    }

    function processPartyMember(message) {
        if (message === "Members") return; // Skip the 'Members' line

        if (isPartyMemberMessage(message) && !message.substring(2).includes(COLOR_CODE)) {
            let memberName = message.substring(2);
            sendNotification("Found party member: " + memberName);

            if (!partyMembers.includes(memberName)) {
                partyMembers.push(memberName);
            }
        } else {
            collectingMembers = false; // Stop collecting members when other conditions fail
        }
    }
}


/**
 * Function to queue into the next game.
 */
function queueNextGame() {
    if (gameMode) {
        game.executeCommand("/q " + gameMode);
    } else {
        client.showNotification("Game mode not found. Please try again.");
    }
}

/**
 * Listen for title content to detect if the game is over and queue the next game.
 */
client.on("title", title => {
    if (!hiveAutoQueue.isEnabled()) return;

    let titleText = title.text;
    let server = game.getFeaturedServer().toLowerCase();

    if (server.includes("hive")) {
        if (titleText.includes("Over") || titleText.includes("Victory") || titleText.includes("Game Over") || titleText.includes("Sweet Victory")) {
            sendNotification("Game Over! Queuing next game...");
            queueNextGame();
        }
    }
});

/**
 * Handle chat message version for queueing the next game.
 * Better for games such has Party, Murder, etc.
 */
client.on("receive-chat", chat => {
    if (!hiveAutoQueue.isEnabled()) return;
    let message = chat.message;
    let server = game.getFeaturedServer().toLowerCase();

    if (chat.sender === "") {
        if (server.includes("hive")) {
            if(message.includes("Game over") || message.includes("Game over!") || message.includes("Game over.") ||
                message.includes("Game Over") || message.includes("Game Over!") || message.includes("Game Over.")) {
                sendNotification("Game Over! Queuing next game...");
                queueNextGame();
            }
        }
    }
});

client.on("receive-chat", chat => {
    if (!hiveAutoQueue.isEnabled()) return;

    let message = chat.message;
    let mapDodgerArray = mapDodger.getValue().split(",");

    if (chat.sender === "") {
        handleMapDodging(message, mapDodgerArray);

        if (message.includes("You are connected to public") || message.includes("You are connected to internal")) {
            chat.cancel = pluginSentCmd;
        }
    }
});

function handleMapDodging(message, mapDodgerArray) {
    if (message.includes("won with") && message.includes("votes!")) {
        let mapName = message.split(" ")[1];
        mapDodgerArray.forEach(element => {
            if (mapName.includes(element) && element !== "") {
                sendNotification("Dodging map: " + mapName);
                queueNextGame();
            }
        });
    }
}


/**
 * Handle chat messages for party member updates.
 */
client.on("receive-chat", chat => {
    if(!hiveAutoQueue.isEnabled()) return;

    let message = chat.message;

    if (chat.sender === "") {
        // Check if someone joined the party
        if (message.includes("joined") && message.includes("party")) {
            findPartyMembers();
        }

        // Check if someone left the party
        if (message.includes("left") && message.includes("party")) {

            if (message.startsWith(COLOR_CODE + 'f' + COLOR_CODE + 'l')) {
                sendNotification("Test message: " + message);
                let nameStartIndex = (COLOR_CODE + 'f' + COLOR_CODE + 'l').length;
                let nameEndIndex = message.indexOf(' ' + COLOR_CODE  + 'r' + COLOR_CODE + 'c');
                let playerName = message.substring(nameStartIndex, nameEndIndex).trim();

                sendNotification("Removed party member " + playerName)
                let memberIndex = partyMembers.indexOf(playerName);
                if (memberIndex !== -1) {
                    partyMembers.splice(memberIndex, 1);
                }
            }
        }
    }
});

/**
 * Handle dimension change event to find the new game mode.
 */
client.on("change-dimension", () => {
    if (hiveAutoQueue.isEnabled()) {
        findGamemode();

        client.on("receive-chat", chat => {
            let message = chat.message;
            chat.cancel = message.includes("IP") ||
                message.includes("You're issuing commands too quickly, try again later.") ||
                message.includes("Unknown command. Sorry!");
        });
    }
});
