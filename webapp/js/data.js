
// --- DATA CONTAINERS ---
let ITEM_DEFINITIONS = {};
let FOLLOWER_DEFINITIONS = {};
let INTERACTION_REGISTRY = {};
let GLOBAL_STATE = { 
    variables: {}, 
    activeVariable: "" 
};
function AppendIntRegEntry(key, list) {
    if (key in INTERACTION_REGISTRY) INTERACTION_REGISTRY[key] = list.concat(INTERACTION_REGISTRY[key]); 
    else INTERACTION_REGISTRY[key] = list;
}


// ============================================================================================
// ============================================================================================
//     Quest template
// ============================================================================================
// ============================================================================================
//
// :::::: Items :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Enemies :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Followers :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Maps ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Dialogues :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Variables :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Interaction Registry ::::::::::::::::::::::::::::::::::::::::::::::::::



// ============================================================================================
// ============================================================================================
//     Starting Quest
// ============================================================================================
// ============================================================================================
//
//   Drop the player to one of the following locations
//     1. Castle
//     2. Town
//     3. Adventurer guild
//     4. In the forest
//

// :::::: Maps ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

let CastleData = {"return:return:🔙 Exit:icon.png": {}}
let AdvGuildData = {"return:return:🔙 Exit:icon.png": {}}
let TownData = {
    "return:return:🔙 Exit:icon.png": {},
    "scene:castle:🏰 Castle:icon.png; fn_interaction:castle" : CastleData,
    "scene:adventurer's guild:🧝 Adventurer's guild:icon.png; fn_interaction:adv_guild" : AdvGuildData,
}

let WoodsData = {"return:return:🔙 Exit:icon.png": {}}
let OpenWorld = {
    "scene:town:🏬 Town:icon.png" : TownData,
    "scene:woods:🌲 Woods:icon.png; fn_interaction:woods" : WoodsData
};
let WORLD_MAP = { "scene:open world:Open World:icon.png; fn_interaction:game_intro": OpenWorld};

/* Always create a blank interaction registry */
AppendIntRegEntry("game_intro", [ { condition: "default", data: {} }, ])
AppendIntRegEntry("castle",     [ { condition: "default", data: {log_only: "Guard: Begone, pleb!"} }, ])
AppendIntRegEntry("adv_guild",  [ { condition: "default", data: {} }, ])
AppendIntRegEntry("woods",      [ { condition: "default", data: {} }, ])

// decide where the starting scene would take place
const startingScene = "scene:open world:Open World:icon.png; fn_interaction:game_intro"

// :::::: Dialogues :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

const introDlg = {
    "background": "heaven_clouds.png", "speakers": { "Goddess": ["goddess.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Goddess","Dear Hero, yesterday, you died in a car accident in your world.", ["Goddess:fade in"]],
        ["dialogue","You","Huh? Is this another one of those Isekai bullshit that was popular a decade ago?", ["Scene:shake"]],
        ["dialogue","Goddess","Yes, yes. Calm down.", ["Goddess:move:(80%,0%)"]],
        ["dialogue","Goddess","I will let you choose where to start your life in another world.", ["Goddess:move:(20%,0%)"]],
        ["dialogue","You","Really? Can I get my cheat power too?", ["Goddess:move:(50%,0%)"]],
        ["dialogue","Goddess","Don't be greedy!", ["Scene:shake","Goddess:shake"]],
        ["dialogue","Goddess","Now choose!", []],
        ["question","Goddess","Now choose!", [] ,{
            "I want to be the brave hero.": "castle",
            "I want to be dropped in the town.": "in town",
            "I want to be an adventurer.": "adventurer",
            "Drop me wherever.": "woods",
        }],
        ]
};
const intro2Dlg = {
    "background": "heaven_clouds.png", "speakers": { "Goddess": ["goddess.png", "(50%,0%)"] },
    "data": [
        ["dialogue","Goddess","Alright, I will send you down to another world.", ["Goddess:show"]],
        ["dialogue","Goddess","Have fun there, my hero. And don't cause any trouble.", ["Goddess:fade out"]],
        ]
};

