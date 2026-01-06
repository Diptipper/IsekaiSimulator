// --- CORE CLASS DEFINITIONS ---
class Skills { 
    constructor(a, d, h, l) { 
        this.attack=a; this.defense=d; this.healing=h; this.luck=l; 
    } 
    add(o) { 
        return new Skills(this.attack+o.attack, this.defense+o.defense, this.healing+o.healing, this.luck+o.luck); 
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