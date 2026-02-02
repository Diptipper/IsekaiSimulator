
// --- UTILITIES ---
function dictDraw(dct) {
    let norm=0;
    let entries=[];
    for(let key in dct){
        let w=dct[key];
        let i=key;
        if(Array.isArray(w)){
            i=w[1];
            w=w[0];
        }
        if(w<0) return null;
        norm+=w;
        entries.push({item:i, weight:w});
    }
    let r=Math.random()*norm;
    let acc=0;
    for(let e of entries){
        acc+=e.weight;
        if(r<acc) return e.item;
    }
    return null;
}
function dictDrawMultiple(dct) {
    // all probs should be positive less than 1
    let items = [];
    for(let key in dct){
        let w=dct[key];
        let r=Math.random();
        if(r<w) items.push(key);
    }
    return items;
}
function createFloatingTextPlaceholder(filename, extraClasses = "") { const div = document.createElement('div'); div.className = `missing-asset-placeholder ${extraClasses}`; div.innerText = `FILE NOT FOUND:\n${filename}`; return div; }
function safelySetBackgroundImage(containerId, imgId, basePath, filename) { const container = document.getElementById(containerId); const img = document.getElementById(imgId); img.style.display = 'block'; const existingPlaceholder = container.querySelector('.missing-asset-placeholder'); if (existingPlaceholder) container.removeChild(existingPlaceholder); img.onerror = function() { this.style.display = 'none'; container.appendChild(createFloatingTextPlaceholder(filename)); }; img.src = basePath + filename; }

// --- Math function ---
function landing_chance(agility_diff){
    if(agility_diff<0) return 2/(4-agility_diff);
    else return (1+Math.tanh(agility_diff/2))/2;
}

// --- PATHFINDING & COMPRESSION ---
const findSceneNode = (tree, targetId, visited = new Set()) => {
    if (typeof tree !== 'object' || tree === null || visited.has(tree))
        return null; visited.add(tree);
    for (let key in tree) {
        if (!key.includes(':'))
            continue;
        const parts = key.split(';')[0].split(':');
        const id = parts[1];
        if (id === targetId)
            return { key: key, node: tree[key] };
        const childNode = tree[key];
        if (childNode && typeof childNode === 'object' && !Array.isArray(childNode)) {
            const result = findSceneNode(childNode, targetId, visited);
            if (result) return result;
        }
    }
    return null;
};
const findPathToNode = (tree, targetId, currentPath = []) => {
    for (let key in tree) {
        const parts = key.split(';')[0].split(':');
        const id = parts[1];
        if (id === targetId)
            return [...currentPath, { key: key, node: tree[key] }];
        const childNode = tree[key];
        if (childNode && typeof childNode === 'object' && !Array.isArray(childNode)) {
            const result = findPathToNode(childNode, targetId,
                [...currentPath, { key: key, node: tree[key] }]);
            if (result)
                return result;
        }
    }
    return null;
};
const Compressor = { compress: function(u){let i,d={},c,wc,w="",r=[],s=256;for(i=0;i<256;i++)d[String.fromCharCode(i)]=i;for(i=0;i<u.length;i++){c=u.charAt(i);wc=w+c;if(d.hasOwnProperty(wc))w=wc;else{r.push(d[w]);d[wc]=s++;w=String(c);}}if(w!=="")r.push(d[w]);return r;}, decompress: function(c){let i,d=[],w,r,k,e="",s=256;for(i=0;i<256;i++)d[i]=String.fromCharCode(i);w=String.fromCharCode(c[0]);r=w;for(i=1;i<c.length;i++){k=c[i];if(d[k])e=d[k];else if(k===s)e=w+w.charAt(0);else return null;r+=e;d[s++]=w+e.charAt(0);w=e;}return r;}, encode: function(s){const d=this.compress(s),a16=new Uint16Array(d),a8=new Uint8Array(a16.buffer);let b='';for(let i=0;i<a8.byteLength;i++)b+=String.fromCharCode(a8[i]);return btoa(b);}, decode: function(b64){const b=atob(b64),bytes=new Uint8Array(b.length);for(let i=0;i<b.length;i++)bytes[i]=b.charCodeAt(i);const a16=new Uint16Array(bytes.buffer);return this.decompress(Array.from(a16));}};

// --- CHARACTER MENU LOGIC ---
class CharacterMenu {
    constructor() {
        this.name="Player";
        this.inventory={};
        this.equipment={weapon:null, body:null, leggings:null};
        this.followers=[];
        this.active=false;
        this.hp=10;
        
        // REPLACED: Old explicit Stats with Skill Experience System
        this.skillExp = {
            "attack": 0,
            "defense": 0,
            "healing": 0,
            "agility": 0,
            "mining": 0,
            "woodcutting": 0,
            "smithing": 0
        };
        
        this.menuCursor=0;
        this.interactables=[];
    }
    
    // --- SKILL SYSTEM METHODS ---
    getSkillLevel(skillName) {
        // Calculate level based on accumulated XP
        let xp = this.skillExp[skillName] || 0;
        let level = 1;
        
        // Loop to find current level (iterative approach for simplicity with the formula)
        while (true) {
            let needed = this.getExpRequiredForNext(skillName, level);
            if (xp >= needed) {
                xp -= needed;
                level++;
            } else {
                break;
            }
        }
        return level;
    }
    
    // Returns the XP needed to go from current level to next level
    // Formula: floor(A * exp(B * level))
    getExpRequiredForNext(skillName, currentLevel) {
        const config = SKILL_CONSTANTS[skillName] || SKILL_CONSTANTS.default;
        return Math.floor(config.A * Math.exp(config.B * currentLevel));
    }

    // Returns { current: 15, max: 100 } for bar display
    getSkillProgress(skillName) {
        let xp = this.skillExp[skillName] || 0;
        let level = 1;
        while (true) {
            let needed = this.getExpRequiredForNext(skillName, level);
            if (xp >= needed) {
                xp -= needed;
                level++;
            } else {
                return { current: xp, max: needed, level: level };
            }
        }
    }

    gainSkillExp(skillName, amount) {
        if (!this.skillExp[skillName]) this.skillExp[skillName] = 0;
        const oldLevel = this.getSkillLevel(skillName);
        this.skillExp[skillName] += amount;
        const newLevel = this.getSkillLevel(skillName);
        
        if (newLevel > oldLevel) {
            Game.log(`Level Up! ${skillName} is now ${newLevel}.`);
        }
    }

    createItem(n, a) { let d=ITEM_DEFINITIONS[n]||{}; return new Item(n, d.is_weapon, d.is_armor_body, d.is_armor_leggings, a, d.bonus_hp||0, d.bonus_skills); }
    addItem(n, a=1) {
        if(typeof n === 'object' && n.name) n = n.name;
        if(!this.inventory[n] && a < 0) return;
        if(!this.inventory[n]) {
            this.inventory[n] = this.createItem(n, 0);
        }
        this.inventory[n].amount += a;
        if (this.inventory[n].amount <= 0) {
            delete this.inventory[n];
        }
    }
    getItemCount(n) { return this.inventory[n]?this.inventory[n].amount:0; }
    equipItem(n) { if(!this.inventory[n]||this.inventory[n].amount<=0)return; let i=this.inventory[n], s=i.is_weapon?"weapon":i.is_armor_body?"body":i.is_armor_leggings?"leggings":null; if(s){ this.unequipItem(s); i.amount--; if(i.amount===0)delete this.inventory[n]; this.equipment[s]=this.createItem(n,1); Game.render(); }}
    unequipItem(s) { if(this.equipment[s]){ this.addItem(this.equipment[s].name,1); this.equipment[s]=null; Game.render(); }}
    
    addFollower(name) {
        const def = FOLLOWER_DEFINITIONS[name];
        if(def) {
            this.followers.push(new Follower(name, def.hp, def.skills, def.interaction));
            Game.log(`${name} joined the party!`);
        }
    }

    removeFollower(name) {
        const idx = this.followers.findIndex(f => f.name === name);
        if(idx > -1) {
            this.followers.splice(idx, 1);
            Game.log(`${name} left the party.`);
        }
    }

    getRawCombatSkills() { 
        // Base stats are now directly equal to the Skill Level
        return new Skills(
            this.getSkillLevel("attack"), 
            this.getSkillLevel("defense"), 
            this.getSkillLevel("healing"), 
            this.getSkillLevel("agility")
        ); 
    }
    
