// :::::: Variables ::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(GLOBAL_STATE.variables, {
    "introPlayed": "false",
    "starting location": "unknown",
    "castleIntroPlayed": "false",
    "demonkingIntroPlayed": "false",
    "demonKingDefeated": "false",
    "demonKingQstCompleted": "false",
    "merc_recruited": "false",
    "healer_recruited": "false",
    "quest_gm_daughter_active": "false",
    "quest_gm_daughter_won": "false",
    "quest_gm_daughter_saved": "false",
    "quest_gm_daughter_done": "false",
    "elara_romance_talk_done": "false",
    "elara_night_pending": "false",
    "ship answer": "nevermind",
});

// :::::: Items ::::::::::::::::::::::::::::::::::::::::::::::::::::::

Object.assign(ITEM_DEFINITIONS, {
    "Demon Horn": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Hero's Medal": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Legendary Sword": { is_weapon: true, scaling: "strength", bonus_skills: new Skills(10, 5, 2, 5, 0, 0, 0) },
    "Goblin Ear": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Wild Flower": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Potion": { bonus_hp: 20, scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Oak log": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Branch": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Copper ore": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Copper ingot": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
    "Copper dagger": { is_weapon: true, scaling: "agility", bonus_skills: new Skills(2, 0, 0, 1, 0, 0, 0) },
    "Copper plate armor": { is_armor_body: true, bonus_hp: 1, scaling: "strength", bonus_skills: new Skills(0, 2, 0, 0, 0, 0, 0) },
    "Copper plate leggings": { is_armor_leggings: true, bonus_hp: 1, scaling: "strength", bonus_skills: new Skills(0, 2, 0, 0, 0, 0, 0) },
    "Garnet": { scaling: "strength", bonus_skills: new Skills(0, 0, 0, 0, 0, 0, 0) },
});

// :::::: Enemies ::::::::::::::::::::::::::::::::::::::::::::::::::::

const Shadow_Knight = new Enemy("Shadow Knight", 30, {  }, new Skills(0, 0, 0, 0, 0, 0, 0));
const Demon_King = new Enemy("Demon King", 100, { "Legendary Sword": 1 }, new Skills(0, 0, 0, 0, 0, 0, 0));
const Goblin_Scout = new Enemy("Goblin Scout", 15, { "Goblin Ear": 1, "Potion": 0.2 }, new Skills(0, 0, 0, 0, 0, 0, 0));
const Dire_Wolf = new Enemy("Dire Wolf", 25, { "Wild Flower": 1 }, new Skills(0, 0, 0, 0, 0, 0, 0));
const Forest_Troll = new Enemy("Forest Troll", 1, { "Gold Coin": 5 }, new Skills(0, 0, 0, 0, 0, 0, 0));

Object.assign(FOLLOWER_DEFINITIONS, {
    "Rookie Healer": { hp: 20, skills: new Skills(2, 2, 8, 2, 0, 0, 0), interaction: "follower_healer_talk" },
    "Veteran Merc": { hp: 50, skills: new Skills(12, 6, 0, 4, 0, 0, 0), interaction: "follower_merc_talk" },
    "Elara": { hp: 45, skills: new Skills(10, 3, 2, 8, 0, 0, 0), interaction: "follower_elara_talk" },
});

// :::::: Dialogues ::::::::::::::::::::::::::::::::::::::::::::::::::

const game_intro_dlg_100 = {
    "background": "heaven_clouds.png",
    "speakers": {
        "Goddess": [
            "goddess.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Goddess",
            "Dear Hero, yesterday, you died in a car accident in your world.",
            [
                "Goddess:fade in"
            ]
        ],
        [
            "dialogue",
            "You",
            "Huh? Is this another one of those Isekai bullshit that was popular a decade ago?",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "Goddess",
            "Yes, yes. Calm down.",
            [
                "Goddess:move:(80%,0%)"
            ]
        ],
        [
            "dialogue",
            "Goddess",
            "I will let you choose where to start your life in another world.",
            [
                "Goddess:move:(20%,0%)"
            ]
        ],
        [
            "dialogue",
            "You",
            "Really? Can I get my cheat power too?",
            [
                "Goddess:move:(50%,0%)"
            ]
        ],
        [
            "dialogue",
            "Goddess",
            "Don't be greedy!",
            [
                "Scene:shake",
                "Goddess:shake"
            ]
        ],
        [
            "dialogue",
            "Goddess",
            "Now choose!",
            []
        ],
        [
            "question",
            "Goddess",
            "Now choose!",
            [],
            {
                "I want to be the brave hero.": "castle",
                "I want to be dropped in the town.": "in town",
                "I want to be an adventurer.": "adventurer",
                "Drop me wherever.": "woods"
            }
        ]
    ]
};

const game_intro_res_castle_dlg_185 = {
    "background": "heaven_clouds.png",
    "speakers": {
        "Goddess": [
            "goddess.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Goddess",
            "Alright, I will send you down to another world.",
            [
                "Goddess:show"
            ]
        ],
        [
            "dialogue",
            "Goddess",
            "Have fun there, my hero. And don't cause any trouble.",
            [
                "Goddess:fade out"
            ]
        ]
    ]
};

const castle_summoned_dlg_826 = {
    "background": "royal_chamber.png",
    "speakers": {
        "King": [
            "king.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "",
            "...",
            []
        ],
        [
            "dialogue",
            "",
            "*surrounding changes*",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "",
            "...",
            []
        ],
        [
            "dialogue",
            "King",
            "Huzzah! The summoning ritual was a success!",
            [
                "King:fade in"
            ]
        ],
        [
            "dialogue",
            "King",
            "Welcome, chosen one. I am the King of this land.",
            [
                "King:move:(50%,0%)"
            ]
        ],
        [
            "dialogue",
            "King",
            "I will be brief. The Demon King has returned.",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "King",
            "Our royal knights are... currently on strike. So the fate of the world falls to you.",
            []
        ],
        [
            "dialogue",
            "King",
            "You look ill-equipped. Go visit the Blacksmith in town immediately.",
            []
        ],
        [
            "dialogue",
            "King",
            "He requires raw materials. Go to the Quarry and mine some Copper Ore for him.",
            []
        ],
        [
            "dialogue",
            "King",
            "Once you have a weapon, go fight the demon lord!",
            []
        ],
        [
            "dialogue",
            "King",
            "Now begone! I have... important kingly business to attend to.",
            [
                "King:fade out"
            ]
        ]
    ]
};

const demon_king_dlg_955 = {
    "background": "throne_room_dark.png",
    "speakers": {
        "Demon King": [
            "demon_lord.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Demon King",
            "Stop right there.",
            [
                "DemonKing:fade in"
            ]
        ],
        [
            "dialogue",
            "Demon King",
            "You are the fourth 'Chosen Hero' to barge in this week.",
            []
        ],
        [
            "dialogue",
            "You",
            "Prepare to die, monster!",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "Demon King",
            "Look, I'm on my lunch break. Can we reschedule?",
            []
        ],
        [
            "dialogue",
            "You",
            "No! Draw your weapon!",
            []
        ],
        [
            "dialogue",
            "Demon King",
            "*Sigh* Fine. But if I win, you're filling out the paperwork.",
            []
        ]
    ]
};

const demon_king_defeated_dlg_18 = {
    "background": "throne_room_dark.png",
    "speakers": {
        "Demon King": [
            "demon_lord.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Demon King",
            "Okay, okay! I yield!",
            [
                "DemonKing:shake"
            ]
        ],
        [
            "dialogue",
            "Demon King",
            "Here, take the horn. I have accumulated vacation days anyway.",
            []
        ],
        [
            "dialogue",
            "You",
            "I... have saved the world?",
            []
        ],
        [
            "dialogue",
            "Demon King",
            "Sure. Now get out before the janitor arrives.",
            [
                "DemonKing:fade out"
            ]
        ]
    ]
};

const castle_dlg_867 = {
    "background": "royal_chamber.png",
    "speakers": {
        "King": [
            "king.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "King",
            "By the gods! Is that the Demon King's horn?",
            [
                "king:fade in"
            ]
        ],
        [
            "dialogue",
            "King",
            "You have actually done it!",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "King",
            "Take this medal. You are a true legend.",
            []
        ]
    ]
};

const recruit_merc_dlg_869 = {
    "background": "tavern_inside.png",
    "speakers": {
        "Mercenary": [
            "knight.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Mercenary",
            "You look like a rookie. You need muscle?",
            [
                "Mercenary:show"
            ]
        ],
        [
            "dialogue",
            "Mercenary",
            "I don't work for free. Bring me 3 Goblin Ears as a down payment.",
            []
        ],
        [
            "dialogue",
            "You",
            "Gross. But fine.",
            []
        ]
    ]
};

const recruit_merc_dlg_30 = {
    "background": "tavern_inside.png",
    "speakers": {
        "Mercenary": [
            "knight.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Mercenary",
            "Hah! You actually touched those things?",
            [
                "Mercenary:shake"
            ]
        ],
        [
            "dialogue",
            "Mercenary",
            "Alright, a deal is a deal. I've got your back.",
            []
        ]
    ]
};

const recruit_healer_dlg_138 = {
    "background": "tavern_inside.png",
    "speakers": {
        "Healer": [
            "goddess.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Healer",
            "Oh, hello. Are you an adventurer?",
            [
                "Healer:show"
            ]
        ],
        [
            "dialogue",
            "Healer",
            "I wish to see the world, but I am too frail.",
            []
        ],
        [
            "dialogue",
            "Healer",
            "If you can bring me 3 Wild Flowers from the woods, I will trust your gentle soul.",
            []
        ]
    ]
};

const recruit_healer_dlg_25 = {
    "background": "tavern_inside.png",
    "speakers": {
        "Healer": [
            "goddess.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Healer",
            "They are beautiful...",
            [
                "Healer:move:(50%,10%)"
            ]
        ],
        [
            "dialogue",
            "Healer",
            "Thank you. I will use my magic to protect you.",
            []
        ]
    ]
};

const gm_interaction_dlg_508 = {
    "background": "guild_hall.png",
    "speakers": {
        "Guildmaster": [
            "king.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Guildmaster",
            "Adventurer! I have a personal request.",
            [
                "Guildmaster:show"
            ]
        ],
        [
            "dialogue",
            "Guildmaster",
            "My daughter, Elara, went into the woods to prove herself.",
            []
        ],
        [
            "dialogue",
            "Guildmaster",
            "She hasn't returned. Please, find her before something happens.",
            []
        ],
        [
            "dialogue",
            "You",
            "Consider it done.",
            []
        ]
    ]
};

const gm_interaction_dlg_370 = {
    "background": "guild_hall.png",
    "speakers": {
        "Guildmaster": [
            "king.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Guildmaster",
            "Elara returned! She told me you saved her life.",
            [
                "Guildmaster:show"
            ]
        ],
        [
            "dialogue",
            "Guildmaster",
            "She insists on joining your party. I suppose I can't stop her.",
            []
        ],
        [
            "dialogue",
            "Guildmaster",
            "Take this gold as thanks.",
            []
        ]
    ]
};

const woods_dlg_382 = {
    "background": "forest_clearing.png",
    "speakers": {
        "Girl": [
            "goddess.png",
            "(70%,0%)"
        ],
        "Troll": [
            "demon_lord.png",
            "(30%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Girl",
            "Get back, you ugly brute!",
            [
                "Girl:show",
                "Troll:show"
            ]
        ],
        [
            "dialogue",
            "Troll",
            "GRAAAH!",
            [
                "Troll:shake"
            ]
        ],
        [
            "dialogue",
            "You",
            "That must be her! I have to help!",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "Girl",
            "Who are you? Help me take it down!",
            []
        ]
    ]
};

const elara_resolution_dlg_574 = {
    "background": "forest_clearing.png",
    "speakers": {
        "Elara": [
            "goddess.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Elara",
            "*Pants*... That was close.",
            [
                "Elara:show"
            ]
        ],
        [
            "dialogue",
            "Elara",
            "You're from the guild, right? My father sent you?",
            []
        ],
        [
            "dialogue",
            "Elara",
            "I can't go back empty-handed. Let me join you.",
            []
        ],
        [
            "dialogue",
            "Elara",
            "I promise I'm better with a dagger than I looked back there.",
            []
        ]
    ]
};

const tavern_dlg_558 = {
    "background": "tavern_inside.png",
    "speakers": {
        "Elara": [
            "goddess.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Elara",
            "It's noisy down here, isn't it?",
            [
                "Elara:show"
            ]
        ],
        [
            "dialogue",
            "You",
            "A bit. Do you want to leave?",
            []
        ],
        [
            "dialogue",
            "Elara",
            "No... actually...",
            [
                "Elara:move:(60%,0%)"
            ]
        ],
        [
            "dialogue",
            "Elara",
            "I rented a room upstairs. It's much quieter.",
            []
        ],
        [
            "dialogue",
            "Elara",
            "I've been thinking about you since our last fight.",
            [
                "Scene:shake"
            ]
        ],
        [
            "dialogue",
            "Elara",
            "Come with me?",
            [
                "Elara:move:(40%,0%)"
            ]
        ],
        [
            "dialogue",
            "You",
            "Lead the way.",
            []
        ],
        [
            "dialogue",
            "",
            "You follow Elara upstairs...",
            [
                "Elara:fade out",
                "Scene:fade out"
            ]
        ],
        [
            "dialogue",
            "",
            "...",
            []
        ],
        [
            "dialogue",
            "",
            "Some time later...",
            []
        ],
        [
            "dialogue",
            "Elara",
            "That was... exactly what I needed.",
            [
                "Elara:show",
                "Scene:fade in"
            ]
        ]
    ]
};

const harbor_main_dlg_774 = {
    "background": "sea.png",
    "speakers": {
        "Sailor": [
            "sailor.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Sailor",
            "Where ya going?",
            [
                "Sailor:fade in"
            ]
        ],
        [
            "question",
            "Sailor",
            "Where ya going?",
            [],
            {
                "To the Island": "to island",
                "Nevermind": "nevermind"
            }
        ]
    ]
};

const harbor_island_dlg_731 = {
    "background": "sea.png",
    "speakers": {
        "Sailor": [
            "sailor.png",
            "(50%,0%)"
        ]
    },
    "data": [
        [
            "dialogue",
            "Sailor",
            "Where ya going?",
            [
                "Sailor:fade in"
            ]
        ],
        [
            "question",
            "Sailor",
            "Where ya going?",
            [],
            {
                "Back to town": "to town",
                "Nevermind": "nevermind"
            }
        ]
    ]
};

// :::::: Interaction Registry ::::::::::::::::::::::::::::::::::::::

AppendIntRegEntry("game_intro", [
    {
        "condition": "default",
        "data": {}
    }
]);

AppendIntRegEntry("castle", [
    {
        "condition": "default",
        "data": {
            "log_only": "Guard: Begone, pleb!"
        }
    }
]);

AppendIntRegEntry("adv_guild", [
    {
        "condition": "default",
        "data": {}
    }
]);

AppendIntRegEntry("woods", [
    {
        "condition": "default",
        "data": {}
    }
]);

AppendIntRegEntry("game_intro", [
    {
        "condition": {
            "var": "introPlayed",
            "op": "==",
            "val": "false"
        },
        "data": {
            "dialogue": game_intro_dlg_100,
            "binding": "starting location",
            "on_finish": {
                "actions": [],
                "check_var": "starting location",
                "switch_case": {
                    "castle": {
                        "actions": [
                            {
                                "type": "set_state",
                                "key": "introPlayed",
                                "val": "true"
                            },
                            {
                                "type": "goto",
                                "target": "castle"
                            }
                        ],
                        "dialogue": game_intro_res_castle_dlg_185
                    },
                    "in town": {
                        "actions": [
                            {
                                "type": "set_state",
                                "key": "introPlayed",
                                "val": "true"
                            },
                            {
                                "type": "goto",
                                "target": "town"
                            }
                        ],
                        "dialogue": game_intro_res_castle_dlg_185
                    },
                    "adventurer": {
                        "actions": [
                            {
                                "type": "set_state",
                                "key": "introPlayed",
                                "val": "true"
                            },
                            {
                                "type": "goto",
                                "target": "adventurer's guild"
                            }
                        ],
                        "dialogue": game_intro_res_castle_dlg_185
                    },
                    "woods": {
                        "actions": [
                            {
                                "type": "set_state",
                                "key": "introPlayed",
                                "val": "true"
                            },
                            {
                                "type": "goto",
                                "target": "woods"
                            }
                        ],
                        "dialogue": game_intro_res_castle_dlg_185
                    }
                }
            }
        }
    }
]);

AppendIntRegEntry("demon_king", [
    {
        "condition": "default",
        "data": {}
    }
]);

AppendIntRegEntry("castle", [
    {
        "condition": {
            "var": "starting location",
            "op": "==",
            "val": "castle"
        },
        "data": {
            "on_finish": {
                "actions": [],
                "check_var": "castleIntroPlayed",
                "switch_case": {
                    "false": {
                        "actions": [
                            {
                                "type": "interaction",
                                "id": "castle_summoned"
                            }
                        ]
                    },
                    "true": {
                        "actions": [
                            {
                                "type": "log",
                                "text": "King: Why are you still here? Go to the quarry, get ore, and kill the Demon King!"
                            }
                        ]
                    }
                }
            }
        }
    }
]);

AppendIntRegEntry("castle_summoned", [
    {
        "condition": "default",
        "data": {
            "dialogue": castle_summoned_dlg_826,
            "on_finish": {
                "actions": [
                    {
                        "type": "set_state",
                        "key": "castleIntroPlayed",
                        "val": "true"
                    },
                    {
                        "type": "log",
                        "text": "Quest started: Defeat the Demon King."
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("demon_king", [
    {
        "condition": [
            {
                "var": "starting location",
                "op": "==",
                "val": "castle"
            },
            {
                "var": "demonkingIntroPlayed",
                "op": "==",
                "val": "false"
            }
        ],
        "data": {
            "dialogue": demon_king_dlg_955,
            "on_finish": {
                "actions": [
                    {
                        "type": "set_state",
                        "key": "demonkingIntroPlayed",
                        "val": "true"
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("demon_king_defeated", [
    {
        "condition": "default",
        "data": {
            "dialogue": demon_king_defeated_dlg_18,
            "on_finish": {
                "actions": [
                    {
                        "type": "reward",
                        "item": "Demon Horn",
                        "count": 1
                    },
                    {
                        "type": "log",
                        "text": "You obtained the Demon Horn!"
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("castle", [
    {
        "condition": [
            {
                "var": "starting location",
                "op": "==",
                "val": "castle"
            },
            {
                "var": "demonKingQstCompleted",
                "op": "==",
                "val": "false"
            },
            {
                "type": "item",
                "id": "Demon Horn",
                "op": ">=",
                "val": 1
            }
        ],
        "data": {
            "dialogue": castle_dlg_867,
            "on_finish": {
                "actions": [
                    {
                        "type": "consume",
                        "item": "Demon Horn",
                        "count": 1
                    },
                    {
                        "type": "reward",
                        "item": "Hero's Medal",
                        "count": 1
                    },
                    {
                        "type": "set_state",
                        "key": "demonKingQstCompleted",
                        "val": "true"
                    },
                    {
                        "type": "log",
                        "text": "MAIN QUEST COMPLETE"
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("castle", [
    {
        "condition": {
            "var": "demonKingQstCompleted",
            "op": "==",
            "val": "true"
        },
        "data": {
            "log_only": "King: The bards will sing of your name! Now let me rest."
        }
    }
]);

AppendIntRegEntry("tavern", [
    {
        "condition": "default",
        "data": {}
    }
]);

AppendIntRegEntry("recruit_merc", [
    {
        "condition": "default",
        "data": {
            "dialogue": recruit_merc_dlg_869
        }
    }
]);

AppendIntRegEntry("recruit_merc", [
    {
        "condition": {
            "type": "item",
            "id": "Goblin Ear",
            "op": ">=",
            "val": 3
        },
        "data": {
            "dialogue": recruit_merc_dlg_30,
            "on_finish": {
                "actions": [
                    {
                        "type": "consume",
                        "item": "Goblin Ear",
                        "count": 3
                    },
                    {
                        "type": "reward",
                        "item": "Veteran Merc",
                        "count": 1
                    },
                    {
                        "type": "set_state",
                        "key": "merc_recruited",
                        "val": "true"
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("recruit_merc", [
    {
        "condition": {
            "var": "merc_recruited",
            "op": "==",
            "val": "true"
        },
        "data": {
            "log_only": "Mercenary: Let's go hit something already."
        }
    }
]);

AppendIntRegEntry("recruit_healer", [
    {
        "condition": "default",
        "data": {
            "dialogue": recruit_healer_dlg_138
        }
    }
]);

AppendIntRegEntry("recruit_healer", [
    {
        "condition": {
            "type": "item",
            "id": "Wild Flower",
            "op": ">=",
            "val": 3
        },
        "data": {
            "dialogue": recruit_healer_dlg_25,
            "on_finish": {
                "actions": [
                    {
                        "type": "consume",
                        "item": "Wild Flower",
                        "count": 3
                    },
                    {
                        "type": "reward",
                        "item": "Rookie Healer",
                        "count": 1
                    },
                    {
                        "type": "set_state",
                        "key": "healer_recruited",
                        "val": "true"
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("recruit_healer", [
    {
        "condition": {
            "var": "healer_recruited",
            "op": "==",
            "val": "true"
        },
        "data": {
            "log_only": "Healer: I am ready when you are."
        }
    }
]);

AppendIntRegEntry("recruit_merc_cond", [
    {
        "condition": {
            "var": "merc_recruited",
            "op": "==",
            "val": "false"
        },
        "data": {}
    }
]);

AppendIntRegEntry("recruit_healer_cond", [
    {
        "condition": {
            "var": "healer_recruited",
            "op": "==",
            "val": "false"
        },
        "data": {}
    }
]);

AppendIntRegEntry("follower_merc_talk", [
    {
        "condition": "default",
        "data": {
            "log_only": "Merc: Sharpening my blade. Don't worry about it."
        }
    }
]);

AppendIntRegEntry("follower_healer_talk", [
    {
        "condition": "default",
        "data": {
            "log_only": "Healer: Stay close, I'll keep your health up in battle."
        }
    }
]);

AppendIntRegEntry("gm_interaction", [
    {
        "condition": "default",
        "data": {
            "dialogue": gm_interaction_dlg_508,
            "on_finish": {
                "actions": [
                    {
                        "type": "set_state",
                        "key": "quest_gm_daughter_active",
                        "val": "true"
                    },
                    {
                        "type": "log",
                        "text": "Quest Started: Find Elara in the Woods."
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("gm_interaction", [
    {
        "condition": {
            "var": "quest_gm_daughter_active",
            "op": "==",
            "val": "true"
        },
        "data": {
            "log_only": "Guildmaster: Please, check the Woods!"
        }
    }
]);

AppendIntRegEntry("gm_interaction", [
    {
        "condition": {
            "var": "quest_gm_daughter_done",
            "op": "==",
            "val": "true"
        },
        "data": {
            "log_only": "Guildmaster: Take care of Elara for me."
        }
    }
]);

AppendIntRegEntry("gm_interaction", [
    {
        "condition": [
            {
                "var": "quest_gm_daughter_saved",
                "op": "==",
                "val": "true"
            },
            {
                "var": "quest_gm_daughter_done",
                "op": "==",
                "val": "false"
            }
        ],
        "data": {
            "dialogue": gm_interaction_dlg_370,
            "on_finish": {
                "actions": [
                    {
                        "type": "reward",
                        "item": "Gold Coin",
                        "count": 50
                    },
                    {
                        "type": "set_state",
                        "key": "quest_gm_daughter_done",
                        "val": "true"
                    },
                    {
                        "type": "log",
                        "text": "Quest Complete: Daughter Saved!"
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("woods", [
    {
        "condition": [
            {
                "var": "quest_gm_daughter_active",
                "op": "==",
                "val": "true"
            },
            {
                "var": "quest_gm_daughter_saved",
                "op": "==",
                "val": "false"
            }
        ],
        "data": {
            "dialogue": woods_dlg_382,
            "on_finish": {
                "actions": [
                    {
                        "type": "fight",
                        "text": "Protect Elara!",
                        "binding": "quest_gm_daughter_won",
                        "next": "elara_resolution",
                        "enemy": {
                            "Forest Troll": [
                                1,
                                Forest_Troll
                            ]
                        }
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("elara_resolution", [
    {
        "condition": "default",
        "data": {}
    }
]);

AppendIntRegEntry("elara_resolution", [
    {
        "condition": [
            {
                "var": "quest_gm_daughter_active",
                "op": "==",
                "val": "true"
            },
            {
                "var": "quest_gm_daughter_saved",
                "op": "==",
                "val": "false"
            },
            {
                "var": "quest_gm_daughter_won",
                "op": "==",
                "val": "true"
            }
        ],
        "data": {
            "dialogue": elara_resolution_dlg_574,
            "on_finish": {
                "actions": [
                    {
                        "type": "reward",
                        "item": "Elara",
                        "count": 1
                    },
                    {
                        "type": "set_state",
                        "key": "quest_gm_daughter_saved",
                        "val": "true"
                    },
                    {
                        "type": "log",
                        "text": "Elara joined the party! Return to Guildmaster."
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("follower_elara_talk", [
    {
        "condition": "default",
        "data": {
            "log_only": "Elara: Thanks for helping me back there."
        }
    }
]);

AppendIntRegEntry("tavern", [
    {
        "condition": [
            {
                "type": "follower",
                "id": "Elara",
                "in_party": true
            },
            {
                "var": "elara_romance_talk_done",
                "op": "==",
                "val": "false"
            },
            {
                "var": "rand:uniform",
                "op": "<",
                "val": "1"
            }
        ],
        "data": {
            "dialogue": tavern_dlg_558,
            "on_finish": {
                "actions": [
                    {
                        "type": "set_state",
                        "key": "elara_romance_talk_done",
                        "val": "true"
                    },
                    {
                        "type": "set_state",
                        "key": "elara_night_pending",
                        "val": "true"
                    },
                    {
                        "type": "set_state",
                        "key": "player_hp",
                        "val": "100"
                    },
                    {
                        "type": "log",
                        "text": "You feel refreshed."
                    }
                ]
            }
        }
    }
]);

AppendIntRegEntry("harbor_main", [
    {
        "condition": "default",
        "data": {
            "dialogue": harbor_main_dlg_774,
            "binding": "ship answer",
            "on_finish": {
                "actions": [],
                "check_var": "ship answer",
                "switch_case": {
                    "to island": {
                        "actions": [
                            {
                                "type": "goto",
                                "target": "tropical island"
                            }
                        ]
                    },
                    "nevermind": {
                        "actions": []
                    }
                }
            }
        }
    }
]);

AppendIntRegEntry("harbor_island", [
    {
        "condition": "default",
        "data": {
            "dialogue": harbor_island_dlg_731,
            "binding": "ship answer",
            "on_finish": {
                "actions": [],
                "check_var": "ship answer",
                "switch_case": {
                    "to town": {
                        "actions": [
                            {
                                "type": "goto",
                                "target": "town"
                            }
                        ]
                    },
                    "nevermind": {
                        "actions": []
                    }
                }
            }
        }
    }
]);

// :::::: Maps :::::::::::::::::::::::::::::::::::::::::::::::::::::::

let WORLD_MAP = {
    "scene:open world:🌍 Open World:icon.png; fn_interaction:game_intro": {
        "scene:town:🏬 Town:town.png": {
            "return:return:🔙 Exit:icon.png": {},
            "scene:castle:🏰 Castle:icon.png; fn_interaction:castle": {
                "return:return:🔙 Exit:icon.png": {}
            },
            "scene:adventurer's guild:🧝 Adventurer's guild:icon.png; fn_interaction:adv_guild": {
                "return:return:🔙 Exit:icon.png": {},
                "scene:gm:📜 Guildmaster:icon.png; fn_interaction:gm_interaction": null
            },
            "scene:tavern:🍺 The Rusty Sword Tavern:icon.png; fn_interaction:tavern": {
                "return:return:🔙 Exit:icon.png": {},
                "scene:recruit_merc:🍺 Approach Mercenary:icon.png; fn_interaction:recruit_merc; fn_condition:recruit_merc_cond": null,
                "scene:recruit_healer:🌿 Approach Healer:icon.png; fn_interaction:recruit_healer; fn_condition:recruit_healer_cond": null
            },
            "scene:blacksmith:🔨 Blacksmith:icon.png": {
                "return:return:🔙 Exit:icon.png": {},
                "craft:smelt ore:🧱 Smelt ores:icon.png": [
                    1000,
                    "Smelting ores...",
                    {
                        "input:Oak log": 0.5,
                        "input:Copper ore": 1,
                        "output:Copper ingot": 1
                    },
                    {
                        "smithing": 1
                    }
                ],
                "craft:craft dagger:🗡️ Make a dagger:icon.png": [
                    1000,
                    "Crafting...",
                    {
                        "input:Copper ingot": 1,
                        "output:Copper dagger": 1
                    },
                    {
                        "smithing": 5
                    }
                ],
                "craft:craft dagger:🎽 Make a plate armor:icon.png": [
                    1000,
                    "Crafting...",
                    {
                        "input:Copper ingot": 2,
                        "output:Copper plate armor": 1
                    },
                    {
                        "smithing": 10
                    }
                ],
                "craft:craft dagger:👖 Make a plate leggings:icon.png": [
                    1000,
                    "Crafting...",
                    {
                        "input:Copper ingot": 2,
                        "output:Copper plate leggings": 1
                    },
                    {
                        "smithing": 10
                    }
                ]
            },
            "scene:harbor:⛵ Harbor:icon.png; fn_interaction:harbor_main": null
        },
        "scene:woods:🌲 Woods:icon.png; fn_interaction:woods": {
            "return:return:🔙 Exit:icon.png": {},
            "fight:fight:⚔️ Hunt Monsters:icon.png": [
                1000,
                "Hunting in the woods...",
                {
                    "Goblin Scout": [
                        0.6,
                        Goblin_Scout
                    ],
                    "Dire Wolf": [
                        0.4,
                        Dire_Wolf
                    ]
                }
            ]
        },
        "scene:Demon king's Castle:😈 Dark Castle:icon.png": {
            "return:return:🔙 Exit:icon.png": {},
            "dungeon:throne:☠️ Approach Throne:icon.png; fn_interaction:demon_king": [
                [
                    1000,
                    "Fighting guards...",
                    {
                        "Shadow Knight": [
                            1,
                            Shadow_Knight
                        ]
                    }
                ],
                [
                    1000,
                    "EPIC BATTLE...",
                    {
                        "Demon King": [
                            1,
                            Demon_King
                        ]
                    }
                ],
                [
                    "fn_interaction:demon_king_defeated"
                ]
            ]
        },
        "scene:forest clearing:🪵 Forest clearing:icon.png": {
            "return:return:🔙 Exit:icon.png": {},
            "harvest:cut trees:🪓 Cut tree:icon.png": [
                1000,
                "Chopping wood...",
                {
                    "Oak log": 1
                },
                {
                    "woodcutting": 2
                }
            ]
        },
        "scene:mining quarry:🪨 Mining quarry:quarry_dark.png": {
            "return:return:🔙 Exit:icon.png": {},
            "harvest:mine ores:⛏️ Mine ores:icon_pickaxe.png": [
                1000,
                "Mining rocks...",
                {
                    "Copper ore": 1,
                    "Garnet": 0.1
                },
                {
                    "mining": 2
                }
            ]
        }
    },
    "scene:tropical island:🏝️ Tropical Island:icon.png": {
        "scene:harbor:⛵ Harbor:icon.png; fn_interaction:harbor_island": null
    }
};