// :::::: Variables :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(GLOBAL_STATE.variables, {
    "introPlayed": false,
    "starting location": "unknown"
});

// :::::: Interaction Registry ::::::::::::::::::::::::::::::::::::::::::::::::::

AppendIntRegEntry("game_intro", [
    { 
        condition: [
            { var: "introPlayed", op: "==", val: false }
        ],
        data: {
            dialogue: introDlg,
            binding: "starting location",
            on_finish: {
                check_var: "starting location",
                switch_case: {
                    "castle":{
                        dialogue: intro2Dlg,
                        actions: [
                            { type: "set_state", key: "introPlayed", val: true },
                            { type: "goto", target: "castle" }
                        ]
                    },
                    "in town":{
                        dialogue: intro2Dlg,
                        actions: [
                            { type: "set_state", key: "introPlayed", val: true },
                            { type: "goto", target: "town" }
                        ]
                    },
                    "adventurer":{
                        dialogue: intro2Dlg,
                        actions: [
                            { type: "set_state", key: "introPlayed", val: true },
                            { type: "goto", target: "adventurer's guild" }
                        ]
                    },
                    "woods":{
                        dialogue: intro2Dlg,
                        actions: [
                            { type: "set_state", key: "introPlayed", val: true },
                            { type: "goto", target: "woods" }
                        ]
                    },
                }
            }
        }
    },
]);



// ============================================================================================
// ============================================================================================
//     Demon Lord Quest
// ============================================================================================
// ============================================================================================
//
//    1. If the player is summoned, start the quest.
//    2. The player then go fight the demon king.
//    3. Come back to the king to get the reward.
//

// :::::: Items :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(ITEM_DEFINITIONS, {
    "Demon Horn": { description: "Evidence of defeating the Demon King." },
    "Hero's Medal": { description: "Proof of saving the world." },
    "Legendary Sword": { is_weapon:true, bonus_skills:new Skills(10,5,2,5) } // High stats needed
});

// :::::: Enemies :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

const demonGuard = new Enemy("Shadow Knight", 30, { }, new Skills(6, 1, 0, 1));
const demonKing = new Enemy("Demon King", 100, { "Legendary Sword": 1 }, new Skills(15, 2, 5, 2));

//const demonGuard = new Enemy("Shadow Knight", 10, { }, new Skills(1,0,0,1));
//const demonKing = new Enemy("Demon King", 10, { "Legendary Sword": 1 }, new Skills(1,0,0,1));


// :::::: Maps ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

OpenWorld["scene:Demon king's Castle:😈 Dark Castle:icon.png"] = {
    "return:return:🔙 Exit:icon.png": {},
    "dungeon:throne:☠️ Approach Throne:icon.png; fn_interaction:demon_king": [
        [1000, "Fighting guards...", { "Shadow Knight": [1, demonGuard] }],
        [1000, "EPIC BATTLE...", { "Demon King": [1, demonKing] }],
        ["fn_interaction:demon_king_defeated"]
    ],
}
AppendIntRegEntry("demon_king",[ { condition: "default", data: {} }, ])

// :::::: Dialogues :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// STAGE 1: Initial summoning
const introCastleDlg = {
    "background": "royal_chamber.png", 
    "speakers": { "King": ["king.png", "(50%,0%)"] },
    "data": [
        ["dialogue","","...", []],
        ["dialogue","","*surrounding changes*", ["Scene:shake"]],
        ["dialogue","","...", []],
        ["dialogue","King","Huzzah! The summoning ritual was a success!", ["King:fade in"]],
        ["dialogue","King","Welcome, chosen one. I am the King of this land.", ["King:move:(50%,0%)"]],
        ["dialogue","King","I will be brief. The Demon King has returned.", ["Scene:shake"]],
        ["dialogue","King","Our royal knights are... currently on strike. So the fate of the world falls to you.", []],
        ["dialogue","King","You look ill-equipped. Go visit the Blacksmith in town immediately.", []],
        ["dialogue","King","He requires raw materials. Go to the Quarry and mine some Copper Ore for him.", []],
        ["dialogue","King","Once you have a weapon, go fight the demon lord!", []],
        ["dialogue","King","Now begone! I have... important kingly business to attend to.", ["King:fade out"]],
    ]
};