    getCombatSkills() { let t=this.getRawCombatSkills(); for(let s in this.equipment) if(this.equipment[s]) t=t.add(this.equipment[s].bonus_skills); return t; }
    
    // HP Formula: 10 + (Defense Level * 5)
    getMaxHP() { 
        let b=10+(this.getSkillLevel("defense")*5); 
        let bo=0; for(let s in this.equipment)if(this.equipment[s])bo+=this.equipment[s].bonus_hp; return b+bo; 
    }
    
    moveCursor(o) { if(this.interactables.length===0)return; this.menuCursor+=o; if(this.menuCursor<0)this.menuCursor=this.interactables.length-1; if(this.menuCursor>=this.interactables.length)this.menuCursor=0; Game.render(); }
    selectOption() { 
        if(this.interactables.length===0)return; 
        const t=this.interactables[this.menuCursor]; 
        if(t.type==='slot') this.unequipItem(t.id); 
        else if(t.type==='item') this.equipItem(t.id);
        else if(t.type==='follower') { 
            Game.toggleCharacterMenu();
            if(t.action) SceneFunctions.fn_interaction(null, t.action);
        }
        else if(t.type==='close') Game.toggleCharacterMenu(); 
    }
    getDisplayHTML() {
        this.interactables = [];
        let c = 0, invH = "", keys = Object.keys(this.inventory), equipH = "", follH = "";
        
        // 1. EQUIPMENT
        ['weapon', 'body', 'leggings'].forEach(s => {
            let i = this.equipment[s];
            this.interactables.push({ type: 'slot', id: s });
            let sel = (c === this.menuCursor); 
            let sc = "equip-slot interactive-row" + (sel ? " menu-focus-row" : ""); 
            equipH += `<div class="${sc}" onmouseenter="Game.updateCharacterCursor(${c})"><span>${i ? `${i.name} <span class="inv-btn" onclick="Game.player.unequipItem('${s}')">Unequip</span>` : `<span style="color:#666">Empty ${s}</span>`}</span></div>`;
            c++;
        });

        // 2. FOLLOWERS
        if(this.followers.length > 0) {
            this.followers.forEach((f, idx) => {
                this.interactables.push({ type: 'follower', id: idx, action: f.interaction_id });
                let sel = (c === this.menuCursor);
                let rowClass = "interactive-row" + (sel ? " menu-focus-row" : "");
                follH += `<div class="${rowClass}" style="display:flex; justify-content:space-between; padding:2px 4px; cursor:pointer;" 
                               onmouseenter="Game.updateCharacterCursor(${c})" 
                               onclick="Game.player.selectOption()">
                    <span>${f.name} (Lv.${Math.floor((f.skills.attack+f.skills.defense)/2)})</span>
                    <span style="font-size:11px; color:#aaa;">HP:${Math.ceil(f.hp)}/${f.maxHp}</span>
                </div>`;
                c++;
            });
        } else {
            follH = "<div style='color:#666; font-style:italic'>(No companions)</div>";
        }

        // 3. INVENTORY
        if (keys.length > 0) {
            keys.forEach(k => {
                let i = this.inventory[k], dc = Number.isInteger(i.amount) ? i.amount : i.amount.toFixed(1), ce = (i.is_weapon || i.is_armor_body || i.is_armor_leggings);
                this.interactables.push({ type: ce ? 'item' : 'none', id: k });
                let sel = (c === this.menuCursor); 
                let rs = "display:flex; justify-content:space-between; margin-bottom:4px; padding:2px 4px; border-radius:4px; border:1px solid transparent;" + (sel ? " border-color: var(--accent); background: rgba(255,255,255,0.1);" : "");
                let rowClass = "interactive-row" + (sel ? " menu-focus-row" : "");
                invH += `<div class="${rowClass}" style="${rs}" onmouseenter="Game.updateCharacterCursor(${c})"><span>- ${i.name} x${dc}</span>${ce ? `<span class="inv-btn" onclick="Game.player.equipItem('${k}')">Equip</span>` : ""}</div>`;
                c++;
            });
        } else {
            invH = "<div style='color:#666; font-style:italic'>(Bag is empty)</div>";
        }

        // 4. SKILLS WITH BARS
        const skillList = ["attack", "defense", "healing", "agility", "mining", "woodcutting", "smithing"];
        const bonusSkills = this.getCombatSkills(); // Calculated with equipment
        const baseSkills = this.getRawCombatSkills(); // Base levels

        let skillsHTML = '<div style="display:grid; grid-template-columns: 1fr; gap:8px;">';
        
        skillList.forEach(skill => {
            // Get progress for the bar (using Base Stats)
            const prog = this.getSkillProgress(skill); 
            const pct = (prog.current / prog.max) * 100;
            
            // Calculate Bonus Text (Green +X)
            let baseVal = prog.level;
            let totalVal = bonusSkills[skill] !== undefined ? bonusSkills[skill] : baseVal;
            let bonusText = (totalVal > baseVal) ? `<span style="color:#4f4; font-size:10px;">+${totalVal - baseVal}</span>` : "";

            // Capitalize Name
            let displayName = skill.charAt(0).toUpperCase() + skill.slice(1);

            skillsHTML += `
            <div>
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
                    <span style="color:#ddd;">${displayName}</span>
                    <span>Lv.${baseVal}${bonusText} <span style="color:#999; font-size:10px;">(${Math.floor(prog.current)}/${Math.floor(prog.max)})</span></span>
                </div>
                <div style="width:100%; height:4px; background:#333; border-radius:2px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--skill); box-shadow:0 0 5px var(--accent);"></div>
                </div>
            </div>`;
        });
        skillsHTML += '</div>';

        let hpHtml = `<div>HP: ${Math.floor(this.hp)} / ${this.getMaxHP()}</div>`;

        this.interactables.push({ type: 'close', id: 'close' });
        let closeSel = (c === this.menuCursor);
        let closeClass = "menu-item interactive-row" + (closeSel ? " menu-focus-row" : "");
        let closeBtn = `<div class="${closeClass}" style="justify-content:center; margin-top:15px; background:#444; color:#fff; font-weight:bold; text-align:center; cursor:pointer;" onclick="Game.toggleCharacterMenu()" onmouseenter="Game.updateCharacterCursor(${c})">CLOSE BAG</div>`;

        return `<div style="font-family:'Courier New'; line-height:1.4; font-size:13px;">
            <div style="border-bottom:1px solid #555; margin-bottom:10px; padding-bottom:5px; text-align:center;"><strong>CHARACTER MENU</strong></div>
            <div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold;">ATTRIBUTES</div>${hpHtml}</div>
            <div style="margin-bottom:15px;">${skillsHTML}</div>
            <div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">EQUIPMENT (Enter to Unequip)</div>${equipH}</div>
            <div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">PARTY</div>${follH}</div>
            <div><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">INVENTORY (Enter to Equip)</div><div id="inv-scroll-container" style="max-height:150px; overflow-y:auto; padding-right:5px;">${invH}</div></div>
            ${closeBtn}</div>`;
    }}
