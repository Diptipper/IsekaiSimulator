// =============================================================
// SECTION 1: BASE CONFIGURATION
// =============================================================

// --- DATA CONTAINERS ---
const ITEM_DEFINITIONS = {};
const INTERACTION_REGISTRY = {};
const GlobalState = { 
    variables: {}, 
    activeVariable: "" 
};

// --- SCENE CONTAINERS ---
const townData = { 
    "return:return:🔙 Exit town:icon_exit.png": {},
};
const woodsData = {
    "return:return:🔙 Exit the woods:icon_exit.png": {},
};
const ruinsData = {
    "return:return:🔙 Leave Ruins:icon_exit.png": {},
};
const quarryData = {
     "return:return:🔙 Exit mining quarry:icon_exit.png": {},
};


// =============================================================
// SECTION 2: SYSTEM MODULES (Core Mechanics)
// =============================================================

// --- BASE ITEMS & VARIABLES ---
Object.assign(ITEM_DEFINITIONS, {
    "Grass": { description: "Common green grass." },
    "Oak log": { description: "Sturdy wood." },
    "Branch": { description: "A small stick." },
    "Copper ore": { description: "Unrefined copper." },
    "Copper ingot": { description: "Smelted metal." },
    "Copper dagger": { is_weapon:true, bonus_skills:new Skills(2,0,0,1) },
    "Garnet": { description: "A red gem." }
});

Object.assign(GlobalState.variables, {
    "introPlayed": false,
    "combatIntroPlayed": false,
    "woods_visited": false,
});

// --- MODULE: INTRO SCENE ---
const introData = {
    "background": "heaven_clouds.png", "speakers": { "Goddess": ["goddess.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Goddess","Dear Hero, yesterday, you died in a car accident in your world.", ["Goddess:fade in"]],
        ["dialogue","You","Huh? Is this another one of those Isekai bullshit that was popular a decade ago?", ["Scene:shake"]],
        ["dialogue","Goddess","Yes, yes. Calm down. You already know the drill.", ["Goddess:move:(80%,0%)"]],
        ["dialogue","Goddess","Alright, I will send you down to another world.", ["Goddess:move:(20%,0%)"]],
        ["dialogue","Goddess","Oh. I almost forget. You can press C, or click the button on the top-right of the screen, to see your stats and equipments.", ["Goddess:move:(50%,0%)"]],
        ["dialogue","Goddess","Have fun there, my hero. And don't cause any trouble.", ["Goddess:fade out"]],
    ]
};

INTERACTION_REGISTRY["intro_logic"] = [
    {
        condition: { var: "introPlayed", op: "==", val: true },
        data: {}
    },
    { 
        condition: "default",
        data: {
            dialogue: introData,
            on_finish: {
                actions: [
                    { type: "set_state", key: "introPlayed", val: true },
                    { type: "goto", target: "town" }
                ]
            }
        }
    }
];

// --- MODULE: COMBAT TUTORIAL ---
const introCombatData = {
    "background": "heaven_clouds.png", "speakers": { "Goddess": ["goddess.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Goddess","During the combat, the attacker rolls the dice.", ["Goddess:fade in"]],
        ["dialogue","Goddess","If the number is greater than probability governed by the attacker's Luck stat, the attack is landed.", ["Goddess:move:(50%,0%)"]],
        ["dialogue","Goddess","The damage is given by the attacker's Attack subtracted by the receiver's Defense.", []],
        ["dialogue","Goddess","Good luck, Hero.", ["Goddess:fade out"]],
    ]
};

INTERACTION_REGISTRY["combat_tutorial"] = [
    {
        condition: { var: "combatIntroPlayed", op: "==", val: true },
        data: {}
    },
    {
        condition: "default",
        data: {
            dialogue: introCombatData,
            on_finish: {
                actions: [
                    { type: "set_state", key: "combatIntroPlayed", val: true },
                    { type: "log", text: "Tutorial Complete." }
                ]
            }
        }
    }
];

// --- MODULE: WOODS ATMOSPHERE ---
INTERACTION_REGISTRY["woods_intro"] = [
    {
        condition: { var: "woods_visited", op: "==", val: true }, data: {}
    },
    {
        condition: "default",
        data: { 
            dialogue: {
                background: "woods.png",
                speakers: { "You": ["hero_scared.png", "(50%,0%)"] },
                data: [
                    ["dialogue", "You", "It's... unnaturally quiet here.", ["You:shake"]],
                    ["dialogue", "You", "I should keep my weapon ready.", []]
                ]
            },
            on_finish: {
                actions: [
                    { type: "set_state", key: "woods_visited", val: true }
                ]
            }
        }
    }
];