// STAGE 2: Meeting the demon king
const demonKingIntroDlg = {
    "background": "throne_room_dark.png", 
    "speakers": { "Demon King": ["demon_lord.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Demon King", "Stop right there.", ["DemonKing:fade in"]],
        ["dialogue", "Demon King", "You are the fourth 'Chosen Hero' to barge in this week.", []],
        ["dialogue", "You", "Prepare to die, monster!", ["Scene:shake"]],
        ["dialogue", "Demon King", "Look, I'm on my lunch break. Can we reschedule?", []],
        ["dialogue", "You", "No! Draw your weapon!", []],
        ["dialogue", "Demon King", "*Sigh* Fine. But if I win, you're filling out the paperwork.", []]
    ]
};

// STAGE 3: Post fight
const demonKingDefeatedDlg = {
    "background": "throne_room_dark.png", 
    "speakers": { "Demon King": ["demon_lord.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Demon King", "Okay, okay! I yield!", ["DemonKing:shake"]],
        ["dialogue", "Demon King", "Here, take the horn. I have accumulated vacation days anyway.", []],
        ["dialogue", "You", "I... have saved the world?", []],
        ["dialogue", "Demon King", "Sure. Now get out before the janitor arrives.", ["DemonKing:fade out"]]
    ]
};

// STAGE 4: Finishing the quest
const kingRewardDlg = {
    "background": "royal_chamber.png", 
    "speakers": { "King": ["king.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "King", "By the gods! Is that the Demon King's horn?", ["king:fade in"]],
        ["dialogue", "King", "You have actually done it!", ["Scene:shake"]],
        ["dialogue", "King", "Take this medal. You are a true legend.", []]
    ]
};


// :::::: Variables :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(GLOBAL_STATE.variables, {
    "castleIntroPlayed": false,
    "demonkingIntroPlayed": false,
    "demonKingDefeated": false,
    "demonKingQstCompleted": false,
});

// :::::: Interaction Registry ::::::::::::::::::::::::::::::::::::::::::::::::::

AppendIntRegEntry("castle", [
    {
        comment: "This one is about the quest before it's finished",
        condition: { var: "starting location", op: "==", val: "castle" },
        data: {
            on_finish: {
                check_var: "castleIntroPlayed",
                if_false:{
                    actions: [
                        { type: "interaction", id: "castle_summoned"}, //Play the initial summoning scene
                    ]
                },
                if_true:{
                    actions: [
                        { type: "log", text: "King: Why are you still here? Go to the quarry, get ore, and kill the Demon King!" }
                    ]
                }
            }
        }
    },
]);

// STAGE 1: Initial summoning
AppendIntRegEntry("castle_summoned", [
    {
        comment: "This is when the player is summoned for the first time",
        condition: "default",
        data: {
            dialogue: introCastleDlg,
            on_finish: {
                actions: [
                    { type: "set_state", key: "castleIntroPlayed", val: true },
                    { type: "log", text: "Quest started: Defeat the Demon King." }
                ]
            }
        }
    },
]);

// STAGE 2: Meeting the demon king
AppendIntRegEntry("demon_king", [
    {
        condition: [
            { var: "starting location", op: "==", val: "castle" },
            { var: "demonkingIntroPlayed", op: "==", val: false },
        ],
        data: {
            dialogue: demonKingIntroDlg,
            on_finish: {
                actions: [
                    { type: "set_state", key: "demonkingIntroPlayed", val: true },
                ]
            }
        }
    },
]);

