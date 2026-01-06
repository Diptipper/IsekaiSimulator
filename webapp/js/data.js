// --- ITEM CONFIGURATION ---
const ITEM_DEFINITIONS = { 
    "Copper dagger": { is_weapon:true, bonus_skills:new Skills(2,0,0,1) }, 
    "Rose Rapier": { is_weapon:true, bonus_skills:new Skills(5,1,0,3) }, // Quest Reward
    "Leather vest": { is_armor_body:true, bonus_hp:5, bonus_skills:new Skills(0,2,0,0) }, 
    "Silk Dress": { is_armor_body:true, bonus_hp:2, bonus_skills:new Skills(0,0,5,2) }, // Elara's Gift
    "Leather pants": { is_armor_leggings:true, bonus_hp:2, bonus_skills:new Skills(0,1,0,1) }
};

// --- GAME STATE & ENEMIES ---
const GlobalState = { 
    metGuard: false,
    introPlayed: false,
    combatIntroPlayed: false,
    quest_elara: "not_started", // not_started, started, saved, completed
    variables: {
        "player status": "unknown",
        "elera quest accept": false,
        "elara feeling": "scared",
    },
    activeVariable: "",
};

// Pre-defined Enemies
const copperSpider = new Enemy("Copper spider", 10, { "Copper spider legs": 1 }, new Skills(4,2,0,1));
const copperSpiderBoss = new Enemy("Giant Copper spider", 20, { "Copper spider legs": 1 }, new Skills(6,3,0,2));

// New Quest Enemies
const roseThorn = new Enemy("Thorn Spirit", 15, { "Rose petal": 1 }, new Skills(5,1,1,2));
const stoneGolem = new Enemy("Ruin Golem", 20, { "Stone chip": 2 }, new Skills(6,3,0,1));
const ruinBoss = new Enemy("Crimson Keeper", 30, { "Rose Rapier": 1, "Diamond key": 1 }, new Skills(8,5,2,1));

// --- DIALOGUE DATA ---

// --- DIALOGUE DATA ---
const introData = {
    "background": "heaven_clouds.png", 
    "speakers": {
        "Goddess": ["goddess.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue","Goddess","Dear Hero, yesterday, you died in a car accident in your world.", ["Goddess:fade in"]],
        ["dialogue","You","Huh? Is this another one of those Isekai bullshit that was popular a decade ago?", ["Goddess:shake"]],
        ["dialogue","Goddess","Yes, yes. Calm down. You already know the drill.", ["Goddess:move:(80%,0%)"]],
        ["dialogue","Goddess","Alright, I will send you down to another world.", ["Goddess:move:(20%,0%)"]],
        ["dialogue","Goddess","Oh. I almost forget. You can press C, or click the button on the top-right of the screen, to see your stats and equipments.", ["Goddess:move:(50%,0%)"]],
        ["dialogue","Goddess","Have fun there, my hero. And don't cause any trouble.", ["Goddess:fade out"]],
    ]
};

const introCombatData = {
    "background": "heaven_clouds.png", 
    "speakers": {
        "Goddess": ["goddess.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue","Goddess","During the combat, the attacker rolls the dice.", ["Goddess:fade in"]],
        ["dialogue","Goddess","If the number is greater than probability governed by the attacker's Luck stat, the attack is landed.", ["Goddess:move:(50%,0%)"]],
        ["dialogue","Goddess","The damage is given by the attacker's Attack subtracted by the receiver's Defense.", []],
        ["dialogue","Goddess","Good luck, Hero.", ["Goddess:fade out"]],
    ]
};

const guardData = {
    "background": "town_gate_bg.png",
    "speakers": {
        "Guard1": ["guard1.png", "(10%,0%)"],
        "Guard2": ["guard2.png", "(90%,0%)"]
    },
    "data": [
        ["dialogue","Guard1","Halt!", ["Guard1:fade in"]],
        ["dialogue","Guard2","Who goes there?", ["Guard2:fade in"]],
        ["question","Guard1","State your business.", ["Guard1:move:(15%,0%)","Guard2:move:(85%,0%)"]
                ,{  "I am an adventurer": "adventurer",
                    "Just passing through": "passerby" }],
        ["dialogue","Guard1","Alright! you may enter.", ["Guard1:change_sprite:guard1_happy.png", "Guard1:shake", "Guard2:shake"]],
    ]
};


