// --- CORE CLASS DEFINITIONS ---
class Skills { 
    constructor(a, d, h, l, m=0, wc=0, s=0) { 
        this.attack=a; this.defense=d; this.healing=h; this.agility=l; 
        this.mining=m; this.woodcutting=wc; this.smithing=s;
    } 
    add(o) { 
        return new Skills(
            this.attack+o.attack, this.defense+o.defense, this.healing+o.healing, this.agility+o.agility,
            this.mining+(o.mining||0), this.woodcutting+(o.woodcutting||0), this.smithing+(o.smithing||0)
        ); 
    }
}


// --- CONFIGURATION ---
const SKILL_CONSTANTS = {
    default:       { A: 50, B: 0.1 },
    "smithing":    { A: 50, B: 0.1 },
    "mining":      { A: 50, B: 0.1 },
    "woodcutting": { A: 50, B: 0.1 },
    // Combat skills
    "attack":      { A: 10, B: 0.1 }, // Example: Combat is slightly harder
    "defense":     { A: 10, B: 0.1 },
    "healing":     { A: 10, B: 0.1 },
    "agility":     { A: 10, B: 0.1 }
};


class Item { 
    constructor(n, w, b, l, a, hp, sk) { 
        this.name=n; 
        this.is_weapon=w; 
        this.is_armor_body=b; 
        this.is_armor_leggings=l; 
        this.amount=a; 
        this.bonus_hp=hp; 
        this.bonus_skills=sk||new Skills(0,0,0,0); 
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