// STAGE 3: Post fight
AppendIntRegEntry("demon_king_defeated", [
    {
        condition: "default",
        data: {
            dialogue: demonKingDefeatedDlg,
            on_finish: {
                actions: [
                    { type: "reward", item: "Demon Horn", count: 1 },
                    { type: "log", text: "You obtained the Demon Horn!" },
                ]
            }
        }
    }
]);

// STAGE 4: Finishing the quest
AppendIntRegEntry("castle", [
    {
        comment: "This is when the demon king quest is completed",
        condition: { var: "demonKingQstCompleted", op: "==", val: true },
        data: { 
            log_only: "King: The bards will sing of your name! Now let me rest." 
        }
    },
    {
        comment: "This is when the demon king is defeated",
        condition: [
            { var: "starting location", op: "==", val: "castle" },
            { var: "demonKingQstCompleted", op: "==", val: false },
            { type: "item", id: "Demon Horn", op: ">=", val: 1 },
        ],
        data: {
            dialogue: kingRewardDlg,
            on_finish: {
                actions: [
                    { type: "consume", item: "Demon Horn", count: 1 },
                    { type: "reward", item: "Hero's Medal", count: 1 },
                    { type: "set_state", key: "demonKingQstCompleted", val: true },
                    { type: "log", text: "MAIN QUEST COMPLETE" }
                ]
            }
        }
    },
]);

// ============================================================================================
// ============================================================================================
//     Follower test
// ============================================================================================
// ============================================================================================
//
//

// :::::: Items :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(ITEM_DEFINITIONS, {
    "Goblin Ear": { description: "Gross, but mercenaries collect them." },
    "Wild Flower": { description: "A pretty flower found in the woods." },
    "Potion": { bonus_hp: 20, amount: 0, is_weapon: false } // Bonus item
});

// :::::: Enemies :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

const goblinEnemy = new Enemy("Goblin Scout", 15, {"Goblin Ear": 0.8, "Potion": 0.2}, new Skills(4, 1, 0, 1));
const wolfEnemy = new Enemy("Dire Wolf", 25, {"Wild Flower": 0.5}, new Skills(6, 2, 0, 2));

//const goblinEnemy = new Enemy("Goblin Scout", 10, {"Goblin Ear": 1, "Potion": 1}, new Skills(1, 0, 0, 1));
//const wolfEnemy = new Enemy("Dire Wolf", 10, {"Wild Flower": 1}, new Skills(1, 0, 0, 1));

// :::::: Followers :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(FOLLOWER_DEFINITIONS, {
    "Rookie Healer": { 
        hp: 20, 
        skills: new Skills(2, 2, 8, 2), // High healing
        interaction: "follower_healer_talk" 
    },
    "Veteran Merc": { 
        hp: 50, 
        skills: new Skills(12, 6, 0, 4), // High attack
        interaction: "follower_merc_talk" 
    }
});

// :::::: Maps ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

let TavernData = {
    "return:return:🔙 Leave:icon.png": {},
    "scene:recruit_merc:🍺 Approach Mercenary:icon.png; fn_interaction:recruit_merc": null,
    "scene:recruit_healer:🌿 Approach Healer:icon.png; fn_interaction:recruit_healer": null
};

Object.assign(WoodsData, {
    "fight:fight:⚔️ Hunt Monsters:icon.png" : [1000, "Hunting in the woods...", { 
        "Goblin": [0.6, goblinEnemy], 
        "Wolf": [0.4, wolfEnemy] 
    }]
});

Object.assign(TownData, {
    "scene:tavern:🍺 The Rusty Sword Tavern:icon.png; fn_interaction:tavern": TavernData
});
AppendIntRegEntry("tavern",[ { condition: "default", data: {} }, ])

// :::::: Dialogues :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