// =============================================================
// SECTION 3: CONTENT MODULES (Quests & Shops)
// =============================================================

// -------------------------------------------------------------
// MODULE: THE BLACKSMITH (Crafting Shop)
// -------------------------------------------------------------
townData["scene:blacksmith:➡️ To Blacksmith:icon_anvil.png"] = {
    "return:return:🔙 Exit shop:icon_exit.png": {},
    "craft:smelt ore:🔨 Smelt ore:icon_anvil.png": [1000, "Smelting ores...", { "input:Oak log": 0.5, "input:Copper ore": 1, "output:Copper ingot": 1 }],
    "craft:craft dagger:🔨 Copper dagger:icon_hammer.png": [1000, "Crafting...", { "input:Copper ingot": 1, "output:Copper dagger": 1 }],
};

// -------------------------------------------------------------
// MODULE: THE GATE GUARD
// -------------------------------------------------------------
Object.assign(GlobalState.variables, { "metGuard": false, "player status": "unknown" });

const guardData = {
    "background": "town_gate_bg.png",
    "speakers": {
        "Guard1": ["guard1.png", "(10%,0%)"],
        "Guard2": ["guard2.png", "(90%,0%)"]
    },
    "data": [
        ["dialogue","Guard1","Halt!", ["Guard1:fade in"]],
        ["dialogue","Guard2","Who goes there?", ["Guard2:fade in"]],
        ["question","Guard1","State your business.", ["Guard1:move:(15%,0%)","Guard2:move:(85%,0%)"] ,{
            "I am an adventurer": "adventurer",
            "Just passing through": "passerby"
        }],
        ["dialogue","Guard1","Alright! you may enter.", ["Guard1:change_sprite:guard1_happy.png", "Guard1:shake", "Guard2:shake"]]
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
        ["dialogue","Guard1","Alright, you may enter.", ["Guard1:move:(10%,0%)","Guard2:move:(90%,0%)"]]
    ]
};

INTERACTION_REGISTRY["guard_logic"] = [
    {
        condition: {var: "metGuard", op: "==", val: true },
        data: {
            dialogue: guardDataPassed
        }
    },
    {
        condition: "default",
        data: {
            dialogue: guardData,
            binding: "player status",
            on_finish: {
                actions: [
                    { type: "set_state", key: "metGuard", val: true },
                    { type: "log", text: "Guard lets you pass." }
                ]
            }
        }
    }
];

townData["scene:guard chat:💬 Talk to Guard:icon_shield.png; fn_interaction:guard_logic"] = null;


// -------------------------------------------------------------
// MODULE: QUEST - RESCUE ELARA
// -------------------------------------------------------------
Object.assign(ITEM_DEFINITIONS, {
    "Rose Rapier": { is_weapon:true, bonus_skills:new Skills(5,1,0,3) },
    "Silk Dress": { is_armor_body:true, bonus_hp:2, bonus_skills:new Skills(0,0,5,2) },
    "Leather vest": { is_armor_body:true, bonus_hp:5, bonus_skills:new Skills(0,2,0,0) },
    "Diamond key": { description: "Unlocks the boss door." }
});

const roseThorn = new Enemy("Thorn Spirit", 15, { "Rose petal": 1 }, new Skills(5,1,1,2));
const stoneGolem = new Enemy("Ruin Golem", 20, { "Stone chip": 2 }, new Skills(6,3,0,1));
const ruinBoss = new Enemy("Crimson Keeper", 30, { "Rose Rapier": 1, "Diamond key": 1 }, new Skills(8,5,2,1));

Object.assign(GlobalState.variables, { "quest_elara": "not_started", "elara quest accept": false, "elara feeling": "scared" });

const mayorStartData = {
    "background": "town_square.png",
    "speakers": {
        "Mayor": ["mayor.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue","Mayor","Adventurer! Please, you must help me!", ["Mayor:fade in", "Mayor:shake"]],
        ["dialogue","Mayor","My daughter, Elara, went to the Whispering Ruins to pick flowers and hasn't returned.", []],
        ["question","Mayor","Will you save her?", [] ,{
            "I will bring her back": true,
            "Sounds dangerous...": false
        }]
    ]
};
const mayorStartAcceptData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","Oh, thank you! The Ruins are to the East. Please hurry!", ["Mayor:shake"]]
    ]
};
const mayorStartRejectData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","My god! If you change your mind, please come see me again!", ["Mayor:shake"]]
    ]
};
const mayorEndData = {
    "background": "town_square.png",
    "speakers": { "Mayor": ["mayor.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Mayor","You returned!", ["Mayor:fade in"]],
        ["dialogue","Mayor","But... where is Elara?", ["Mayor:shake"]],
        ["dialogue","You","She is safe. She just needs a moment.", []],
        ["dialogue","Mayor","Thank the gods! Here, take this gold as a reward.", []]
    ]
};