const guardDataPassed = {
    "background": "town_gate_bg.png",
    "speakers": {
        "Guard1": ["guard1.png", "(10%,0%)"],
        "Guard2": ["guard2.png", "(90%,0%)"]
    },
    "data": [
        ["dialogue","Guard1","Halt!", ["Guard1:fade in"]],
        ["dialogue","Guard2","Who goes there?", ["Guard2:fade in"]],
        ["dialogue","Guard2","Oh, it's that {player status}.", ["Guard1:move:(15%,0%)","Guard2:move:(85%,0%)"]],
        ["dialogue","Guard1","Alright, you may enter.", ["Guard1:move:(10%,0%)","Guard2:move:(90%,0%)"]],
    ]
};

// --- NEW QUEST DIALOGUES ---

const mayorStartData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","Adventurer! Please, you must help me!", ["Mayor:fade in", "Mayor:shake"]],
        ["dialogue","Mayor","My daughter, Elara, went to the Whispering Ruins to pick flowers and hasn't returned.", []],
        ["question","Mayor","Will you save her?", [] 
            ,{ "I will bring her back": true, "Sounds dangerous...": false }],
    ]
};


const mayorStartAcceptData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","Oh, thank you! The Ruins are to the East. Please hurry!", ["Mayor:shake"]],
    ]
};
const mayorStartRejectData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","My god! If you change your mind, please come see me again!", ["Mayor:shake"]],
    ]
};

const mayorEndData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","You returned!", ["Mayor:fade in"]],
        ["dialogue","Mayor","But... where is Elara?", ["Mayor:shake"]],
        ["dialogue","You","She is safe. She just needs a moment.", []],
        ["dialogue","Mayor","Thank the gods! Here, take this gold as a reward.", []],
    ]
};

const elaraRescueData = {
    "background": "ruins_garden.png",
    "speakers": { "Elara": ["elara.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Elara","...Is it dead? Is the monster gone?", ["Elara:fade in", "Elara:shake"]],
        ["dialogue","You","It's over. You're safe now.", []],
        ["dialogue","Elara","My hero... I thought I would never see the sky again.", ["Elara:move:(50%,0%)"]],
        ["question","Elara","Why... why did you come for me?", [] 
            ,{ "The Mayor sent me": "it was merely duty", "I couldn't let such beauty fade": "your heart led you here" }],
        ["dialogue","Elara","I see... {elara feeling}.", ["Elara:shake"]],
        ["dialogue","Elara","Let's go home. I will never forget this.", ["Elara:fade out"]],
    ]
};

// --- WORLD MAP CONFIGURATION ---
const worldMap = {
    "scene:open world:Open World:world_map.png; fn_intro": {
        // TOWN
        "scene:town:➡️ To Town:town_square.png": {
            "scene:guard chat:💬 Talk to Guard:icon_shield.png; fn_dialogue_guard": null,
            "scene:mayor:💬 Mayor's House:icon_house.png; fn_dialogue_mayor": null, // NEW
            "scene:blacksmith:➡️ To Blacksmith:icon_anvil.png": {
                "craft:smelt ore:🔨 Smelt ore:icon_anvil.png": [1000, "Smelting ores...", { "input:Oak log": 0.5, "input:Copper ore": 1, "output:Copper ingot": 1 }],
                "craft:craft dagger:🔨 Copper dagger:icon_hammer.png": [1000, "Crafting...", { "input:Copper ingot": 1, "output:Copper dagger": 1 }],
                "return:return:🔙 Exit shop:icon_exit.png": {},
            },
            "return:return:🔙 Exit town:icon_exit.png": {},
        },
        // LOGGING
        "scene:logging camp:➡️ To Logging camp:forest_clearing.png": {
            "harvest:cut trees:🪓 Cut tree:icon_axe.png": [1000, "Chopping wood...", { "Oak log": 2, "Branch": 1 }],
            "return:return:🔙 Exit logging camp:icon_exit.png": {},
        },
        // QUARRY
        "scene:mining quarry:➡️ To Mining quarry:quarry_dark.png": {
            "harvest:mine ores:⛏️ Mine ores:icon_pickaxe.png": [1000, "Mining rocks...", { "Copper ore": 9, "Garnet": 1 }],
            "fight:spider:⚔️ Fight something:icon_sword.png; fn_intro_combat": [1000, "Fighting...", { "Copper spider": [1, copperSpider] }],
            "return:return:🔙 Exit mining quarry:icon_exit.png": {},
        },
        // NEW QUEST LOCATION: WHISPERING RUINS
        "scene:ruins:➡️ Whispering Ruins:ruins_entrance.png": {
            "dungeon:ruins dungeon:⚔️ Enter Ruins:icon_skull.png; fn_intro_combat":
            [
                [1000, "Fending off thorns...", { "Thorn Spirit": [1, roseThorn] }],
                [1500, "Crushing rocks...", { "Ruin Golem": [1, stoneGolem] }],
                [2000, "BOSS BATTLE...", { "Crimson Keeper": [1, ruinBoss] }]
            ],
            "scene:elara:🚪 Locked door:icon_heart.png; fn_dialogue_elara": null,
            "return:return:🔙 Leave Ruins:icon_exit.png": {},
        },
    },
};