const mercIntroDlg = {
    "background": "tavern_inside.png",
    "speakers": { "Mercenary": ["knight.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Mercenary", "You look like a rookie. You need muscle?", ["Mercenary:show"]],
        ["dialogue", "Mercenary", "I don't work for free. Bring me 3 Goblin Ears as a down payment.", []],
        ["dialogue", "You", "Gross. But fine.", []]
    ]
};

const mercJoinDlg = {
    "background": "tavern_inside.png",
    "speakers": { "Mercenary": ["knight.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Mercenary", "Hah! You actually touched those things?", ["Mercenary:shake"]],
        ["dialogue", "Mercenary", "Alright, a deal is a deal. I've got your back.", []]
    ]
};

const healerIntroDlg = {
    "background": "tavern_inside.png",
    "speakers": { "Healer": ["goddess.png", "(50%,0%)"] }, // Reusing goddess sprite as placeholder
    "data": [
        ["dialogue", "Healer", "Oh, hello. Are you an adventurer?", ["Healer:show"]],
        ["dialogue", "Healer", "I wish to see the world, but I am too frail.", []],
        ["dialogue", "Healer", "If you can bring me 3 Wild Flowers from the woods, I will trust your gentle soul.", []]
    ]
};

const healerJoinDlg = {
    "background": "tavern_inside.png",
    "speakers": { "Healer": ["goddess.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Healer", "They are beautiful...", ["Healer:move:(50%,10%)"]],
        ["dialogue", "Healer", "Thank you. I will use my magic to protect you.", []]
    ]
};

// :::::: Variables :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Interaction Registry ::::::::::::::::::::::::::::::::::::::::::::::::::

AppendIntRegEntry("recruit_merc", [
    // Case 1: Already recruited
    { 
        condition: { var: "merc_recruited", op: "==", val: true },
        data: { log_only: "Mercenary: Let's go hit something already." }
    },
    // Case 2: Have the items -> Recruit
    {
        condition: { type: "item", id: "Goblin Ear", op: ">=", val: 3 },
        data: {
            dialogue: mercJoinDlg,
            on_finish: {
                actions: [
                    { type: "consume", item: "Goblin Ear", count: 3 },
                    { type: "reward", item: "Veteran Merc", count: 1 },
                    { type: "set_state", key: "merc_recruited", val: true },
                ]
            }
        }
    },
    // Case 3: Default -> Intro
    {
        condition: "default",
        data: {
            dialogue: mercIntroDlg
        }
    }
]);

AppendIntRegEntry("recruit_healer", [
    { 
        condition: { var: "healer_recruited", op: "==", val: true },
        data: { log_only: "Healer: I am ready when you are." }
    },
    {
        condition: { type: "item", id: "Wild Flower", op: ">=", val: 3 },
        data: {
            dialogue: healerJoinDlg,
            on_finish: {
                actions: [
                    { type: "consume", item: "Wild Flower", count: 3 },
                    { type: "reward", item: "Rookie Healer", count: 1 },
                    { type: "set_state", key: "healer_recruited", val: true },
                ]
            }
        }
    },
    {
        condition: "default",
        data: { dialogue: healerIntroDlg }
    }
]);

// 2. FOLLOWER MENU INTERACTIONS (When clicked in the character menu)

AppendIntRegEntry("follower_merc_talk", [
    { condition: "default", data: { log_only: "Merc: Sharpening my blade. Don't worry about it." } }
]);

AppendIntRegEntry("follower_healer_talk", [
    { 
        condition: "default", 
        data: { 
            // Simple logic: If player is hurt, log a heal message (visual only for now)
            // or just generic flavor text.
            log_only: "Healer: Stay close, I'll keep your health up in battle." 
        } 
    }
]);



// ============================================================================================
// ============================================================================================
//     GUILDMASTER'S DAUGHTER QUEST
// ============================================================================================
// ============================================================================================
//
// :::::: Items :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Enemies :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

