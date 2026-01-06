// --- ITEM CONFIGURATION ---
const ITEM_DEFINITIONS = { 
    "Copper dagger": { is_weapon:true, bonus_skills:new Skills(2,0,0,1) }, 
    "Leather vest": { is_armor_body:true, bonus_hp:5, bonus_skills:new Skills(0,2,0,0) }, 
    "Leather pants": { is_armor_leggings:true, bonus_hp:2, bonus_skills:new Skills(0,1,0,1) }
};

// --- GAME STATE & ENEMIES ---
const GlobalState = { 
    metGuard: false,
    introPlayed: false,
    combatIntroPlayed: false,
    variables: {
        "player status":"unknown"
    },
    activeVariable: "",
};

// Pre-defined Enemies
const copperSpider = new Enemy("Copper spider", 10, { "Copper spider legs": 1 }, new Skills(4,2,0,1));
const copperSpiderBoss = new Enemy("Giant Copper spider", 20, { "Copper spider legs": 1 }, new Skills(6,3,0,2));

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

// --- WORLD MAP CONFIGURATION ---
// Note: We reference function names as strings here to be handled by the engine
const worldMap = {
    "scene:open world:Open World:world_map.png; fn_intro": {
        "scene:town:➡️ To Town:town_square.png": {
            "scene:guard chat:💬 Talk to Guard:icon_shield.png; fn_dialogue_guard": null,
            "scene:blacksmith:➡️ To Blacksmith:icon_anvil.png": {
                "craft:smelt ore:🔨 Smelt ore:icon_anvil.png": [1000, "Smelting ores...", { "input:Oak log": 0.5, "input:Copper ore": 1, "output:Copper ingot": 1 }],
                "craft:craft dagger:🔨 Copper dagger:icon_hammer.png": [1000, "Crafting...", { "input:Copper ingot": 1, "output:Copper dagger": 1 }],
                "return:return:🔙 Exit shop:icon_exit.png": {},
            },
            "return:return:🔙 Exit town:icon_exit.png": {},
        },
        "scene:logging camp:➡️ To Logging camp:forest_clearing.png": {
            "harvest:cut trees:🪓 Cut tree:icon_axe.png": [1000, "Chopping wood...", { "Oak log": 2, "Branch": 1 }],
            "return:return:🔙 Exit logging camp:icon_exit.png": {},
        },
        "scene:mining quarry:➡️ To Mining quarry:quarry_dark.png": {
            "harvest:mine ores:⛏️ Mine ores:icon_pickaxe.png": [1000, "Mining rocks...", { "Copper ore": 9, "Garnet": 1 }],
            "fight:spider:⚔️ Fight something:icon_sword.png; fn_intro_combat": [1000, "Fighting...", { "Copper spider": [1, copperSpider] }],
            "return:return:🔙 Exit mining quarry:icon_exit.png": {},
        },
        "scene:abandoned cave:➡️ To Abandoned Cave:cave_dark.png": {
            "dungeon:cave dungeon:🦇 Enter the dungeon:icon_sword.png; fn_intro_combat":
            [
                [1000, "Fighting...", { "Copper spider": [1, copperSpider] }],
                [1000, "Fighting...", { "Copper spider": [1, copperSpider] }],
                [1000, "Fighting Boss...", { "Giant Copper spider": [1, copperSpiderBoss] }]
            ],
            "return:return:🔙 Exit the cave:icon_exit.png": {},
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
    }
};
