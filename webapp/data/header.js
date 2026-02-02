// --- CORE CLASS DEFINITIONS ---
class Skills { 
    // Changed 'a' (attack) to 's' (strength) in constructor param for clarity, though order matters most
    constructor(s, d, h, l, m=0, wc=0, sm=0) { 
        this.strength=s; this.defense=d; this.vitality=h; this.agility=l; 
        this.mining=m; this.woodcutting=wc; this.smithing=sm;
    } 
    add(o) { 
        return new Skills(
            this.strength+o.strength, this.defense+o.defense, this.vitality+o.vitality, this.agility+o.agility,
            this.mining+(o.mining||0), this.woodcutting+(o.woodcutting||0), this.smithing+(o.smithing||0)
        ); 
    }
}


class Item { 
    constructor(n, w, b, l, a, hp, sk, sc) { 
        this.name=n; 
        this.is_weapon=w; 
        this.is_armor_body=b; 
        this.is_armor_leggings=l; 
        this.amount=a; 
        this.bonus_hp=hp; 
        this.bonus_skills=sk||new Skills(0,0,0,0);
        // Default scaling is strength if not specified
        this.scaling = sc || "strength"; 
    }
}

class Enemy { 
    constructor(n, hp, loots, skills) { 
        this.name=n; 
        this.hp=hp; 
        this.maxHp=hp; 
        this.loots=loots; 
        this.skills=skills; 
    }
}

class Follower { 
    constructor(n, hp, skills, interaction_id) { 
        this.name = n; 
        this.hp = hp; 
        this.maxHp = hp; 
        this.skills = skills; 
        this.interaction_id = interaction_id || null;
    }
}



// --- CONFIGURATION ---
const SKILL_CONSTANTS = {
    default:       { A: 40, B: 0.1 },
    "smithing":    { A: 40, B: 0.1 },
    "mining":      { A: 40, B: 0.1 },
    "woodcutting": { A: 40, B: 0.1 },
    // Combat skills
    "strength":    { A: 20, B: 0.1 },
    "defense":     { A: 20, B: 0.1 },
    "vitality":    { A: 20, B: 0.1 },
    "agility":     { A: 20, B: 0.1 }
};

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
const startingScene = "scene:open world:🌍 Open World:icon.png; fn_interaction:game_intro"