const forestTroll = new Enemy("Forest Troll", 30, { "Gold Coin": 5 }, new Skills(8, 2, 2, 1));
//const forestTroll = new Enemy("Forest Troll", 10, { "Gold Coin": 5 }, new Skills(1,0,0,1));

Object.assign(FOLLOWER_DEFINITIONS, {
    "Elara": { 
        hp: 45, 
        skills: new Skills(10, 3, 2, 8), // High Agility & Attack (Rogue type)
        interaction: "follower_elara_talk" 
    }
});

// :::::: Maps ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(AdvGuildData, {
    "scene:gm:📜 Guildmaster:icon.png; fn_interaction:gm_interaction": null,
});

// :::::: Dialogues :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// --- Guildmaster Dialogues ---
const gmStartQuestDlg = {
    "background": "guild_hall.png",
    "speakers": { "Guildmaster": ["king.png", "(50%,0%)"] }, // Placeholder sprite
    "data": [
        ["dialogue", "Guildmaster", "Adventurer! I have a personal request.", ["Guildmaster:show"]],
        ["dialogue", "Guildmaster", "My daughter, Elara, went into the woods to prove herself.", []],
        ["dialogue", "Guildmaster", "She hasn't returned. Please, find her before something happens.", []],
        ["dialogue", "You", "Consider it done.", []]
    ]
};

const gmFinishQuestDlg = {
    "background": "guild_hall.png",
    "speakers": { "Guildmaster": ["king.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Guildmaster", "Elara returned! She told me you saved her life.", ["Guildmaster:show"]],
        ["dialogue", "Guildmaster", "She insists on joining your party. I suppose I can't stop her.", []],
        ["dialogue", "Guildmaster", "Take this gold as thanks.", []]
    ]
};

// --- Woods Event Dialogues ---
const elaraEncounterDlg = {
    "background": "forest_clearing.png",
    "speakers": { "Girl": ["goddess.png", "(70%,0%)"], "Troll": ["demon_lord.png", "(30%,0%)"] }, // Placeholders
    "data": [
        ["dialogue", "Girl", "Get back, you ugly brute!", ["Girl:show", "Troll:show"]],
        ["dialogue", "Troll", "GRAAAH!", ["Troll:shake"]],
        ["dialogue", "You", "That must be her! I have to help!", ["Scene:shake"]],
        ["dialogue", "Girl", "Who are you? Help me take it down!", []]
    ]
};

const elaraSuccessDlg = {
    "background": "forest_clearing.png",
    "speakers": { "Elara": ["goddess.png", "(50%,0%)"] },
    "data": [
        ["dialogue", "Elara", "*Pants*... That was close.", ["Elara:show"]],
        ["dialogue", "Elara", "You're from the guild, right? My father sent you?", []],
        ["dialogue", "Elara", "I can't go back empty-handed. Let me join you.", []],
        ["dialogue", "Elara", "I promise I'm better with a dagger than I looked back there.", []]
    ]
};

// :::::: Variables :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(GLOBAL_STATE.variables, {
    "quest_gm_daughter_active": false, // Has the GM given the quest?
    "quest_gm_daughter_won": null,     // Result of the fight (null = not fought, true = won, false = lost)
    "quest_gm_daughter_saved": false,  // Has she been recruited?
    "quest_gm_daughter_done": false    // Quest turned in?
});

// :::::: Interaction Registry ::::::::::::::::::::::::::::::::::::::::::::::::::