const elaraRescueData = { "background": "ruins_garden.png",
    "speakers": { "Elara": ["elara.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Elara","...Is it dead? Is the monster gone?",["Elara:fade in", "Elara:shake"]],
        ["dialogue","You","It's over. You're safe now.", []],
        ["dialogue","Elara","My hero... I thought I would never see the sky again.",["Elara:move:(50%,0%)"]],
        ["question","Elara","Why... why did you come for me?", [] ,{
            "The Mayor sent me": "it was merely duty",
            "I couldn't let such beauty fade": "your heart led you here" }
        ],
        ["dialogue","Elara","I see... {elara feeling}.", ["Elara:shake"]],
        ["dialogue","Elara","Let's go home. I will never forget this.", ["Elara:fade out"]]
    ]
};

INTERACTION_REGISTRY["mayor_logic"] = [
    {
        condition: { var: "quest_elara", op: "==", val: "saved" },
        data: {
            dialogue: mayorEndData,
            on_finish: {
                actions: [
                    { type: "set_state", key: "quest_elara", val: "completed" },
                    { type: "reward", item: "Gold", count: 100 },
                    { type: "log", text: "Quest Complete! +100 Gold" }
                ]
            }
        }
    },
    {
        condition: { var: "quest_elara", op: "==", val: "completed" },
        data: {
            dialogue: {
                speakers:{"Mayor":["mayor.png","(50%,0%)"]},
                background:"town_square.png",
                data:[
                    ["dialogue","Mayor","Thank you forever!",["Mayor:fade in"]]
                ]
            }
        }
    },
    {
        condition: { var: "quest_elara", op: "==", val: "started" },
        data: {
            dialogue: mayorStartAcceptData
        }
    },
    {
        condition: "default",
        data: {
            dialogue: mayorStartData,
            binding: "elara quest accept",
            on_finish: {
                check_var: "elara quest accept",
                if_true: {
                    dialogue: mayorStartAcceptData,
                    actions: [
                        { type: "set_state", key: "quest_elara", val: "started" },
                        { type: "log", text: "Quest Started: Rescue Elara!" }
                    ]
                },
                if_false: {
                    dialogue: mayorStartRejectData
                }
            }
        }
    }
];

INTERACTION_REGISTRY["elara_logic"] = [
    {
        condition: [
            { var: "quest_elara", op: "==", val: "started" },
            { type: "item", id: "Diamond key", op: ">=", val: 1 }
        ],
        data: {
            dialogue: elaraRescueData,
            binding: "elara feeling",
            on_finish: {
                check_var: "elara feeling",
                if_value: {
                    "your heart led you here": {
                        actions: [
                            { type: "reward", item: "Silk Dress", count: 1 },
                            { type: "log", text: "Romance triggered! Received Silk Dress." }
                        ]
                    },
                    "default": {
                        actions: [
                            { type: "log", text: "Elara respects your professionalism." }
                        ]
                    }
                },
                actions: [
                    { type: "set_state", key: "quest_elara", val: "saved" }
                ]
            }
        }
    },
    {
        condition: { var: "quest_elara", op: "==", val: "started" },
        data: {
            log_only: "You need a key to unlock this door..." }
        },
    {
        condition: { var: "quest_elara", op: "in", val: ["saved", "completed"] },
        data: {
            log_only: "It's empty..." }
        },
    {
        condition: "default",
        data: {
            log_only: "Nothing to see here..."
        }
    }
];

townData["scene:mayor:💬 Mayor's House:icon_house.png; fn_interaction:mayor_logic"] = null;
ruinsData["dungeon:ruins dungeon:⚔️ Enter Ruins:icon_skull.png; fn_interaction:combat_tutorial"] = [
    [1000, "Fending off thorns...", { "Thorn Spirit": [1, roseThorn] }],
    [1500, "Crushing rocks...", { "Ruin Golem": [1, stoneGolem] }],
    [2000, "BOSS BATTLE...", { "Crimson Keeper": [1, ruinBoss] }]
];
ruinsData["scene:elara:🚪 Locked door:icon_heart.png; fn_interaction:elara_logic"] = null;


