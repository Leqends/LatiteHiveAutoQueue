//@ts-check
"use strict";

// Setup
let hiveAutoQueue = new Module("HiveAutoQueue",
    "Hive Auto Queue", "A plugin to automatically queue into the next game in Hive");

// This adds the input box for which maps to dodge
let mapDodger = new hiveAutoQueue.addTextSetting("mapDodger",
    "Map Dodge List", "The map to dodge", "");

// Current game mode
let gameMode = null;

let partyMembers = new hiveAutoQueue.addTextSetting("partyMembers",
    "Party Members", "The members of the party, this is automatically managed", "");

let deadMembers = [];
let aliveMembers = [];

client.getModuleManager().registerModule(hiveAutoQueue);

/**
 * Function to find the current game mode by using connection command
 * and listening to the chat message provided by the command to get the game
 */
function findGamemode() {
    game.executeCommand("/connection");

    client.on("receive-chat", chat => {
        let message = chat.message;
        if(chat.sender === "") {
            chat.cancel = message.includes("You are connected to public IP") ||
                message.includes("You are connected to internal IP");

            if(message.includes("You are connected to server name")) {
                chat.cancel = true;
                gameMode = message.split("You are connected to server name")[1];
                gameMode = gameMode.replace(/\d+/g,"").trim();
            } else {
                chat.cancel = false;
            }

            chat.cancel = message.includes("You are connected to server");
        }
    });
}

/**
 * Function to queue into the next game
 */
function queueNextGame() {
    if(!gameMode) {
        game.executeCommand("/q " + gameMode);
    }
}

/**
 * Function to find the party members
 */
function findPartyMembers() {
    game.executeCommand("/party list");

    /**
     * TODO: Detection of party members
     */

    client.on("receive-chat", chat => {
        let message = chat.message;
        if(chat.sender === "") {
            chat.cancel = message.includes("You're issuing commands too quickly, try again later.") ||
                message.includes("Unknown command. Sorry!");
        }
    });
}

/**
 * Listen for title content to detect if the game is over
 */
client.on("title", title => {
   let titleText = title.text;
   let server = game.getFeaturedServer();
   if(hiveAutoQueue.isEnabled()) {
       if(server.includes("hive")) {
           /**
            * TODO: Check if the player is solo and queue if the player is dead
            */
           if (titleText.includes("Over") || titleText.includes("Victory")) {
               queueNextGame();
           }
       }
   }
});

client.on("receive-chat", chat => {
    let message = chat.message;
    let mapDodgerArray = mapDodger.getValue().split(",");
    if(hiveAutoQueue.isEnabled()) {
        if (chat.sender === "") {

            /**
             * TODO: Do party death detection
             */
            if (message.includes("won with") && message.includes("votes!")) {
                let mapName = message.split(" ")[1];
                for (let i = 0; i < mapDodgerArray.length; i++) {
                    if (mapName === mapDodgerArray[i]) {
                        queueNextGame();
                    }
                }
            }
        }
    }
});

client.on("change-dimension", chat => {
    if(hiveAutoQueue.isEnabled()) {
        findGamemode();
        client.on("receive-chat", chat => {
            let message = chat.message;
            if (chat.sender === "") {
                chat.cancel = message.includes("You're issuing commands too quickly, try again later.") ||
                    message.includes("Unknown command. Sorry!");
            }
        });
    }
});