// 1. GUILDMASTER INTERACTION
AppendIntRegEntry("gm_interaction", [
    // Case A: Quest Complete (Turn In)
    {
        condition: [
            { var: "quest_gm_daughter_saved", op: "==", val: true },
            { var: "quest_gm_daughter_done", op: "==", val: false }
        ],
        data: {
            dialogue: gmFinishQuestDlg,
            on_finish: {
                actions: [
                    { type: "reward", item: "Gold Coin", count: 50 },
                    { type: "set_state", key: "quest_gm_daughter_done", val: true },
                    { type: "log", text: "Quest Complete: Daughter Saved!" }
                ]
            }
        }
    },
    // Case B: Quest Already Done
    {
        condition: { var: "quest_gm_daughter_done", op: "==", val: true },
        data: { log_only: "Guildmaster: Take care of Elara for me." }
    },
    // Case C: Quest In Progress (Waiting)
    {
        condition: { var: "quest_gm_daughter_active", op: "==", val: true },
        data: { log_only: "Guildmaster: Please, check the Woods!" }
    },
    // Case D: Give Quest (Default)
    {
        condition: "default",
        data: {
            dialogue: gmStartQuestDlg,
            on_finish: {
                actions: [
                    { type: "set_state", key: "quest_gm_daughter_active", val: true },
                    { type: "log", text: "Quest Started: Find Elara in the Woods." }
                ]
            }
        }
    }
]);

// 2. WOODS INTERACTION (Auto-triggered when entering Woods)
// We are appending to the existing "woods" key defined in your base data.js
AppendIntRegEntry("woods", [
    

    // --- STEP 1: ENCOUNTER TRIGGER ---
    // If quest is active, we haven't recruited her, and we haven't won yet (or we lost previously)
    {
        condition: [
            { var: "quest_gm_daughter_active", op: "==", val: true },
            { var: "quest_gm_daughter_saved", op: "==", val: false }
        ],
        data: {
            dialogue: elaraEncounterDlg,
            on_finish: {
                actions: [
                    { 
                        type: "fight", 
                        text: "Protect Elara!", 
                        enemy: { "Forest Troll": [1.0, forestTroll] },
                        binding: "quest_gm_daughter_won", // Binds result (true/false) to this var
                        next: "elara_resolution"
                    },
                ]
            }
        }
    }
]);

AppendIntRegEntry("elara_resolution", [
    {
        condition: [
            { var: "quest_gm_daughter_active", op: "==", val: true },
            { var: "quest_gm_daughter_saved", op: "==", val: false },
            { var: "quest_gm_daughter_won", op: "==", val: true }
        ],
        data: {
            dialogue: elaraSuccessDlg,
            on_finish: {
                actions: [
                    { type: "reward", item: "Elara", count: 1 },
                    { type: "set_state", key: "quest_gm_daughter_saved", val: true },
                    { type: "log", text: "Elara joined the party! Return to Guildmaster." }
                ]
            }
        }
    },
    {
        condition: "default",
        data: {}
    },

]);

// 3. ELARA MENU INTERACTION
AppendIntRegEntry("follower_elara_talk", [
    { condition: "default", data: { log_only: "Elara: Thanks for helping me back there." } }
]);

// ============================================================================================
//      ELARA ROMANCE EVENT (TAVERN VERSION)
// ============================================================================================

// 1. Define Variables
Object.assign(GLOBAL_STATE.variables, {
    "elara_romance_talk_done": false,
    "elara_night_pending": false
});

// 2. Define the Dialogue (Modified for Inn setting)
const elaraRomanceTeaseDlg = {
    // UPDATED: Background matches the Inn/Tavern
    "background": "tavern_inside.png", 
    "speakers": { "Elara": ["goddess.png", "(50%,0%)"] }, 
    "data": [
        ["dialogue", "Elara", "It's noisy down here, isn't it?", ["Elara:show"]],
        ["dialogue", "You", "A bit. Do you want to leave?", []],
        ["dialogue", "Elara", "No... actually...", ["Elara:move:(60%,0%)"]],
        ["dialogue", "Elara", "I rented a room upstairs. It's much quieter.", []],
        ["dialogue", "Elara", "I've been thinking about you since our last fight.", ["Scene:shake"]],
        ["dialogue", "Elara", "Come with me?", ["Elara:move:(40%,0%)"]],
        ["dialogue", "You", "Lead the way.", []],
        // "Fade to black" / Time passing implication
        ["dialogue", "", "You follow Elara upstairs...", ["Elara:fade out", "Scene:fade out"]],
        ["dialogue", "", "...", []], 
        ["dialogue", "", "Some time later...", []],
        ["dialogue", "Elara", "That was... exactly what I needed.", ["Elara:show", "Scene:fade in"]]
    ]
};