// -------------------------------------------------------------
// MODULE: QUEST - THE MERCHANT
// -------------------------------------------------------------
Object.assign(ITEM_DEFINITIONS, { "Emerald root": { description: "Rare herb." }, "Leather pants": { is_armor_leggings:true, bonus_hp:2, bonus_skills:new Skills(0,1,0,1) } });
Object.assign(GlobalState.variables, { "quest_merchant": "not_started", "merchant quest accept": false });

const merchantStartData = {
    "background": "town_square.png",
    "speakers": {
        "Merchant": ["merchant.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue","Merchant","Hello there! I'm running low on supplies.", ["Merchant:fade in"]],
        ["question","Merchant","Could you go to the woods and find me 3 Emerald roots?", [] ,{
            "Sure thing": true,
            "Not now": false
        }]
    ]
};
const merchantEndData = {
    "background": "town_square.png",
    "speakers": {
        "Merchant": ["merchant.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue","Merchant","Ah! You found them!", ["Merchant:fade in", "Merchant:shake"]],
        ["dialogue","Merchant","These are perfect. Here, take these pants I ... uh ... found.", []]
    ]
};
const merchantWaitData = {
    "background": "town_square.png",
    "speakers": {
        "Merchant": ["merchant.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue","Merchant","I need 3 Emerald roots. They are rare drops in the woods.", ["Merchant:fade in"]]
    ]
};

INTERACTION_REGISTRY["merchant_logic"] = [
    {
        condition: {var: "quest_merchant", op: "==", val: "completed" },
        data: {
            log_only: "Merchant: Thanks again for those roots!" }
        },
    {
        condition: [
            { var: "quest_merchant", op: "==", val: "started" },
            { type: "item", id: "Emerald root", op: ">=", val: 3 }
        ], 
        data: {
            dialogue: merchantEndData,
            on_finish: {
                actions: [
                    { type: "consume", item: "Emerald root", count: 3 },
                    { type: "reward", item: "Leather pants", count: 1 },
                    { type: "set_state", key: "quest_merchant", val: "completed" },
                    { type: "log", text: "Quest Complete: Received Leather pants" }
                ]
            }
        }
    },
    {
        condition: { var: "quest_merchant", op: "==", val: "started" },
        data: { dialogue: merchantWaitData }
    },
    {
        condition: "default",
        data: {
            dialogue: merchantStartData,
            binding: "merchant quest accept",
            on_finish: {
                check_var: "merchant quest accept",
                if_true: {
                    actions: [
                        { type: "set_state", key: "quest_merchant", val: "started" },
                        { type: "log", text: "Quest Started: Gather 3 Emerald Roots" }
                    ]
                },
                if_false: {
                    actions: [
                        { type: "log", text: "Maybe later..." }
                    ]
                }
            }
        }
    }
];

townData["scene:merchant:💬 Merchant:icon_bag.png; fn_interaction:merchant_logic"] = null;
woodsData["harvest:cut trees:🌿 Forage:icon_plants.png"] = [ 1000, "Foraging...", { "Grass": 3, "Emerald root": 1 } ];


// -------------------------------------------------------------
// MODULE: QUEST - LADY V (SEDUCTRESS)
// -------------------------------------------------------------
Object.assign(GlobalState.variables, { "quest_seductress": "not_started", "seductress_consent": false });

const barFlirtData = {
    "background": "tavern.png",
    "speakers": {
        "Lady V": ["seductress.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue", "Lady V", "Well hello there, traveler. You look... tense.", ["Lady V:fade in"]],
        ["dialogue", "Lady V", "A strong hero like you deserves a break.", ["Lady V:move:(60%,0%)"]],
        ["dialogue", "Lady V", "My house is just down the street. It has a very... comfortable bed.",["Lady V:move:(50%,0%)"]],
        ["question", "Lady V", "", [], {
            "Buy her a drink & go with her": true,
            "Refuse": false
        }]
    ]
};
const barAgreedData = {
    "background": "tavern.png",
    "speakers": {
        "Lady V": ["seductress.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue", "Lady V", "Wise choice, handsome.", ["Lady V:change_sprite:seductress_happy.png","Lady V:fade in","Lady V:scale:1.2"]],
        ["dialogue", "Lady V", "Follow me. It's not far.", ["Lady V:fade out","Lady V:scale:1.0"]]
    ]
};
const nightSceneData = {
    "background": "bedroom.png",
    "speakers": {
        "Lady V": ["seductress.png", "(50%,0%)"]
    },
    "data": [
        ["dialogue", "Lady V", "Here we are.", ["Lady V:fade in"]],
        ["dialogue", "Lady V", "Make yourself at home...", []],
        ["dialogue", "Lady V", "I'll slip into something more comfortable.", ["Lady V:fade out"]],
        ["dialogue", "", "...(a few minutes later)...", []],
        ["dialogue", "", "*ahh*", ["Scene:shake"]],
        ["dialogue", "", "Fuck.", []],
        ["dialogue", "", "Harder!", []],
        ["dialogue", "", "*ahh*", ["Scene:shake"]],
        ["dialogue", "", "I'm coming!", ["Scene:shake"]],
        ["dialogue", "", "...", []],
        ["dialogue", "", "...(one night later)...", []],
        ["dialogue", "Lady V", "Good morning, tiger.", ["Lady V:fade in"]],
        ["dialogue", "Lady V", "That was... certainly exciting.", []],
        ["dialogue", "Lady V", "Feel free to drop by anytime.", []]
    ]
};

