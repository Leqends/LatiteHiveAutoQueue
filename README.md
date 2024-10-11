# Hive Auto Queue for Latite Client

## Description
This project is a simple plugin that allows the user to automatically queue up for games in the Hive Minecraft server. It is designed to be used only with Latite Client.

---

## How to Install

1. **Download the zip from releases**
2. **Extract the zip file**
3. **Move the extracted folder to ```%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\RoamingState\LatiteRecode\Plugins```**
4. **Launch Latite Client and enable the plugin in the mods menu**

---

## How It Works
The plugin works by running the /connection command on every dimension load. It then takes the game name by the "SERVER-NAME" text in the chat and then filters out the numbers in the text. 
It then stores the game name as the current game. It then detects for "Game" or "Victory" text in the title event, and if its shown it will then queue to the next game. 

Currently, the plugin only works for Victory screen and will not work for auto queue on death. This is done in favor of the upcoming party system to the plugin.

---

> "The only way to do great work is to love what you do." — Steve Jobs