// 3. Register the Interaction
AppendIntRegEntry("tavern", [
    {
        condition: [
            // 1. Must have saved her
            { type: "follower", id: "Elara", in_party: true },
            // 2. Must not have happened yet
            { var: "elara_romance_talk_done", op: "==", val: false },
            // 3. 50% Chance
            { var: "rand:uniform", op: "<", val: 1.0 }
        ],
        data: {
            dialogue: elaraRomanceTeaseDlg,
            on_finish: {
                actions: [
                    // Mark as done
                    { type: "set_state", key: "elara_romance_talk_done", val: true },
                    // Set flag for future events
                    { type: "set_state", key: "elara_night_pending", val: true },
                    // Optional: Heal player to imply rest
                    { type: "set_state", key: "player_hp", val: 100 }, 
                    { type: "log", text: "You feel refreshed." }
                ]
            }
        }
    }
]);


// ============================================================================================
// ============================================================================================
//     Woods, ores, and smelting template
// ============================================================================================
// ============================================================================================
//
// :::::: Items :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(ITEM_DEFINITIONS, {
    "Oak log": { description: "Sturdy wood." },
    "Branch": { description: "A small stick." },
    "Copper ore": { description: "Unrefined copper." },
    "Copper ingot": { description: "Smelted metal." },
    "Copper dagger": { is_weapon:true, bonus_skills:new Skills(2,0,0,1) },
    "Copper plate armor": { is_armor_body:true, bonus_hp:1, bonus_skills:new Skills(0,2,0,0) },
    "Copper plate leggings": { is_armor_leggings:true, bonus_hp:1, bonus_skills:new Skills(0,2,0,0) },
    "Garnet": { description: "A red gem." }
});

// :::::: Enemies :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Followers :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// :::::: Maps ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(AdvGuildData, {
    "scene:gm:📜 Guildmaster:icon.png; fn_interaction:gm_interaction": null,
});

Object.assign(OpenWorld, {
    "scene:forest clearing:🪵 Forest clearing:icon.png": {
        "return:return:🔙 Exit:icon.png": {},
        "harvest:cut trees:🪓 Cut tree:icon.png":
        [1000, "Chopping wood...", { "Oak log": 1.0, "Branch": 0.5 }],
    },
    "scene:mining quarry:🪨 Mining quarry:quarry_dark.png": {
        "return:return:🔙 Exit:icon.png": {},
        "harvest:mine ores:⛏️ Mine ores:icon_pickaxe.png" :
        [1000, "Mining rocks...", { "Copper ore": 1.0, "Garnet": 0.5 }],

    },
});

TownData["scene:blacksmith:🔨 Blacksmith:icon.png"] = {
    "return:return:🔙 Exit:icon.png": {},
    "craft:smelt ore:🧱 Smelt ores:icon.png": [1000, "Smelting ores...", { "input:Oak log": 0.5, "input:Copper ore": 1, "output:Copper ingot": 1 }],
    "craft:craft dagger:🗡️ Make a dagger:icon.png": [1000, "Crafting...", { "input:Copper ingot": 1, "output:Copper dagger": 1 }],
    "craft:craft dagger:🎽 Make a plate armor:icon.png": [1000, "Crafting...", { "input:Copper ingot": 2, "output:Copper plate armor": 1 }],
    "craft:craft dagger:👖 Make a plate leggings:icon.png": [1000, "Crafting...", { "input:Copper ingot": 2, "output:Copper plate leggings": 1 }],
};
