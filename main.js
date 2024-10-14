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

// Party settings
let partyMembers = [];
let deadMembers = [];
let aliveMembers = [];

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

            // Start collecting after we hit the "Members" line
            if (message.includes("Members")) {
                collectingMembers = true;
            }

            if(collectingMembers) {

                // Check if the message isn't 'Members' (Shouldn't affect the collecting members flag)
                if(message === "Members") return;

                if (message.startsWith(COLOR_CODE + '7') || message.startsWith(COLOR_CODE + 'a')) {
                    if(!message.substring(2).includes(COLOR_CODE)) {
                        sendNotification("Found party member: " + message.substring(2));

                        if(!partyMembers.includes(message.substring(2))) {
                            partyMembers.push(message.substring(2));
                        }

                    } else {
                        collectingMembers = false;
                    }
                }
            }

            // Handle specific chat cancellation cases
            chat.cancel = message.includes("You're issuing commands too quickly, try again later.") ||
                message.includes("Unknown command. Sorry!");
        }
    });
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
 * Handle chat messages for map dodging and party member updates.
 */
client.on("receive-chat", chat => {
    if (!hiveAutoQueue.isEnabled()) return;

    let message = chat.message;
    let mapDodgerArray = mapDodger.getValue().split(",");

    if (chat.sender === "") {
        // Map Dodging Logic
        if (message.includes("won with") && message.includes("votes!")) {
        let mapName = message.split(" ")[1];
            for (const element of mapDodgerArray) {
                if (mapName.includes(element) && element !== "") {
                    sendNotification("Dodging map: " + mapName);
                    queueNextGame();
                }
            }
        }

        // Suppress command-related messages
        if (message.includes("You are connected to public") || message.includes("You are connected to internal")) {
            chat.cancel = pluginSentCmd;
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