// --- SCENE FUNCTIONS ---
const SceneFunctions = {
    fn_interaction: function(next, interactionId) {
        const rules = INTERACTION_REGISTRY[interactionId];
        if (!rules) {
            console.error("Missing interaction:", interactionId);
            if(next)
                next();
            return;
        }

        // 1. Find active rule
        let activeRule = rules.find(r => {
            if (r.condition === "default")
                return true;
            const conditions = Array.isArray(r.condition) ? r.condition : [r.condition];
            
            return conditions.every(cond => Game.checkCriteria(cond));
        });

        if (!activeRule) {
            if(next) next();
            return;
        }

        const data = activeRule.data;

        // 2. Define Action Executor
        const executeActions = (actList) => {
            if (!actList) return;
            actList.forEach(act => {
                if (act.type === "set_state") GLOBAL_STATE.variables[act.key] = act.val;
                else if (act.type === "reward") {
                    if (FOLLOWER_DEFINITIONS[act.item]) {
                        Game.player.addFollower(act.item);
                    } else {
                        Game.player.addItem(act.item, act.count);
                    }
                }
                else if (act.type === "consume") {
                    if (FOLLOWER_DEFINITIONS[act.item]) {
                        Game.player.removeFollower(act.item);
                    } else {
                        Game.player.addItem(act.item, -act.count);
                    }
                }
                else if (act.type === "log") Game.log(act.text);
                else if (act.type === "interaction") {
                    SceneFunctions.fn_interaction(null, act.id);
                }
                else if (act.type === "goto") {
                    const fullPath = findPathToNode(WORLD_MAP, act.target);
                    if (fullPath && fullPath.length > 0) {
                        const target = fullPath.pop();
                        Game.pathStack = fullPath.map(step => {
                            const info = Game.parseKey(step.key);
                            return {
                                key: step.key,
                                node: step.node,
                                title: info.id,
                                image: info.image,
                                cursor: 0
                            };
                        });
                        Game.currentNode = null;
                        Game.enterScene(target.key, target.node);
                    }
                }
                else if (act.type === "fight") {
                    if (Game.inDialogue) Game.endDialogue();
                    Game.stopAction();
                    
                    Game.currentActionName = "scripted_fight";
                    Game.activeBinding = act.binding || null;
                    Game.nextInteraction = act.next || null; // <--- NEW: Capture the chain ID

                    Game.startFightLoop(
                        act.interval || 1000, 
                        act.text || "Ambush!", 
                        act.enemy
                    );
                    Game.render();
                }
                else if (act.type === "dungeon") {
                    if (Game.inDialogue) Game.endDialogue();
                    Game.stopAction();
                    
                    Game.currentActionName = "scripted_dungeon";
                    Game.activeBinding = act.binding || null;
                    Game.nextInteraction = act.next || null;

                    Game.startDungeonLoop(act.sequence);
                    Game.render();
                }
            });
        };

        // 3. Define Logic Processor (Refactored from original nesting)
        const processLogic = (logic) => {
            if (!logic) return;

            // CHECK VAR LOGIC
            if (logic.check_var) {
                const val = GLOBAL_STATE.variables[logic.check_var];

                // A. Boolean Logic (if_true / if_false)
                if (logic.if_true && val) {
                    logic.if_true.dialogue 
                        ? Game.startDialogue(logic.if_true.dialogue, () => executeActions(logic.if_true.actions)) 
                        : executeActions(logic.if_true.actions);
                } else if (logic.if_false && !val) {
                    logic.if_false.dialogue 
                        ? Game.startDialogue(logic.if_false.dialogue, () => executeActions(logic.if_false.actions)) 
                        : executeActions(logic.if_false.actions);
                }

                // B. Simple Value Map (actions only, for legacy support)
                if (logic.if_value) {
                    const branch = logic.if_value[val] || logic.if_value["default"];
                    if (branch) executeActions(branch.actions);
                }

                // C. Switch Case Logic (actions + dialogue)
                if (logic.switch_case) {
                    const branch = logic.switch_case[val] || logic.switch_case["else"] || logic.switch_case["default"];
                    if (branch) {
                        branch.dialogue 
                            ? Game.startDialogue(branch.dialogue, () => executeActions(branch.actions)) 
                            : executeActions(branch.actions);
                    }
                }
            }
            
            // Always execute base actions for this logic block
            executeActions(logic.actions);
        };

        // 4. Handle Immediate Data
        if (data.log_only) {
            Game.log(data.log_only);
            if (next) next();
            return;
        }

        if (data.binding) GLOBAL_STATE.activeVariable = data.binding;

        // 5. Execution Flow
        if (data.dialogue) {
            // CASE A: Dialogue exists -> Play dialogue -> Run Logic -> Next
            Game.startDialogue(data.dialogue, () => {
                if (data.on_finish) processLogic(data.on_finish);
                if (next) next();
            });
        } else {
            // CASE B: No Dialogue -> Run Logic immediately -> Next
            if (data.on_finish) processLogic(data.on_finish);
            if (next) next();
        }
    }
};
// --- MAIN GAME ENGINE ---
const Game = {
    player: new CharacterMenu(),
    currentNode: null,
    currentTitle: "",
    currentImage: "",
    currentKey: "",
    pathStack: [],
    cursor: 0,
    choiceCursor: 0,
    activeInterval: null,
    combatTimer: null,
    activeBinding: null,
    nextInteraction: null,
    currentActionName: "",
    inCombat: false,
    inDialogue: false,
    inMainMenu: true,
    dialogueQueue: [],
    dialogueIndex: 0,
    dialogueOnComplete: null,
    dungeonStages: [],
    dungeonIndex: 0,
    currentDungeonEnemy: null,
    dungeonTurn: 0,
    
    init: function() {
        this.player.hp = this.player.getMaxHP();
        this.createCombatElements();
        this.createMapElements();
        this.setupUI();
        this.setupInput();
        this.startPassiveRegen();
        this.showMainMenu();
        this.updatePlayerHUD();
    },
    setupUI: function() { const attach = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; }; attach('menu-toggle-btn', () => this.toggleCharacterMenu()); attach('system-menu-btn', () => this.toggleSaveModal(true)); attach('btn-close-modal', () => this.toggleSaveModal(false)); attach('btn-copy-save', () => this.generateSave()); attach('btn-load-save', () => this.loadSave()); },
    createCombatElements: function() {
        if (document.getElementById('combat-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'combat-panel';
        panel.innerHTML = `
            <div id="combat-log-feed"></div>
            <div id="combat-controls">
                <button id="btn-combat-end">CONTINUE (ENTER)</button>
            </div>
        `;
        const parent = document.getElementById('control-panel');
        if (parent) { parent.appendChild(panel); } else { document.body.appendChild(panel); }
        
        // --- NEW: Create Skill Bar Element ---
        const hud = document.getElementById('hud-overlay');
        const skillDiv = document.createElement('div');
        skillDiv.id = 'temp-skill-bar-container';
        skillDiv.style.cssText = "display:none; width: 50%; margin: 0 auto; background:rgba(0,0,0,0.8); border:1px solid #777; border-radius:4px; padding:2px; pointer-events:none;";
        skillDiv.innerHTML = `<div id="temp-skill-name" style="color:white; font-size:10px; text-align:center; margin-bottom:2px;">Skill</div>
                              <div style="height:4px; background:#333; width:100%; position:relative;">
                                <div id="temp-skill-fill" style="height:100%; width:0%; background:#3498db;"></div>
                              </div>`;
        hud.appendChild(skillDiv);
    },
    showMainMenu: function() {
        this.inMainMenu = true;
        this.stopAction();
        document.getElementById('hud-overlay').style.display = 'none';
        document.getElementById('location-pill').style.display = 'none';
        safelySetBackgroundImage('scene-bg-container', 'scene-image', "images/bg/", "title_screen.png");
        const menuContainer = document.getElementById('menu-list'); menuContainer.innerHTML = '';
        const options = ["Start New Game", "Load Game"]; this.cursor = -1;
        const renderMenu = () => {
            menuContainer.innerHTML = `<div class="main-menu-screen"><div class="title-text">✨ ISEKAI SIMULATOR ✨<br><span style="font-size:12px; color:#888;">Text Edition</span></div><div id="mm-opts" style="width:100%"></div></div>`;
            const optsContainer = document.getElementById('mm-opts');
            options.forEach((opt, idx) => {
                const el = document.createElement('div');
                el.className = 'menu-item' + (idx === this.cursor ? ' active' : '');
                el.innerHTML = `<span style="pointer-events: none;">${opt}</span>`;
                el.onmouseenter = () => { this.cursor = idx; const allItems = optsContainer.querySelectorAll('.menu-item'); allItems.forEach(item => item.classList.remove('active')); el.classList.add('active'); };
                el.onclick = () => { if(idx === 0) this.startNewGame(); if(idx === 1) this.toggleSaveModal(true); };
                optsContainer.appendChild(el);
            });
        };
        renderMenu();
    },
    createMapElements: function() {
        const visualPanel = document.getElementById('visual-panel'); 
        if (!visualPanel) return;
        const overlay = document.createElement('div');
        overlay.id = 'mini-map-overlay';
        overlay.innerHTML = `<svg id="map-lines"></svg><div id="map-nodes"></div>`;
        visualPanel.appendChild(overlay);
    },
    startNewGame: function() { this.inMainMenu = false; document.getElementById('hud-overlay').style.display = 'flex'; document.getElementById('location-pill').style.display = 'block'; this.player = new CharacterMenu(); this.player.hp = this.player.getMaxHP(); this.pathStack = []; Object.keys(GLOBAL_STATE.variables).forEach(k => { if(typeof GLOBAL_STATE.variables[k] === 'boolean') GLOBAL_STATE.variables[k] = false; if(GLOBAL_STATE.variables[k] === 'completed' || GLOBAL_STATE.variables[k] === 'started') GLOBAL_STATE.variables[k] = 'not_started'; }); const rootKey = startingScene; this.enterScene(rootKey, WORLD_MAP[rootKey]); },

    // --- SAVE / LOAD ---
    toggleSaveModal: function(show) { const modal = document.getElementById('save-modal'); if(show) { modal.classList.add('active'); document.getElementById('save-data-area').value = ""; document.getElementById('save-msg').innerText = ""; } else { modal.classList.remove('active'); } },
    generateSave: function() {
        try {
            const p = this.player;
            const pureInventory = [];
            for (let k in p.inventory)
                pureInventory.push([k, p.inventory[k].amount]);
            const pureEquip = [];
            ['weapon', 'body', 'leggings'].forEach(slot => {
                if (p.equipment[slot])
                    pureEquip.push(p.equipment[slot].name);
                });
            const locId = this.parseKey(this.currentKey).id;
            const pureStack = this.pathStack.map(step => this.parseKey(step.key).id);
            const pureFollowers = this.player.followers.map(f => f.name);
            const saveData = { 
                v: GLOBAL_STATE.variables, 
                l: locId, 
                s: pureStack, 
                p: {    hp: p.hp, 
                        skills: p.skillExp, // SAVING SKILL EXP
                        inv: pureInventory,
                        eq: pureEquip, fl: pureFollowers
                },
            };
            const finalStr = `RPG✨${Compressor.encode(JSON.stringify(saveData))}`;
            const area = document.getElementById('save-data-area');
            area.value = finalStr;
            area.select();
            document.execCommand('copy');
            document.getElementById('save-msg').innerText = "Compressed Save Copied!";
            document.getElementById('save-msg').style.color = "#d4af37";
        } catch (e) {
            console.error(e);
            document.getElementById('save-msg').innerText = "Error saving.";
        }
    },
    loadSave: function() {
        try {
            let rawStr = document.getElementById('save-data-area').value.trim();
            if (!rawStr.startsWith("RPG✨"))
                throw new Error("Missing Save Header");
            rawStr = rawStr.replace("RPG✨", "");
            const data = JSON.parse(Compressor.decode(rawStr));
            GLOBAL_STATE.variables = data.v;
            this.player = new CharacterMenu();
            this.player.hp = data.p.hp;
            
            // LOAD SKILL EXP
            if (data.p.skills) this.player.skillExp = data.p.skills;
            // Legacy Save Support (if loading old save without skills)
            else {
                // If legacy save has 'xp', maybe convert? For now just default 0.
            }
            
            data.p.inv.forEach(item => this.player.addItem(item[0], item[1]));
            if (data.p.fl) {
                data.p.fl.forEach(fname => this.player.addFollower(fname));
            }
            if (data.p.eq)
                data.p.eq.forEach(itemName => {
                    this.player.addItem(itemName, 1);
                    this.player.equipItem(itemName);
                });
            this.pathStack = [];
            if (data.s) {
                data.s.forEach(id => {
                    const found = findSceneNode(WORLD_MAP, id);
                    if (found) {
                        const info = this.parseKey(found.key);
                        this.pathStack.push({
                            key: found.key,
                            node: found.node,
                            title: info.name,
                            image: info.image,
                            cursor: 0
                        });
                    }
                });
            }
            const currentScene = findSceneNode(WORLD_MAP, data.l);
            if (currentScene) {
                this.inMainMenu = false;
                this.toggleSaveModal(false);
                document.getElementById('hud-overlay').style.display = 'flex';
                document.getElementById('location-pill').style.display = 'block';
                this.currentNode = null;
                this.enterScene(currentScene.key, currentScene.node);
            }
        }
        catch (e) {
            console.error(e);
            document.getElementById('save-msg').innerText = "Corrupt/Invalid Save";
            document.getElementById('save-msg').style.color = "#f44";
        }
    },
    // --- Draw the Node Map ---
    drawMiniMap: function(visibleIndices, optionsKeys) {
        const overlay = document.getElementById('mini-map-overlay');
        const linesSvg = document.getElementById('map-lines');
        const nodesDiv = document.getElementById('map-nodes');
        linesSvg.innerHTML = ''; nodesDiv.innerHTML = '';
        if (!this.currentNode || visibleIndices.length === 0 || this.inCombat || this.player.active) { overlay.classList.remove('visible'); return; }
        overlay.classList.add('visible');
        const cx = 50; const cy = 70; 
        const centerNode = document.createElement('div');
        centerNode.className = 'map-node center-node';
        centerNode.style.left = `${cx}%`; centerNode.style.top = `${cy}%`;
        const center_info = this.parseKey(this.currentKey);
        if (center_info.name) {
            const segmenter = new Intl.Segmenter();
            const segments = [...segmenter.segment(center_info.name)];
            centerNode.innerText = segments.length > 0 ? segments[0].segment : "";
        }
        nodesDiv.appendChild(centerNode);
        const count = visibleIndices.length; const radius = 35; const angleStep = (2 * Math.PI) / count;
        visibleIndices.forEach((dataIndex, i) => {
            const key = optionsKeys[dataIndex]; const info = this.parseKey(key);
            const angle = -Math.PI / 2 + (i * angleStep); const nx = cx + (radius * 0.7) * Math.cos(angle); const ny = cy + radius * Math.sin(angle);
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", `${cx}%`); line.setAttribute("y1", `${cy}%`); line.setAttribute("x2", `${nx}%`); line.setAttribute("y2", `${ny}%`); line.setAttribute("class", "map-line");
            linesSvg.appendChild(line);
            const node = document.createElement('div');
            node.className = 'map-node sub-node';
            if (dataIndex === this.cursor) node.classList.add('active');
            const segmenter = new Intl.Segmenter(); const subSegments = [...segmenter.segment(info.name)];
            node.innerText = subSegments.length > 0 ? subSegments[0].segment : "?";
            node.innerText = node.innerText.replace("🔙","➜]");
            node.dataset.index = dataIndex; node.style.left = `${nx}%`; node.style.top = `${ny}%`;
            if (info.role === 'return') { node.style.borderRadius = '15%'; node.style.background = '#4a2c2c'; }
            node.onclick = (e) => { e.stopPropagation(); this.cursor = dataIndex; this.executeOption(key); };
            node.onmouseenter = () => { this.cursor = dataIndex; this.render(); };
            nodesDiv.appendChild(node);
        });
    },
    // --- DIALOGUE ---
    startDialogue: function(dialogueObj, callback) {
        this.inDialogue = true;
        this.dialogueQueue = dialogueObj.data;
        this.dialogueIndex = 0;
        this.dialogueOnComplete = callback;
        document.getElementById('dialogue-visual-layer').classList.add('active');
        document.getElementById('dialogue-box').classList.add('active');
        document.getElementById('menu-list').style.display = 'none';
        document.getElementById('location-pill').classList.remove('visible');
        document.getElementById('mini-map-overlay').classList.remove('visible');
        
        safelySetBackgroundImage('dialogue-bg-container', 'dialogue-bg', "images/bg/", dialogueObj.background);
        const spriteContainer = document.getElementById('sprite-container');
        spriteContainer.innerHTML = '';
        if (dialogueObj.speakers) {
            for (let speakerName in dialogueObj.speakers) {
                const data = dialogueObj.speakers[speakerName];
                const filename = data[0]; const position = data[1];
                let leftPos = "50%", bottomPos = "0%";
                let coords = position.replace(/[()]/g, '').split(',');
                if (coords.length === 2) {
                    leftPos = coords[0];
                    bottomPos = coords[1];
                }
                const wrapper = document.createElement('div');
                wrapper.id = 'sprite-' + speakerName;
                wrapper.className = 'sprite-wrapper';
                wrapper.style.left = leftPos;
                wrapper.style.bottom = bottomPos;
                wrapper.style.transform = `translateX(-${leftPos})`;
                wrapper.style.opacity = '0';
                const img = document.createElement('img');
                img.className = 'character-sprite';
                img.src = "images/sprites/" + filename;
                img.onerror = function() {
                    const placeholder = createFloatingTextPlaceholder(filename, 'character-sprite');
                    wrapper.innerHTML = '';
                    wrapper.appendChild(placeholder);
                };
                wrapper.appendChild(img);
                spriteContainer.appendChild(wrapper);
            }
        } setTimeout(() => { this.renderDialogueFrame(); }, 50);
    },
    advanceDialogue: function() { if (!this.inDialogue) return; const currentStep = this.dialogueQueue[this.dialogueIndex]; if (currentStep && currentStep[0] === 'question' && document.getElementById('dialogue-questions').classList.contains('active')) return; this.dialogueIndex++; if (this.dialogueIndex >= this.dialogueQueue.length) { this.endDialogue(); } else { this.renderDialogueFrame(); } },
    endDialogue: function(returnValue) { this.inDialogue = false; document.getElementById('dialogue-visual-layer').classList.remove('active'); document.getElementById('dialogue-box').classList.remove('active'); document.getElementById('menu-list').style.display = 'flex'; document.getElementById('sprite-container').innerHTML = ''; document.getElementById('location-pill').classList.add('visible'); if (this.dialogueOnComplete) this.dialogueOnComplete(returnValue); this.render(); },
    
    renderDialogueFrame: function() {
        const step = this.dialogueQueue[this.dialogueIndex]; if (!step) return;
        const type = step[0]; const speaker = step[1]; let text = step[2]; const effects = step[3] || []; const questionData = step[4];
        text = text.replace(/\{([a-zA-Z0-9\s]+)\}/g, (match, v) => (GLOBAL_STATE.variables && GLOBAL_STATE.variables[v] !== undefined) ? GLOBAL_STATE.variables[v] : match);
        document.getElementById('speaker-name').innerText = speaker; document.getElementById('dialogue-text').innerText = text;
        
        effects.forEach(effectStr => {
            const parts = effectStr.split(':'); const targetName = parts[0]; const action = parts[1]; const param = parts[2];
            if (targetName === "Scene" || targetName === "Screen") { if (action === "shake") { const c = document.body; c.classList.remove('anim-shake-screen'); void c.offsetWidth; c.classList.add('anim-shake-screen'); } return; }
            const wrapper = document.getElementById('sprite-' + targetName); if (!wrapper) return;
            let img = wrapper.querySelector('.character-sprite') || wrapper.querySelector('.missing-asset-placeholder');
            if(img) { img.classList.remove('anim-fade-in', 'anim-fade-out', 'anim-shake'); void img.offsetWidth; }
            const getScale = () => wrapper.dataset.scale || "1";
            switch (action) {
                case 'fade in': if(img) img.classList.add('anim-fade-in'); wrapper.style.opacity = '1'; break;
                case 'fade out': if(img) img.classList.add('anim-fade-out'); break;
                case 'shake': wrapper.style.opacity = '1'; if(img) img.classList.add('anim-shake'); break;
                case 'show': wrapper.style.opacity = '1'; break;
                case 'hide': wrapper.style.opacity = '0'; break;
                case 'move': if (param) { let c = param.replace(/[()]/g, '').split(','); if (c.length === 2) { wrapper.style.left = c[0]; wrapper.style.bottom = c[1]; wrapper.style.transform = `translateX(-${c[0]}) scale(${getScale()})`; } } break;
                case 'scale': if (param) { wrapper.dataset.scale = param; wrapper.style.transform = `translateX(-${wrapper.style.left}) scale(${param})`; } break;
                case 'change_sprite': if (param) { const handleError = (el, s) => { const a = Array.from(el.classList).filter(c => c.startsWith('anim-')).join(' '); const p = createFloatingTextPlaceholder(s, 'character-sprite ' + a); wrapper.innerHTML = ''; wrapper.appendChild(p); }; if (img.tagName === 'DIV') { const n = document.createElement('img'); n.className = 'character-sprite'; n.src = "images/sprites/" + param; img = n; n.onerror = function() { handleError(this, param); }; wrapper.innerHTML = ''; wrapper.appendChild(n); } else { img.src = "images/sprites/" + param; img.onerror = function() { handleError(this, param); }; } } break;
            }
        });

        const questionContainer = document.getElementById('dialogue-questions');
        questionContainer.innerHTML = '<br><br>' + text + '<br>';
        if (type === 'question' && questionData) {
            questionContainer.classList.add('active'); this.choiceCursor = 0;
            let idx = 0; 
            for (let label in questionData) {
                let retVal = questionData[label];
                let btn = document.createElement('div');
                btn.className = 'choice-btn';
                btn.innerText = label;
                let currentIdx = idx; 
                btn.onmouseenter = () => { this.choiceCursor = currentIdx; this.updateChoiceVisuals(); };
                btn.onclick = (e) => { e.stopPropagation(); questionContainer.classList.remove('active'); if (GLOBAL_STATE.activeVariable in GLOBAL_STATE.variables){ GLOBAL_STATE.variables[GLOBAL_STATE.activeVariable] = retVal; GLOBAL_STATE.activeVariable = "" } this.advanceDialogue(); };
                questionContainer.appendChild(btn);
                idx++;
            }
            this.updateChoiceVisuals();
        } else { questionContainer.classList.remove('active'); }
    },
    updateChoiceVisuals: function() {
        const btns = document.querySelectorAll('.choice-btn');
        btns.forEach((btn, index) => {
            if (index === this.choiceCursor) { btn.classList.add('selected'); btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } else { btn.classList.remove('selected'); }
        });
    },
    updateCharacterCursor: function(idx) {
        this.player.menuCursor = idx;
        const rows = document.querySelectorAll('.interactive-row');
        rows.forEach((row, i) => {
            if (i === idx) row.classList.add('menu-focus-row');
            else row.classList.remove('menu-focus-row');
        });
    },
    toggleCharacterMenu: function() { if(this.inDialogue) return; this.player.active = !this.player.active; if(this.player.active) this.player.menuCursor = 0; this.render(); },
    startPassiveRegen: function() { setInterval(() => { if (this.inCombat) return; const maxHp = this.player.getMaxHP(); if (this.player.hp <= 0 || this.player.hp >= maxHp) return; this.player.hp += this.player.getCombatSkills().healing; if (this.player.hp > maxHp) this.player.hp = maxHp; this.updatePlayerHUD(); }, 2000); },
    updatePlayerHUD: function() { 
        document.getElementById('player-name').textContent = `${this.player.name}`; 
        const maxHp = this.player.getMaxHP(); 
        document.getElementById('hud-hp-bar').style.width = `${Math.max(0, Math.min(100, (this.player.hp / maxHp) * 100))}%`; 
        
        // Removed global XP bar update
    },
    
    // --- SKILL HUD VISUALIZER ---
    updateSkillHUD: function(skillName) {
        const container = document.getElementById('temp-skill-bar-container');
        if(!skillName || !this.player.skillExp[skillName]) {
             container.style.display = 'none';
             return;
        }
        
        const prog = this.player.getSkillProgress(skillName);
        const pct = (prog.current / prog.max) * 100;
        
        document.getElementById('temp-skill-name').innerText = `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} (Lv.${prog.level})`;
        document.getElementById('temp-skill-fill').style.width = `${pct}%`;
        
        container.style.display = 'block';
    },
    
    showEnemyHUD: function(name, currentHp, maxHp, isBoss = false) { const hud = document.getElementById('enemy-hud'); hud.classList.add('visible'); const nameEl = document.getElementById('enemy-name'); nameEl.textContent = name; if (isBoss) nameEl.classList.add('boss-name'); else nameEl.classList.remove('boss-name'); this.updateEnemyHUD(currentHp, maxHp); },
    updateEnemyHUD: function(currentHp, maxHp) { document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%`; document.getElementById('enemy-stats').textContent = `${Math.ceil(currentHp)}/${maxHp} HP`; },
    hideEnemyHUD: function() { document.getElementById('enemy-hud').classList.remove('visible'); },
    updateDungeonUI: function() { const bar = document.getElementById('hud-dungeon-bar'); const row = document.getElementById('dungeon-progress-row'); if (this.currentActionName && this.currentActionName.startsWith('dungeon') && this.dungeonStages.length > 0) { row.classList.add('visible'); const pct = (this.dungeonIndex / this.dungeonStages.length) * 100; bar.style.width = `${pct}%`; } else { row.classList.remove('visible'); bar.style.width = '0%'; } },
    render: function() {
        if (this.inDialogue) return;
        document.getElementById('location-pill').textContent = this.currentTitle;
        safelySetBackgroundImage('scene-bg-container', 'scene-image', "images/bg/", this.currentImage);
        this.updatePlayerHUD(); 
        this.updateDungeonUI();
        const menuContainer = document.getElementById('menu-list'); menuContainer.innerHTML = '';

        if (this.player.active) { document.getElementById('mini-map-overlay').classList.remove('visible'); menuContainer.innerHTML = this.player.getDisplayHTML(); const activeRow = document.querySelector('.menu-focus-row'); if (activeRow) activeRow.scrollIntoView({ block: 'nearest' }); return; }

        if (!this.currentNode) { document.getElementById('mini-map-overlay').classList.remove('visible'); return; }
        
        const options = Object.keys(this.currentNode);
        if (options.length === 0) { document.getElementById('mini-map-overlay').classList.remove('visible'); menuContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Nothing here...</div>'; return; }

        const visibleIndices = [];
        options.forEach((key, index) => {
            const info = this.parseKey(key);
            if (!info.conditionId || this.checkConditionID(info.conditionId)) { visibleIndices.push(index); }
        });

        this.drawMiniMap(visibleIndices, options);
        if (visibleIndices.length === 0) { menuContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">(No available actions)</div>'; return; }
        if (!visibleIndices.includes(this.cursor)) {
            const nextValid = visibleIndices.find(i => i >= this.cursor);
            this.cursor = (nextValid !== undefined) ? nextValid : visibleIndices[visibleIndices.length - 1];
        }

        options.forEach((key, index) => {
            if (!visibleIndices.includes(index)) return; 
            const info = this.parseKey(key);
            const el = document.createElement('div'); 
            el.className = 'menu-item';
            if (index === this.cursor) el.classList.add('active');
            
            el.onmouseenter = () => { this.cursor = index; Array.from(menuContainer.children).forEach(child => child.classList.remove('active')); el.classList.add('active'); const allNodes = document.querySelectorAll('.sub-node'); allNodes.forEach(n => { if (parseInt(n.dataset.index) === index) n.classList.add('active'); else n.classList.remove('active'); }); };
            
            let content = `<span>${info.name}</span>`;
            if (info.role === 'craft') { 
                const recipe = this.currentNode[key][2]; 
                let canAfford = true; 
                for (let rKey in recipe) { if (rKey.startsWith('input:')) { let item = rKey.split(':')[1]; let cost = recipe[rKey]; if (this.player.getItemCount(item) < cost) canAfford = false; } } 
                if (!canAfford) content += `<span class="insufficient">(insufficient ingredients)</span>`; 
            }
            if (this.activeInterval && this.currentActionName === key) content += `<span class="menu-item-tag">STOP</span>`;
            el.innerHTML = content;
            el.onclick = () => { this.cursor = index; this.executeOption(key); };
            menuContainer.appendChild(el);
        });

        const activeEl = menuContainer.querySelector('.active'); if (activeEl) { activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    },
    
    log: function(msg) { 
        if (this.inCombat || this.currentActionName.startsWith('scripted_')) {
            const feed = document.getElementById('combat-log-feed');
            const entry = document.createElement('div');
            entry.className = 'log-entry new';
            entry.innerText = `${msg}`;
            if (feed.firstChild) { feed.insertBefore(entry, feed.firstChild); } else { feed.appendChild(entry); }
            if (feed.children.length > 30) feed.removeChild(feed.lastChild);
            return;
        }
        const container = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = msg; container.appendChild(toast); setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2500); 
    },
    parseKey: function(k) { if (!k) return { role: "null", id: "error", name: "Error", image: "" }; const parts = k.split(';'); const core = parts[0]; let onEnter = null; let onEnterArg = null; let conditionId = null; for (let i = 1; i < parts.length; i++) { const segment = parts[i].trim(); const segParts = segment.split(':'); const key = segParts[0].trim(); const val = segParts[1] ? segParts[1].trim() : null; if (key === "fn_interaction") { onEnter = key; onEnterArg = val; } else if (key === "fn_condition") { conditionId = val; } } const pa = core.split(':'); return { role: pa[0], id: pa[1], name: pa[2] || pa[1], image: pa[3] || "placeholder.png", onEnter: onEnter, onEnterArg: onEnterArg, conditionId: conditionId }; },
    enterScene: function(keyString, nodeObj) {
        const info = this.parseKey(keyString);
        if (nodeObj !== null) {
            if (this.currentNode) {
                this.pathStack.push({ key: this.currentKey, node: this.currentNode, title: this.currentTitle, image: this.currentImage, cursor: this.cursor });
            }
            let place_name = info.id; this.currentNode = nodeObj; this.currentTitle = place_name; this.currentImage = info.image; this.currentKey = keyString; this.cursor = -1; this.stopAction();
        }
        if (info.onEnter && SceneFunctions[info.onEnter]) { SceneFunctions[info.onEnter](null, info.onEnterArg); }
        this.render();
    },
    returnScene: function() { if (this.pathStack.length === 0) return; const p = this.pathStack.pop(); this.currentNode = p.node; this.currentTitle = p.title; this.currentImage = p.image; this.currentKey = p.key; this.cursor = p.cursor; this.stopAction(); this.render(); },
    stopAction: function() { 
        if (this.activeInterval) { clearInterval(this.activeInterval); this.activeInterval = null; }
        if (this.combatTimer) { clearTimeout(this.combatTimer); this.combatTimer = null; }
        
        this.currentActionName = ""; 
        this.activeBinding = null;
        this.nextInteraction = null;
        this.inCombat = false; 
        this.hideEnemyHUD(); 
        
        // Hide Skill HUD
        document.getElementById('temp-skill-bar-container').style.display = 'none';

        const panel = document.getElementById('combat-panel'); if(panel) panel.classList.remove('active');
        const controls = document.getElementById('combat-controls'); if(controls) controls.classList.remove('active');

        document.getElementById('menu-list').style.display = 'flex'; 
        this.dungeonIndex = 0; 
        for (let key in this.player.inventory) { this.player.inventory[key].amount = Math.floor(this.player.inventory[key].amount); if (this.player.inventory[key].amount <= 0) delete this.player.inventory[key]; } 
        this.render(); 
    },
    waitForPlayer: function(callback) { if (this.combatTimer) clearTimeout(this.combatTimer); const btn = document.getElementById('btn-combat-end'); const ctrl = document.getElementById('combat-controls'); ctrl.classList.add('active'); const proceed = () => { ctrl.classList.remove('active'); callback(); }; btn.onclick = proceed; this.pendingCombatConfirmation = proceed; },
    executeOption: function(specificKey = null) {
        const options = Object.keys(this.currentNode);
        if (options.length === 0) return;
        const selectedKey = specificKey || options[this.cursor];
        const selectedValue = this.currentNode[selectedKey];
        const info = this.parseKey(selectedKey);

        if (this.activeInterval && this.currentActionName === selectedKey) { this.stopAction(); return; }

        const runAction = () => {
            if ((info.role === 'scene' || info.role === 'return') && selectedValue) {
                const overlay = document.getElementById('mini-map-overlay');
                const nodeB = document.querySelector(`.sub-node[data-index="${this.cursor}"]`); 
                const nodeA = document.querySelector('.center-node'); 
                const allNodes = document.querySelectorAll('.map-node');
                
                if (nodeB && nodeA && overlay.classList.contains('visible')) {
                    document.getElementById('map-lines').innerHTML = '';
                    allNodes.forEach(n => { if (n !== nodeA && n !== nodeB) n.classList.add('fade-out'); });
                    const startX = parseFloat(nodeB.style.left); const startY = parseFloat(nodeB.style.top);
                    nodeB.classList.remove('active'); nodeB.classList.add('anim-to-center');
                    if(info.role === 'return') { nodeB.style.borderRadius = '50%'; nodeB.style.background = ''; }
                    const targetX = 100 - startX; const targetY = 140 - startY;
                    nodeA.classList.remove('center-node'); nodeA.classList.add('anim-leave'); 
                    nodeA.style.left = `${targetX}%`; nodeA.style.top = `${targetY}%`;
                    setTimeout(() => { this.performActionSwitch(info, selectedKey, selectedValue); }, 500);
                    return;
                }
            }
            this.performActionSwitch(info, selectedKey, selectedValue);
        };

        if (info.onEnter && info.role !== "scene" && SceneFunctions[info.onEnter]) { SceneFunctions[info.onEnter](runAction, info.onEnterArg); if (this.inDialogue) return; } else { runAction(); }
    },

    performActionSwitch: function(info, selectedKey, selectedValue) {
        switch (info.role) {
            case "scene": this.enterScene(selectedKey, selectedValue); break;
            case "return": this.returnScene(); break;
            // UPDATED: Pass index 3 (XP Data) to startHarvestLoop
            case "harvest": this.stopAction(); this.currentActionName = selectedKey; this.startHarvestLoop(selectedValue[0], selectedValue[1], selectedValue[2], selectedValue[3]); this.render(); break;
            case "fight": this.stopAction(); this.currentActionName = selectedKey; this.startFightLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break;
            case "dungeon": this.stopAction(); this.currentActionName = selectedKey; this.startDungeonLoop(selectedValue); this.render(); break;
            // UPDATED: Pass index 3 (XP Data) to startCraftLoop
            case "craft": this.stopAction(); this.currentActionName = selectedKey; this.startCraftLoop(selectedValue[0], selectedValue[1], selectedValue[2], selectedValue[3]); this.render(); break;
            default: this.log(`Unknown role: ${info.role}`);
        }
    },
    // UPDATED: Now accepts xpReward argument
    startCraftLoop: function(interval, notif, recipe, xpReward) { 
        const canAfford = () => { for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(':')[1]; let cost = recipe[key]; if (this.player.getItemCount(item) < cost) return false; } } return true; };
        const getMissingArgs = () => { let missing = []; for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(':')[1]; let cost = recipe[key]; let have = this.player.getItemCount(item); if (have < cost) missing.push(`${item} (${have}/${cost})`); } } return missing.join(", "); };

        if (!canAfford()) { this.log(`Insufficient: ${getMissingArgs()}`); this.stopAction(); return; }

        this.log(notif); 
        this.activeInterval = setInterval(() => { 
            if (!canAfford()) { this.log(`Stopped. Missing: ${getMissingArgs()}`); this.stopAction(); return; } 
            for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(':')[1]; let cost = recipe[key]; this.player.addItem(item, -cost); } } 
            let outputStr = ""; 
            for (let key in recipe) { if (key.startsWith("output:")) { let item = key.split(':')[1]; let amount = recipe[key]; this.player.addItem(item, amount); outputStr += `${amount} ${item} `; } } 
            this.log(`Crafted: ${outputStr}`); 
            
            // GRANT XP
            if (xpReward) {
                for (let skill in xpReward) {
                    this.player.gainSkillExp(skill, xpReward[skill]);
                    this.updateSkillHUD(skill);
                }
            }

            if (!canAfford()) { this.log("Crafting complete (Materials exhausted)."); this.stopAction(); } else { this.render(); }
        }, interval); 
    },
    // UPDATED: Now accepts xpReward argument
    startHarvestLoop: function(interval, notif, itemDict, xpReward) {
        this.log(notif);
        this.activeInterval = setInterval(() => {
            let items = dictDrawMultiple(itemDict);
            for(const item of items){ if (item) { this.player.addItem(item); this.log(`+1 ${item}`); } }
            
            // GRANT XP
            if (xpReward) {
                for (let skill in xpReward) {
                    this.player.gainSkillExp(skill, xpReward[skill]);
                    this.updateSkillHUD(skill);
                }
            }
            this.updatePlayerHUD();
        }, interval);
    },
    triggerCombatRound: function(enemies, roundInterval) {
        if (!this.inCombat) return;
        let participants = [this.player, ...this.player.followers, ...enemies];
        participants.sort((a, b) => {
            const agiA = (a.getCombatSkills ? a.getCombatSkills().agility : a.skills.agility);
            const agiB = (b.getCombatSkills ? b.getCombatSkills().agility : b.skills.agility);
            if (agiA === agiB) return Math.random() - 0.5;
            return agiB - agiA;
        });
        this.executeCombatTurn(participants, 0, enemies, roundInterval);
    },
    executeCombatTurn: function(participants, index, enemies, roundInterval) {
        if (!this.inCombat) return;
        if (enemies.every(e => e.hp <= 0)) {
            enemies.forEach(e => { let loots = dictDrawMultiple(e.loots); for(const loot of loots) { this.player.addItem(loot); this.log(`Victory! Found: ${loot}`); } });
            const isDungeon = this.currentActionName.startsWith('dungeon') || this.currentActionName === 'scripted_dungeon';
            if (isDungeon) { if (this.dungeonIndex < this.dungeonStages.length - 1) { this.log("Victory! Proceeding..."); this.dungeonIndex++; this.combatTimer = setTimeout(() => { this.executeCurrentStage(); }, 1500); return; } }
            this.log("Battle Complete. (Press Enter)");
            this.waitForPlayer(() => {
                if(isDungeon) { this.dungeonIndex++; this.executeCurrentStage(); } else { if (this.activeBinding) GLOBAL_STATE.variables[this.activeBinding] = true; const chainId = this.nextInteraction; this.stopAction(); if (chainId) setTimeout(() => SceneFunctions.fn_interaction(null, chainId), 100); }
            });
            return;
        }

        if (this.player.hp <= 0) {
            this.log(`Defeated! You fainted.`);
            this.waitForPlayer(() => { if (this.activeBinding) GLOBAL_STATE.variables[this.activeBinding] = false; this.stopAction(); this.player.hp = 1; this.updatePlayerHUD(); });
            return;
        }

        if (index >= participants.length) { this.combatTimer = setTimeout(() => { this.triggerCombatRound(enemies, roundInterval); }, roundInterval); return; }

        const actor = participants[index];
        if (actor.hp <= 0) { this.executeCombatTurn(participants, index + 1, enemies, roundInterval); return; }

        const isPlayerSide = (actor === this.player || this.player.followers.includes(actor));
        let potentialTargets = participants.filter(p => { const pIsPlayerSide = (p === this.player || this.player.followers.includes(p)); return p.hp > 0 && (isPlayerSide ? !pIsPlayerSide : pIsPlayerSide); });

        if (potentialTargets.length > 0) {
            let target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            const actorSkills = actor.getCombatSkills ? actor.getCombatSkills() : actor.skills;
            const targetSkills = target.getCombatSkills ? target.getCombatSkills() : target.skills;

            const dmg = Math.max(0, actorSkills.attack - targetSkills.defense);
            const agility_diff = actorSkills.agility - targetSkills.agility;
            const chance = landing_chance(agility_diff);

            if (Math.random() < chance) {
                target.hp -= dmg;
                
                // --- COMBAT XP LOGIC ---
                // If Player hit enemy
                if (actor === this.player) {
                    this.player.gainSkillExp("attack", 2); // Small steady amount
                    this.player.gainSkillExp("agility", 1); 
                }
                // If Enemy hit Player (Defense XP)
                if (target === this.player) {
                    this.player.gainSkillExp("defense", 2);
                }

                this.log(`${actor.name} hits ${target.name} for ${dmg}!`);
            } else {
                // Dodge XP
                if (target === this.player) {
                     this.player.gainSkillExp("agility", 2);
                }
                this.log(`${actor.name} missed ${target.name}!`);
            }
            
            let totalEnemyHp = enemies.reduce((acc, e) => acc + Math.max(0, e.hp), 0);
            let maxEnemyHp = enemies.reduce((acc, e) => acc + e.maxHp, 0);
            this.updateEnemyHUD(totalEnemyHp, maxEnemyHp);
            this.updatePlayerHUD();
        }

        this.combatTimer = setTimeout(() => { this.executeCombatTurn(participants, index + 1, enemies, roundInterval); }, 800); 
    },
    startFightLoop: function(interval, notif, enemyDict) {
        this.inCombat = true;
        document.getElementById('combat-panel').classList.add('active');
        document.getElementById('combat-log-feed').innerHTML = ''; 
        document.getElementById('menu-list').style.display = 'none';
        let enemyTemplate = dictDraw(enemyDict);
        let enemies = [new Enemy(enemyTemplate.name, enemyTemplate.hp, enemyTemplate.loots, enemyTemplate.skills)];
        this.log(`Encounter: ${enemies[0].name}!`);
        this.showEnemyHUD(enemies[0].name, enemies[0].hp, enemies[0].maxHp);
        this.triggerCombatRound(enemies, interval);
    },
    startDungeonLoop: function(stages) { this.dungeonStages = stages; this.dungeonIndex = 0; this.executeCurrentStage(); },
    executeCurrentStage: function() {
        if (this.dungeonIndex >= this.dungeonStages.length) { 
            this.log("DUNGEON CONQUERED!"); 
            if (this.activeBinding) { GLOBAL_STATE.variables[this.activeBinding] = true; }
            const chainId = this.nextInteraction; this.stopAction(); 
            if (chainId) { setTimeout(() => SceneFunctions.fn_interaction(null, chainId), 100); }
            return; 
        }
        const currentStage = this.dungeonStages[this.dungeonIndex];
        if (typeof currentStage[0] === 'number') { this.startCombatStage(currentStage); } 
        else if (typeof currentStage[0] === 'string') { this.startInteractionStage(currentStage); }
    },
    startInteractionStage: function(stageData) {
        if (this.activeInterval) clearInterval(this.activeInterval);
        document.getElementById('combat-panel').classList.remove('active');
        const rawString = stageData[0]; const parts = rawString.split(":"); const fnName = parts[0]; const param = parts[1]; 
        if (SceneFunctions && SceneFunctions[fnName]) { SceneFunctions[fnName](() => { this.dungeonIndex++; this.executeCurrentStage(); }, param); } 
        else { this.dungeonIndex++; this.executeCurrentStage(); }
    },
    startCombatStage: function(stageData) {
        this.inCombat = true;
        const panel = document.getElementById('combat-panel'); if (panel) panel.classList.add('active');
        document.getElementById('menu-list').style.display = 'none';
        const isDungeon = this.currentActionName.startsWith('dungeon') || this.currentActionName === 'scripted_dungeon';
        if (!isDungeon || this.dungeonIndex === 0) { document.getElementById('combat-log-feed').innerHTML = ''; }
        const enemyDict = stageData[2]; const enemyTemplate = dictDraw(enemyDict); 
        this.currentDungeonEnemies = [new Enemy(enemyTemplate.name, enemyTemplate.hp, enemyTemplate.loots, enemyTemplate.skills)];
        const isBoss = (this.dungeonIndex === this.dungeonStages.length - 1);
        let e = this.currentDungeonEnemies[0]; this.showEnemyHUD(e.name, e.hp, e.maxHp, isBoss); 
        this.log(isBoss ? `BOSS BATTLE: ${e.name}!` : `Stage ${this.dungeonIndex+1}: ${e.name}`); 
        this.updateDungeonUI();
        const duration = stageData[0];
        this.triggerCombatRound(this.currentDungeonEnemies, duration);
    },
    setupInput: function() {
        document.addEventListener('keydown', (e) => {
            if (this.pendingCombatConfirmation && e.key === "Enter") { const fn = this.pendingCombatConfirmation; this.pendingCombatConfirmation = null; fn(); return; }
            if (this.inDialogue) { 
                if (document.getElementById('dialogue-questions').classList.contains('active')) { 
                    const btns = document.querySelectorAll('.choice-btn'); 
                    if (e.key === "ArrowUp") { this.choiceCursor = (this.choiceCursor - 1 + btns.length) % btns.length; this.updateChoiceVisuals(); } 
                    else if (e.key === "ArrowDown") { this.choiceCursor = (this.choiceCursor + 1) % btns.length; this.updateChoiceVisuals(); } 
                    else if (e.key === "Enter") { if(btns[this.choiceCursor]) btns[this.choiceCursor].click(); } 
                    return; 
                }
                if (e.key === "Enter") { this.advanceDialogue(); return; }
            }
            if (this.inCombat) return;
            if (this.inMainMenu) {
                if (e.key === "ArrowUp") { this.cursor = (this.cursor === 1) ? 0 : 1; const menuItems = document.querySelectorAll('.menu-item'); if(menuItems.length > 1) { menuItems[0].className = 'menu-item' + (this.cursor === 0 ? ' active' : ''); menuItems[1].className = 'menu-item' + (this.cursor === 1 ? ' active' : ''); } }
                else if (e.key === "ArrowDown") { this.cursor = (this.cursor === 0) ? 1 : 0; const menuItems = document.querySelectorAll('.menu-item'); if(menuItems.length > 1) { menuItems[0].className = 'menu-item' + (this.cursor === 0 ? ' active' : ''); menuItems[1].className = 'menu-item' + (this.cursor === 1 ? ' active' : ''); } }
                else if (e.key === "Enter") { if (this.cursor === 0) this.startNewGame(); else this.toggleSaveModal(true); }
                return;
            }
            if (e.key.toLowerCase() === "s" && !this.player.active) { this.toggleSaveModal(true); return; }
            if (e.key === "Escape" && document.getElementById('save-modal').classList.contains('active')) { this.toggleSaveModal(false); return; }

            if (this.player.active) { 
                if (e.key === "ArrowUp") this.player.moveCursor(-1); 
                else if (e.key === "ArrowDown") this.player.moveCursor(1); 
                else if (e.key === "Enter") this.player.selectOption(); 
                else if (e.key === "Escape" || e.key.toLowerCase() === "c") this.toggleCharacterMenu(); 
                return; 
            }
            if (this.currentNode && Object.keys(this.currentNode).length > 0) { 
                const options = Object.keys(this.currentNode);
                const visibleIndices = [];
                options.forEach((key, index) => { const info = this.parseKey(key); if (!info.conditionId || this.checkConditionID(info.conditionId)) { visibleIndices.push(index); } });
                if (visibleIndices.length > 0) {
                    let currentVisualIndex = visibleIndices.indexOf(this.cursor);
                    if (currentVisualIndex === -1) currentVisualIndex = 0;
                    if (e.key === "ArrowUp") { let newVisual = (currentVisualIndex - 1 + visibleIndices.length) % visibleIndices.length; this.cursor = visibleIndices[newVisual]; this.render(); } 
                    else if (e.key === "ArrowDown") { let newVisual = (currentVisualIndex + 1) % visibleIndices.length; this.cursor = visibleIndices[newVisual]; this.render(); } 
                    else if (e.key === "Enter") { this.executeOption(); } 
                }
            }
            if (e.key.toLowerCase() === "c") this.toggleCharacterMenu(); 
            if (e.key === "Escape") this.stopAction();
        });
    },
    checkCriteria: function(cond) {
        if (cond.type === "item") {
            const count = this.player.getItemCount(cond.id);
            if (cond.op === ">=") return count >= cond.val;
            if (cond.op === "<=") return count <= cond.val; 
            if (cond.op === ">") return count > cond.val;   
            if (cond.op === "<") return count < cond.val;   
            if (cond.op === "==") return count == cond.val;
        } 
        else if (cond.type === "follower") { const isPresent = this.player.followers.some(f => f.name === cond.id); return isPresent === cond.in_party; }
        else {
            let val;
            if (cond.var === "rand:uniform") val = Math.random(); 
            else val = GLOBAL_STATE.variables[cond.var];
            if (cond.op === "==") return val == cond.val;
            if (cond.op === "!=") return val != cond.val;
            if (cond.op === ">")  return val > cond.val;
            if (cond.op === "<")  return val < cond.val;
            if (cond.op === ">=") return val >= cond.val;
            if (cond.op === "<=") return val <= cond.val;
            if (cond.op === "in") return cond.val.includes(val);
        }
        return false;
    },
    checkConditionID: function(id) {
        if (!id) return true; 
        const rules = INTERACTION_REGISTRY[id];
        if (!rules) return true; 
        const match = rules.find(r => { if (r.condition === "default") return true; const conditions = Array.isArray(r.condition) ? r.condition : [r.condition]; return conditions.every(c => this.checkCriteria(c)); });
        return !!match; 
    },
};
Game.init();