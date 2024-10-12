"use strict";

// Setup
let hiveAutoQueue = new Module("LatiteHiveAutoQueue", "Hive Auto Queue", "Automatically queue to the next game", 0);
client.getModuleManager().registerModule(hiveAutoQueue);

// Input box for map dodging
let mapDodger = hiveAutoQueue.addTextSetting("mapDodger", "Map Dodge List", "The map to dodge", " ");

// Current game mode
let gameMode = null;

// Party settings
let partyMembers = [];
let deadMembers = [];
let aliveMembers = [];

let pluginSentCmd = false;

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
            script.log("[LatiteHiveAutoQueue] Detected Game: " + gameMode);
            queueNextGame();
            pluginSentCmd = false;
        } else {
            chat.cancel = message.includes("You are connected to server");
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
        script.log("[LatiteHiveAutoQueue] Game mode not found, failed to queue");
    }
}

/**
 * Function to find the party members using /party list command.
 */
function findPartyMembers() {
    // TODO: Find out why it isn't working
    game.executeCommand("/p list");
    script.log("[LatiteHiveAutoQueue] Finding party members");
    client.on("receive-chat", chat => {
        let message = chat.message;

        if (chat.sender === "") {
            let listOfColorsToAvoid = ["§b", "§c", "§d", "§e", "§f", "§k", "§l", "§m", "§n", "§o", "§r",
                "§0", "§1", "§2", "§3", "§4", "§5", "§6", "§7", "§8", "§9"];
            if(message.includes("§a") && !listOfColorsToAvoid.includes(message.substring(0, 2))) {
                let partyMember = message.split("§a")[1].split(" ")[0];
                partyMembers.push(partyMember);
                script.log("[LatiteHiveAutoQueue] Found party members: " + partyMember);
            }
            chat.cancel = message.includes("You're issuing commands too quickly, try again later.") ||
                message.includes("Unknown command. Sorry!");
        }
    });
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
        script.log("[LatiteHiveAutoQueue] Found Map: " + mapName);
            for (const element of mapDodgerArray) {
                if (mapName.includes(element) && element !== "") {
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
