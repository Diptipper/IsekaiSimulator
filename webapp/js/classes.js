// --- CORE CLASS DEFINITIONS ---
class Skills { 
    constructor(a, d, h, l) { 
        this.attack=a; this.defense=d; this.healing=h; this.agility=l; 
    } 
    add(o) { 
        return new Skills(this.attack+o.attack, this.defense+o.defense, this.healing+o.healing, this.agility+o.agility); 
    }
}

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