INTERACTION_REGISTRY["seductress_bar_logic"] = [
    {
        condition: "default",
        data: {
            dialogue: barFlirtData,
            binding: "seductress_consent",
            on_finish: {
                check_var: "seductress_consent",
                if_true: {
                    dialogue: barAgreedData,
                    actions: [
                        { type: "set_state", key: "quest_seductress", val: "started" },
                        { type: "goto", target: "Lady V's house" }
                    ]
                },
                if_false: {
                    actions: [
                        { type: "log", text: "Maybe later." }
                    ]
                }
            }
        }
    }
];

INTERACTION_REGISTRY["seductress_house_enter"] = [
    {
        condition: { var: "quest_seductress", op: "==", val: "started" },
        data: {
            dialogue: nightSceneData,
            on_finish: {
                actions: [
                    { type: "set_state", key: "quest_seductress", val: "completed" },
                    { type: "log", text: "HP Restored" },
                    { type: "reward", item: "Gold", count: 0 }
                ]
            }
        }
    },
    {
        condition: "default",
        data: {}
    }
];

INTERACTION_REGISTRY["seductress_house_logic"] = [
    {
        condition: { var: "quest_seductress", op: "==", val: "completed" },
        data: { log_only: "Lady V: Come back tonight, handsome..." }
    },
    {
        condition: "default",
        data: {
            log_only: "Lady V: Make yourself at home."
        }
    }
];

townData["scene:bar:🍺 Tavern:tavern.png"] = {
    "return:return:🔙 Leave Tavern:icon_exit.png": {},
    "scene:lady:💃 Talk to Lady V:icon_lips.png; fn_interaction:seductress_bar_logic": null,
};
const seductressHouse = {
    "return:return:🚪 Leave House:town_square.png": {},
    "scene:lady_morning:💃 Talk to Lady V:icon_lips.png; fn_interaction:seductress_house_logic": null,
};
townData["scene:Lady V's house:🏠 Lady V's House:bedroom.png; fn_interaction:seductress_house_enter"] = seductressHouse;


// -------------------------------------------------------------
// MODULE: QUARRY & SPIDERS
// -------------------------------------------------------------
const copperSpider = new Enemy("Copper spider", 10, { "Copper spider legs": 1 }, new Skills(4,2,0,1));
quarryData["harvest:mine ores:⛏️ Mine ores:icon_pickaxe.png"] = [1000, "Mining rocks...", { "Copper ore": 9, "Garnet": 1 }];
quarryData["fight:spider:⚔️ Fight something:icon_sword.png; fn_interaction:combat_tutorial"] = [1000, "Fighting...", { "Copper spider": [1, copperSpider] }];


// =============================================================
// SECTION 4: WORLD MAP ASSEMBLY
// =============================================================

const worldMap = {
    "scene:open world:Open World:world_map.png; fn_interaction:intro_logic": {
        "scene:town:➡️ To Town:town_square.png": townData,
        "scene:logging camp:➡️ To Logging camp:forest_clearing.png": {
            "return:return:🔙 Exit logging camp:icon_exit.png": {},
            "harvest:cut trees:🪓 Cut tree:icon_axe.png": [1000, "Chopping wood...", { "Oak log": 2, "Branch": 1 }],
        },
        "scene:mystical woods:➡️ To Mystic Woods:woods.png; fn_interaction:woods_intro": woodsData,
        "scene:mining quarry:➡️ To Mining quarry:quarry_dark.png": quarryData,
        "scene:ruins:➡️ Whispering Ruins:ruins_entrance.png": ruinsData,
    },
};