// --- SCENE FUNCTIONS ---
const SceneFunctions = {
    fn_intro: function(next) {
        if (!GlobalState.introPlayed) {
            Game.startDialogue(introData, () => {
                GlobalState.introPlayed = true;
                const townKey = "scene:town:➡️ To Town:town_square.png";
                const townNode = worldMap["scene:open world:Open World:world_map.png; fn_intro"][townKey];
                Game.enterScene(townKey, townNode);
                if (next) next();
            });
        } else {
            if (next) next();
        }
    },
    fn_dialogue_guard: function(next) {
        GlobalState.activeVariable = "player status"

        if (!GlobalState.metGuard){
            Game.startDialogue(guardData, () => {
                // The dialogue has now ended (after the user picked a choice and read the rest of the text)
                const player_status = GlobalState.variables["player status"];
                if (player_status != 'unknown') {
                    Game.log(`Guard marks you as "${player_status}".`);
                    GlobalState.metGuard = true;
                } else {
                    Game.log("Guard lets you pass quietly.");
                }
                
                if (next) next();
            });      
        }
        else{
            Game.startDialogue(guardDataPassed, () => {});    
        }

    },
    fn_intro_combat: function(next) {
        if (!GlobalState.combatIntroPlayed) {
            Game.startDialogue(introCombatData, () => {
                GlobalState.combatIntroPlayed = true;
                if (next) next();
            });
        } else {
            if (next) next();
        }
    },

    fn_dialogue_mayor: function(next) {
        GlobalState.activeVariable = "elera quest accept"
        if (GlobalState.quest_elara === "not_started") {
            Game.startDialogue(mayorStartData, (res) => {
                if (GlobalState.variables["elera quest accept"]){
                    Game.startDialogue(mayorStartAcceptData,() => {})
                    GlobalState.quest_elara = "started";
                    Game.log("Quest Started: Rescue Elara!");
                }
                else{
                    Game.startDialogue(mayorStartRejectData,() => {})
                }
                if (next) next();
            });
        } else if (GlobalState.quest_elara === "saved") {
            Game.startDialogue(mayorEndData, () => {
                GlobalState.quest_elara = "completed";
                Game.player.addItem("Gold", 100);
                Game.log("Quest Complete! +100 Gold");
                if (next) next();
            });
        } else if (GlobalState.quest_elara === "completed") {
             Game.log("Mayor: Thank you forever!");
             if (next) next();
        } else {
             Game.log("Mayor: Please save her! She is in the Ruins.");
             if (next) next();
        }
    },
    
    fn_dialogue_elara: function(next) {
        if (GlobalState.quest_elara === "started") {
            if (Game.player.getItemCount("Diamond key") > 0){
                GlobalState.activeVariable = "elara feeling"; 
                
                Game.startDialogue(elaraRescueData, () => {
                    GlobalState.quest_elara = "saved";
                    
                    if (GlobalState.variables["elara feeling"] === "your heart led you here") {
                         Game.player.addItem("Silk Dress", 1);
                         Game.log("Romance triggered! Received Silk Dress.");
                    } else {
                         Game.log("Elara respects your professionalism.");
                    }
                    
                    if (next) next();
                });
            }
            else{
                Game.log("You need a key...");
                if (next) next();
            }
        } else if (GlobalState.quest_elara === "saved" || GlobalState.quest_elara === "completed") {
            Game.log("It's empty...");
            if (next) next();
        } else {
            Game.log("Nothing to see here...");
            if (next) next();
        }
    },
};
