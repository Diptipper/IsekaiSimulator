// --- UTILITIES ---
function dictDraw(dct) { let norm=0; let entries=[]; for(let key in dct){ let w=dct[key]; let i=key; if(Array.isArray(w)){ i=w[1]; w=w[0]; } if(w<0) return null; norm+=w; entries.push({item:i, weight:w}); } let r=Math.random()*norm; let acc=0; for(let e of entries){ acc+=e.weight; if(r<acc) return e.item; } return null; }
function createFloatingTextPlaceholder(filename, extraClasses = "") { const div = document.createElement('div'); div.className = `missing-asset-placeholder ${extraClasses}`; div.innerText = `FILE NOT FOUND:\n${filename}`; return div; }
function safelySetBackgroundImage(containerId, imgId, basePath, filename) { const container = document.getElementById(containerId); const img = document.getElementById(imgId); img.style.display = 'block'; const existingPlaceholder = container.querySelector('.missing-asset-placeholder'); if (existingPlaceholder) container.removeChild(existingPlaceholder); img.onerror = function() { this.style.display = 'none'; container.appendChild(createFloatingTextPlaceholder(filename)); }; img.src = basePath + filename; }
const findPathToNode = (tree, targetId, currentPath = []) => {
    // Returns an Array: [{key, node}, {key, node}...] representing the path from Root to Target
    for (let key in tree) {
        // Parse the Key
        const parts = key.split(';')[0].split(':');
        const id = parts[1];

        // 1. Found the target? Return the full path including this node.
        if (id === targetId) {
            return [...currentPath, { key: key, node: tree[key] }];
        }

        // 2. Is this a folder? Recurse.
        const childNode = tree[key];
        if (childNode && typeof childNode === 'object' && !Array.isArray(childNode)) {
            const result = findPathToNode(childNode, targetId, [...currentPath, { key: key, node: tree[key] }]);
            if (result) return result;
        }
    }
    return null;
};

// --- CHARACTER MENU LOGIC ---
class CharacterMenu {
    constructor() { this.name="Player"; this.exp=0; this.inventory={}; this.equipment={weapon:null, body:null, leggings:null}; this.active=false; this.hp=10; this.skills=new Skills(4,2,1,1); this.menuCursor=0; this.interactables=[]; }
    createItem(n, a) { let d=ITEM_DEFINITIONS[n]||{}; return new Item(n, d.is_weapon, d.is_armor_body, d.is_armor_leggings, a, d.bonus_hp||0, d.bonus_skills); }
    addItem(n, a=1) { if(typeof n==='object'&&n.name)n=n.name; if(!this.inventory[n])this.inventory[n]=this.createItem(n,0); this.inventory[n].amount+=a; }
    getItemCount(n) { return this.inventory[n]?this.inventory[n].amount:0; }
    equipItem(n) { if(!this.inventory[n]||this.inventory[n].amount<=0)return; let i=this.inventory[n], s=i.is_weapon?"weapon":i.is_armor_body?"body":i.is_armor_leggings?"leggings":null; if(s){ this.unequipItem(s); i.amount--; if(i.amount===0)delete this.inventory[n]; this.equipment[s]=this.createItem(n,1); Game.render(); }}
    unequipItem(s) { if(this.equipment[s]){ this.addItem(this.equipment[s].name,1); this.equipment[s]=null; Game.render(); }}
    getRawCombatSkills() {
        let t=new Skills(this.skills.attack,this.skills.defense,this.skills.healing,this.skills.luck);
        let level = this.getLevel()
        t=t.add(new Skills(level,level,level,level));
        return t;
    }
    getCombatSkills() {
        let t=this.getRawCombatSkills()
        for(let s in this.equipment)
            if(this.equipment[s])
                t=t.add(this.equipment[s].bonus_skills);
        return t;
    }
    getLevel() { return Math.floor(Math.sqrt(0.1*this.exp)); } getMaxExp() { return 10*Math.pow(this.getLevel()+1,2); }
    getMaxHP() { let b=10+(this.getLevel()*5), bo=0; for(let s in this.equipment)if(this.equipment[s])bo+=this.equipment[s].bonus_hp; return b+bo; }
    moveCursor(o) { if(this.interactables.length===0)return; this.menuCursor+=o; if(this.menuCursor<0)this.menuCursor=this.interactables.length-1; if(this.menuCursor>=this.interactables.length)this.menuCursor=0; Game.render(); }
    selectOption() { if(this.interactables.length===0)return; const t=this.interactables[this.menuCursor]; if(t.type==='slot')this.unequipItem(t.id); else if(t.type==='item')this.equipItem(t.id); else if(t.type==='close') Game.toggleCharacterMenu(); }
    getDisplayHTML() {
        this.interactables=[]; let c=0, invH="", keys=Object.keys(this.inventory), equipH="";
        ['weapon','body','leggings'].forEach(s=>{ let i=this.equipment[s]; this.interactables.push({type:'slot',id:s}); let sel=(c===this.menuCursor); c++; let sc="equip-slot"+(sel?" menu-focus-row":""); equipH+=`<div class="${sc}"><span>${i?`${i.name} <span class="inv-btn" onclick="Game.player.unequipItem('${s}')">Unequip</span>`:`<span style="color:#666">Empty ${s}</span>`}</span></div>`; });
        if(keys.length>0){ keys.forEach(k=>{ let i=this.inventory[k], dc=Number.isInteger(i.amount)?i.amount:i.amount.toFixed(1), ce=(i.is_weapon||i.is_armor_body||i.is_armor_leggings); this.interactables.push({type:ce?'item':'none',id:k}); let sel=(c===this.menuCursor); c++; let rs="display:flex; justify-content:space-between; margin-bottom:4px; padding:2px 4px; border-radius:4px; border:1px solid transparent;"+(sel?" border-color: var(--accent); background: rgba(255,255,255,0.1);":""); invH+=`<div class="${sel?"menu-focus-row":""}" style="${rs}"><span>- ${i.name} x${dc}</span>${ce?`<span class="inv-btn" onclick="Game.player.equipItem('${k}')">Equip</span>`:""}</div>`; }); } else { invH="<div style='color:#666; font-style:italic'>(Bag is empty)</div>"; }
        let cs=this.getCombatSkills(), fs=(b,t)=>{let bo=t-b;return bo>0?`${b}<span style="color:#4f4">+${bo}</span>`:`${b}`;};
        this.interactables.push({type:'close', id:'close'});
        let closeSel = (c === this.menuCursor); let closeClass = "menu-item" + (closeSel ? " menu-focus-row" : "");
        let closeBtn = `<div class="${closeClass}" style="justify-content:center; margin-top:15px; background:#444; color:#fff; font-weight:bold; text-align:center;" onclick="Game.toggleCharacterMenu()">CLOSE BAG</div>`;
        let raw_skills = this.getRawCombatSkills();
        return `<div style="font-family:'Courier New'; line-height:1.4; font-size:13px;"><div style="border-bottom:1px solid #555; margin-bottom:10px; padding-bottom:5px; text-align:center;"><strong>CHARACTER MENU</strong></div><div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold;">ATTRIBUTES</div>
            <div>ATK: ${fs(raw_skills.attack,cs.attack)} | DEF: ${fs(raw_skills.defense,cs.defense)}</div>
            <div>HEAL: ${fs(raw_skills.healing,cs.healing)} | LCK: ${fs(raw_skills.luck,cs.luck)}</div></div>
            <div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">EQUIPMENT (Enter to Unequip)</div>${equipH}</div><div><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">INVENTORY (Enter to Equip)</div><div id="inv-scroll-container" style="max-height:150px; overflow-y:auto; padding-right:5px;">${invH}</div></div>${closeBtn}</div>`;
    }
}

// --- SCENE FUNCTIONS (THE ENGINE LOGIC) ---
const SceneFunctions = {

    // 2. GENERIC INTERACTION PROCESSOR
    fn_interaction: function(next, interactionId) {
        const rules = INTERACTION_REGISTRY[interactionId];
        if (!rules) { console.error("Missing interaction:", interactionId); if(next) next(); return; }

        // Find matching rule
        let activeRule = rules.find(r => {
            if (r.condition === "default") return true;
            const conditions = Array.isArray(r.condition) ? r.condition : [r.condition];
            return conditions.every(cond => {
                if (cond.type === "item") {
                    const count = Game.player.getItemCount(cond.id);
                    if (cond.op === ">=") return count >= cond.val;
                    if (cond.op === "==") return count == cond.val;
                } else {
                    const val = GlobalState.variables[cond.var] !== undefined ? GlobalState.variables[cond.var] : GlobalState[cond.var];
                    if (cond.op === "==") return val == cond.val;
                    if (cond.op === "!=") return val != cond.val;
                    if (cond.op === "in") return cond.val.includes(val);
                }
                return false;
            });
        });

        if (!activeRule) { if(next) next(); return; }
        const data = activeRule.data;

        // EXECUTION HELPER
        const executeActions = (actList) => {
            if (!actList) return;
            actList.forEach(act => {
                if (act.type === "set_state") {
                    if (act.key in GlobalState) GlobalState[act.key] = act.val;
                    else GlobalState.variables[act.key] = act.val;
                }
                else if (act.type === "reward") Game.player.addItem(act.item, act.count);
                else if (act.type === "consume") Game.player.addItem(act.item, -act.count);
                else if (act.type === "log") Game.log(act.text);
                else if (act.type === "goto") {
                    // 1. Find the hierarchical path (e.g., [Root, Town, House])
                    const fullPath = findPathToNode(worldMap, act.target);
                    
                    if (fullPath && fullPath.length > 0) {
                        // 2. The Target is the last item in the path
                        const target = fullPath.pop(); 

                        // 3. REBUILD THE STACK (The Magic Step)
                        // We wipe the current history and replace it with the path's parents.
                        Game.pathStack = fullPath.map(step => {
                            // We need to parse the key to get the Title and Image for the stack
                            const info = Game.parseKey(step.key); 
                            return {
                                node: step.node,
                                title: info.id,
                                image: info.image,
                                cursor: 0 // Reset cursor for parents
                            };
                        });

                        // 4. Cheat: Set currentNode to null so enterScene doesn't push the OLD location (Tavern)
                        Game.currentNode = null; 

                        // 5. Enter the target scene
                        Game.enterScene(target.key, target.node);
                        
                    } else {
                        console.error("Could not find path to scene ID:", act.target);
                    }
                }
            });
        };

        if (data.log_only) {
            Game.log(data.log_only);
            if (next) next();
            return;
        }

        if (data.binding) GlobalState.activeVariable = data.binding;

        if (data.dialogue) {
            Game.startDialogue(data.dialogue, () => {
                if (data.on_finish) {
                    const logic = data.on_finish;

                    if (logic.check_var) {
                        const val = GlobalState.variables[logic.check_var];
                        if (logic.if_true && val) {
                            if (logic.if_true.dialogue) {
                                // NEW: Wait for dialogue to close before running actions
                                Game.startDialogue(logic.if_true.dialogue, () => {
                                    executeActions(logic.if_true.actions);
                                });
                            } else {
                                executeActions(logic.if_true.actions);
                            }
                        } else if (logic.if_false && !val) {
                                if (logic.if_false.dialogue) {
                                Game.startDialogue(logic.if_false.dialogue, () => {
                                    executeActions(logic.if_false.actions);
                                });
                            } else {
                                executeActions(logic.if_false.actions);
                            }
                        }
                        if (logic.if_value) {
                            const branch = logic.if_value[val] || logic.if_value["default"];
                            if (branch) executeActions(branch.actions);
                        }
                    }

                    executeActions(logic.actions);
                }
                if (next) next();
            });
        }
    }
};

// --- MAIN GAME ENGINE ---
const Game = {
    player: new CharacterMenu(),
    currentNode: null, currentTitle: "", currentImage: "", pathStack: [], 
    cursor: 0, 
    choiceCursor: 0, // NEW: Tracks selection in dialogue questions
    activeInterval: null, currentActionName: "", 
    inCombat: false, inDialogue: false, dialogueQueue: [], dialogueIndex: 0, dialogueOnComplete: null,
    dungeonStages: [], dungeonIndex: 0, currentDungeonEnemy: null, dungeonTurn: 0,

    init: function() {
        this.player.hp = this.player.getMaxHP();
        this.setupInput();
        this.startPassiveRegen();
        this.updatePlayerHUD();
        document.getElementById('menu-toggle-btn').onclick = () => { this.toggleCharacterMenu(); };
        
        // Trigger root scene
        const rootKey = "scene:open world:Open World:world_map.png; fn_interaction:intro_logic";
        const rootNode = worldMap[rootKey];
        this.enterScene(rootKey, rootNode);
    },

    startDialogue: function(dialogueObj, callback) {
        this.inDialogue = true; 
        this.dialogueQueue = dialogueObj.data; 
        this.dialogueIndex = 0; 
        this.dialogueOnComplete = callback;
        
        document.getElementById('dialogue-visual-layer').classList.add('active');
        document.getElementById('dialogue-box').classList.add('active');
        document.getElementById('menu-list').style.display = 'none';
        document.getElementById('location-pill').classList.remove('visible');
        safelySetBackgroundImage('dialogue-bg-container', 'dialogue-bg', "images/bg/", dialogueObj.background);
        
        // --- Initialize Speakers ---
        const spriteContainer = document.getElementById('sprite-container');
        spriteContainer.innerHTML = ''; 

        if (dialogueObj.speakers) {
            for (let speakerName in dialogueObj.speakers) {
                const data = dialogueObj.speakers[speakerName];
                const filename = data[0];
                const position = data[1];

                let leftPos = "50%", bottomPos = "0%";
                let coords = position.replace(/[()]/g, '').split(','); 
                if (coords.length === 2) { leftPos = coords[0]; bottomPos = coords[1]; }

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
                    wrapper.innerHTML = ''; wrapper.appendChild(placeholder); 
                };

                wrapper.appendChild(img);
                spriteContainer.appendChild(wrapper);
            }
        }
        setTimeout(() => {
            this.renderDialogueFrame();
        }, 50);
    },

    advanceDialogue: function() {
        if (!this.inDialogue) return;
        const currentStep = this.dialogueQueue[this.dialogueIndex]; 
        if (currentStep && currentStep[0] === 'question' && document.getElementById('dialogue-questions').classList.contains('active')) return;

        this.dialogueIndex++; 
        if (this.dialogueIndex >= this.dialogueQueue.length) { 
            this.endDialogue(); 
        } else { 
            this.renderDialogueFrame(); 
        }
    },

    endDialogue: function(returnValue) {
        this.inDialogue = false; 
        document.getElementById('dialogue-visual-layer').classList.remove('active');
        document.getElementById('dialogue-box').classList.remove('active'); 
        document.getElementById('menu-list').style.display = 'flex';
        document.getElementById('sprite-container').innerHTML = ''; 
        document.getElementById('location-pill').classList.add('visible');
        if (this.dialogueOnComplete) this.dialogueOnComplete(returnValue); 
        this.render(); 
    },

    renderDialogueFrame: function() {
        const step = this.dialogueQueue[this.dialogueIndex]; 
        if (!step) return;

        const type = step[0];
        const speaker = step[1];
        let text = step[2];
        const effects = step[3] || []; 
        const questionData = step[4];

        text = text.replace(/\{([a-zA-Z0-9\s]+)\}/g, (match, variableName) => {
            if (GlobalState.variables && GlobalState.variables[variableName] !== undefined) {
                return GlobalState.variables[variableName];
            }
            return match;
        });

        document.getElementById('speaker-name').innerText = speaker; 
        document.getElementById('dialogue-text').innerText = text;

        // --- Process Effects ---
        effects.forEach(effectStr => {
            const parts = effectStr.split(':');
            const targetName = parts[0];
            const action = parts[1];
            const param = parts[2];

            // 1. HANDLE SCENE/SCREEN EFFECTS
            if (targetName === "Scene" || targetName === "Screen") {
                if (action === "shake") {
                    const container = document.body; // Shake the whole body
                    container.classList.remove('anim-shake-screen');
                    void container.offsetWidth; // Trigger reflow
                    container.classList.add('anim-shake-screen');
                }
                return; // Stop processing, as this isn't a sprite
            }

            // 2. HANDLE SPRITE EFFECTS
            const wrapper = document.getElementById('sprite-' + targetName);
            if (!wrapper) return;

            let img = wrapper.querySelector('.character-sprite') || wrapper.querySelector('.missing-asset-placeholder');
            
            // Clean up old one-shot animations
            if(img) {
                img.classList.remove('anim-fade-in', 'anim-fade-out', 'anim-shake');
                void img.offsetWidth; 
            }

            // Helper to get current scale (stored in dataset) or default to 1
            const getScale = () => wrapper.dataset.scale || "1";

            switch (action) {
                case 'fade in': if(img) img.classList.add('anim-fade-in'); wrapper.style.opacity = '1'; break;
                case 'fade out': if(img) img.classList.add('anim-fade-out'); break;
                case 'shake': wrapper.style.opacity = '1'; if(img) img.classList.add('anim-shake'); break;
                case 'show': wrapper.style.opacity = '1'; break;
                case 'hide': wrapper.style.opacity = '0'; break;
                case 'move':
                    if (param) {
                        let coords = param.replace(/[()]/g, '').split(',');
                        if (coords.length === 2) {
                            wrapper.style.left = coords[0]; wrapper.style.bottom = coords[1];
                            // Apply Translation AND Scale
                            wrapper.style.transform = `translateX(-${coords[0]}) scale(${getScale()})`;
                        }
                    }
                    break;
                case 'scale':
                    if (param) {
                        wrapper.dataset.scale = param; // Store state
                        // Apply Scale AND preserve current Translation (left)
                        wrapper.style.transform = `translateX(-${wrapper.style.left}) scale(${param})`;
                    }
                    break;

                case 'change_sprite':
                    if (param) {
                        const handleError = (imgElement, srcParam) => {
                            const currentAnims = Array.from(imgElement.classList).filter(c => c.startsWith('anim-')).join(' ');
                            const placeholder = createFloatingTextPlaceholder(srcParam, 'character-sprite ' + currentAnims); 
                            wrapper.innerHTML = ''; wrapper.appendChild(placeholder); 
                        };
                        if (img.tagName === 'DIV') {
                            const newImg = document.createElement('img');
                            newImg.className = 'character-sprite'; newImg.src = "images/sprites/" + param; img = newImg; 
                            newImg.onerror = function() { handleError(this, param); };
                            wrapper.innerHTML = ''; wrapper.appendChild(newImg);
                        } else {
                            img.src = "images/sprites/" + param;
                            img.onerror = function() { handleError(this, param); };
                        }
                    }
                    break;
            }
        });

        const questionContainer = document.getElementById('dialogue-questions'); 
        questionContainer.innerHTML = text + '<br>'; 
        
        if (type === 'question' && questionData) {
            questionContainer.classList.add('active'); 
            this.choiceCursor = 0; // Reset cursor for new question
            
            for (let label in questionData) {
                let retVal = questionData[label];
                let btn = document.createElement('div');
                btn.className = 'choice-btn';
                btn.innerText = label;
                
                // UPDATE THIS BLOCK
                btn.onclick = (e) => {
                    e.stopPropagation();
                    questionContainer.classList.remove('active');
                    
                    // 1. Save the choice to GlobalState
                    if (GlobalState.activeVariable in GlobalState.variables){
                        GlobalState.variables[GlobalState.activeVariable] = retVal;
                        GlobalState.activeVariable = ""
                    }

                    // 2. Advance to the next line instead of ending
                    this.advanceDialogue(); 
                };
                questionContainer.appendChild(btn);
            }

            this.updateChoiceVisuals(); // Highlight the first option immediately
        } else {
            questionContainer.classList.remove('active');
        }
    },
    
    // NEW: Updates the visual class for the selected choice
    updateChoiceVisuals: function() {
        const btns = document.querySelectorAll('.choice-btn');
        btns.forEach((btn, index) => {
            if (index === this.choiceCursor) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    },

    toggleCharacterMenu: function() { if(this.inDialogue) return; this.player.active = !this.player.active; if(this.player.active) this.player.menuCursor = 0; this.render(); },
    startPassiveRegen: function() { setInterval(() => { if (this.inCombat) return; const maxHp = this.player.getMaxHP(); if (this.player.hp <= 0 || this.player.hp >= maxHp) return; this.player.hp += this.player.skills.healing; if (this.player.hp > maxHp) this.player.hp = maxHp; this.updatePlayerHUD(); }, 2000); },
    updatePlayerHUD: function() { const lvl = this.player.getLevel(); document.getElementById('player-name').textContent = `${this.player.name} Lv.${lvl}`; const maxHp = this.player.getMaxHP(); document.getElementById('hud-hp-bar').style.width = `${Math.max(0, Math.min(100, (this.player.hp / maxHp) * 100))}%`; const maxExp = this.player.getMaxExp(); document.getElementById('hud-exp-bar').style.width = `${Math.max(0, Math.min(100, (this.player.exp / maxExp) * 100))}%`; },
    
    showEnemyHUD: function(name, currentHp, maxHp, isBoss = false) { 
        const hud = document.getElementById('enemy-hud'); hud.classList.add('visible'); 
        const nameEl = document.getElementById('enemy-name'); nameEl.textContent = name; 
        if (isBoss) nameEl.classList.add('boss-name'); else nameEl.classList.remove('boss-name');
        this.updateEnemyHUD(currentHp, maxHp); 
    },
    updateEnemyHUD: function(currentHp, maxHp) { document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%`; document.getElementById('enemy-stats').textContent = `${Math.ceil(currentHp)}/${maxHp} HP`; },
    hideEnemyHUD: function() { document.getElementById('enemy-hud').classList.remove('visible'); },
    
    updateDungeonUI: function() {
        const bar = document.getElementById('hud-dungeon-bar');
        const row = document.getElementById('dungeon-progress-row');
        if (this.currentActionName && this.currentActionName.startsWith('dungeon') && this.dungeonStages.length > 0) {
            row.classList.add('visible');
            const pct = (this.dungeonIndex / this.dungeonStages.length) * 100;
            bar.style.width = `${pct}%`;
        } else {
            row.classList.remove('visible');
            bar.style.width = '0%';
        }
    },

    render: function() {
        if(this.inDialogue) return;
        document.getElementById('location-pill').textContent = this.currentTitle;
        safelySetBackgroundImage('scene-bg-container', 'scene-image', "images/bg/", this.currentImage);

        this.updatePlayerHUD();
        this.updateDungeonUI(); 
        const menuContainer = document.getElementById('menu-list'); menuContainer.innerHTML = '';
        if (this.player.active) { menuContainer.innerHTML = this.player.getDisplayHTML(); const activeRow = document.querySelector('.menu-focus-row'); if (activeRow) activeRow.scrollIntoView({ block: 'nearest' }); return; }
        
        if (!this.currentNode) return;

        const options = Object.keys(this.currentNode);
        if(options.length === 0) { menuContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Nothing here...</div>'; return; }
        if (this.cursor >= options.length) this.cursor = 0;
        options.forEach((key, index) => {
            const info = this.parseKey(key);
            const el = document.createElement('div'); el.className = 'menu-item';
            if (index === this.cursor) el.classList.add('active');
            el.onmouseenter = () => { this.cursor = index; Array.from(menuContainer.children).forEach(child => child.classList.remove('active')); el.classList.add('active'); };
            let content = `<span>${info.name}</span>`;
            if (info.role === 'craft') {
                const recipe = this.currentNode[key][2]; let canAfford = true;
                for (let rKey in recipe) { if (rKey.startsWith('input:')) { let item = rKey.split(':')[1]; let cost = recipe[rKey]; if (this.player.getItemCount(item) < cost) canAfford = false; } }
                if (!canAfford) content += `<span class="insufficient">(insufficient ingredients)</span>`;
            }
            if (this.activeInterval && this.currentActionName === key) content += `<span class="menu-item-tag">STOP</span>`;
            el.innerHTML = content;
            el.onclick = () => { this.cursor = index; this.executeOption(key); this.render(); };
            menuContainer.appendChild(el);
        });
        const activeEl = menuContainer.children[this.cursor]; if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    log: function(msg) { const container = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = msg; container.appendChild(toast); setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2500); },

    parseKey: function(keyString) { 
        const splitFunc = keyString.split(';');
        const propStr = splitFunc[0];
        
        // NEW: Handle Function Arguments (split by :)
        let funcName = null;
        let funcArg = null;
        
        if (splitFunc[1]) {
            const rawFunc = splitFunc[1].trim();
            const fParts = rawFunc.split(':'); // Split "fn_name:arg"
            funcName = fParts[0];
            funcArg = fParts[1] || null;
        }

        const parts = propStr.split(':'); 
        return { 
            role: parts[0], 
            id: parts[1], 
            name: parts[2] || parts[1], 
            image: parts[3] || "placeholder.png", 
            onEnter: funcName,      // e.g., "fn_interaction"
            onEnterArg: funcArg     // e.g., "mayor_logic"
        }; 
    },

    enterScene: function(keyString, nodeObj) {
        const info = this.parseKey(keyString);
        if (nodeObj !== null) {
            if (this.currentNode) this.pathStack.push({ node: this.currentNode, title: this.currentTitle, image: this.currentImage, cursor: this.cursor });
            let place_name = info.id;
            this.currentNode = nodeObj; this.currentTitle = place_name; this.currentImage = info.image; this.cursor = 0; this.stopAction();
        }
        // CHANGED: Pass info.onEnterArg as the second argument
        if (info.onEnter && SceneFunctions[info.onEnter]) { 
            SceneFunctions[info.onEnter](null, info.onEnterArg); 
        }
        this.render();
    },

    returnScene: function() { if (this.pathStack.length === 0) return; const previous = this.pathStack.pop(); this.currentNode = previous.node; this.currentTitle = previous.title; this.currentImage = previous.image; this.cursor = previous.cursor; this.stopAction(); this.render(); },
    stopAction: function() { 
        if (this.activeInterval) { 
            clearInterval(this.activeInterval); this.activeInterval = null; this.currentActionName = ""; this.inCombat = false; this.hideEnemyHUD(); 
            this.dungeonIndex = 0; 
            for (let key in this.player.inventory) { this.player.inventory[key].amount = Math.floor(this.player.inventory[key].amount); if (this.player.inventory[key].amount <= 0) delete this.player.inventory[key]; } 
            this.render(); 
        } 
    },

    executeOption: function(specificKey = null) {
        const options = Object.keys(this.currentNode); if (options.length === 0) return;
        const selectedKey = specificKey || options[this.cursor]; const selectedValue = this.currentNode[selectedKey]; const info = this.parseKey(selectedKey);
        
        if (this.activeInterval && this.currentActionName === selectedKey) { this.stopAction(); return; }
        
        const runAction = () => {
            switch (info.role) {
                case "scene": this.enterScene(selectedKey, selectedValue); break;
                case "return": this.returnScene(); break;
                case "harvest": this.stopAction(); this.currentActionName = selectedKey; this.startHarvestLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break;
                case "fight": this.stopAction(); this.currentActionName = selectedKey; this.startFightLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break;
                case "dungeon": this.stopAction(); this.currentActionName = selectedKey; this.startDungeonLoop(selectedValue); this.render(); break;
                case "craft": this.stopAction(); this.currentActionName = selectedKey; this.startCraftLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break;
                default: this.log(`Unknown role: ${info.role}`);
            }
        };

        if (info.onEnter && info.role !== "scene" && SceneFunctions[info.onEnter]) {
            // CHANGED: Pass runAction as 'next', and info.onEnterArg as the ID
            SceneFunctions[info.onEnter](runAction, info.onEnterArg);
            if (this.inDialogue) return; 
        } else {
            runAction();
        }
    },

    startCraftLoop: function(interval, notif, recipe) { this.log(notif); this.activeInterval = setInterval(() => { let canAfford = true; for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(":")[1]; let cost = recipe[key]; if (this.player.getItemCount(item) < cost) canAfford = false; } } if (!canAfford) { this.log("Stopped: Insufficient ingredients."); this.stopAction(); return; } for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(":")[1]; let cost = recipe[key]; this.player.inventory[item].amount -= cost; } } let outputStr = ""; for (let key in recipe) { if (key.startsWith("output:")) { let item = key.split(":")[1]; let amount = recipe[key]; this.player.addItem(item, amount); outputStr += `${amount} ${item} `; } } this.log(`Crafted: ${outputStr}`); this.render(); }, interval); },
    startHarvestLoop: function(interval, notif, itemDict) { this.log(notif); this.activeInterval = setInterval(() => { const item = dictDraw(itemDict); if (item) { this.player.addItem(item); this.log(`+1 ${item}`); this.updatePlayerHUD(); } }, interval); },
    startFightLoop: function(interval, notif, enemyDict) {
        this.inCombat = true; let enemyTemplate = dictDraw(enemyDict); let enemy = new Enemy(enemyTemplate.name, enemyTemplate.hp, enemyTemplate.loots, enemyTemplate.skills); let turn = 0; let enemy_hp = enemy.hp; let currentSkills = this.player.getCombatSkills();
        this.showEnemyHUD(enemy.name, enemy_hp, enemy.maxHp); this.log(`Encounter: ${enemy.name}!`);
        this.activeInterval = setInterval(() => {
            this.updateEnemyHUD(enemy_hp, enemy.maxHp);
            if (enemy_hp <= 0) { let loot = dictDraw(enemy.loots); this.player.addItem(loot); this.log(`Victory! Found: ${loot}`); this.stopAction(); return; }
            if (this.player.hp <= 0) { this.log(`Defeated! Retreated.`); this.stopAction(); this.player.hp = 1; this.updatePlayerHUD(); return; }
            if (turn === 1) {
                const dmg = Math.max(0, enemy.skills.attack - currentSkills.defense);
                if (Math.random() < 1-Math.exp(-enemy.skills.luck)) { this.player.hp -= dmg; this.log(`${enemy.name} hits for ${dmg} dmg!`); } else { this.log(`${enemy.name} missed!`); } turn = 0;
            }
            else { const dmg = Math.max(0, currentSkills.attack - enemy.skills.defense); if (Math.random() < 1-Math.exp(-currentSkills.luck)) { enemy_hp -= dmg; this.player.exp += 1; this.log(`Hit ${enemy.name} for ${dmg} dmg!`); } else { this.log(`You missed!`); } turn = 1; } this.updatePlayerHUD();
        }, interval);
    },
    startDungeonLoop: function(stages) {
        this.dungeonStages = stages; this.dungeonIndex = 0; this.inCombat = true;
        this.loadDungeonEnemy(); this.updateDungeonUI();
        this.activeInterval = setInterval(() => { this.processDungeonTurn(); }, this.dungeonStages[this.dungeonIndex][0]);
    },
    loadDungeonEnemy: function() {
        if (this.dungeonIndex >= this.dungeonStages.length) { this.log("Dungeon Cleared!"); this.stopAction(); return; }
        const stage = this.dungeonStages[this.dungeonIndex]; const enemyDict = stage[2]; const enemyTemplate = dictDraw(enemyDict);
        this.currentDungeonEnemy = new Enemy(enemyTemplate.name, enemyTemplate.hp, enemyTemplate.loots, enemyTemplate.skills);
        this.dungeonTurn = 0; const isBoss = (this.dungeonIndex === this.dungeonStages.length - 1);
        this.showEnemyHUD(this.currentDungeonEnemy.name, this.currentDungeonEnemy.hp, this.currentDungeonEnemy.maxHp, isBoss);
        this.log(isBoss ? `BOSS BATTLE: ${this.currentDungeonEnemy.name}!` : `Stage ${this.dungeonIndex+1}: ${this.currentDungeonEnemy.name}`);
        this.updateDungeonUI();
    },
    processDungeonTurn: function() {
        if (!this.currentDungeonEnemy) return;
        this.updateEnemyHUD(this.currentDungeonEnemy.hp, this.currentDungeonEnemy.maxHp); let currentSkills = this.player.getCombatSkills();
        if (this.currentDungeonEnemy.hp <= 0) {
            let loot = dictDraw(this.currentDungeonEnemy.loots); this.player.addItem(loot); this.log(`Defeated! Found: ${loot}`);
            this.dungeonIndex++;
            if (this.dungeonIndex >= this.dungeonStages.length) { this.updateDungeonUI(); this.log("DUNGEON CONQUERED!"); this.stopAction(); } else { this.loadDungeonEnemy(); }
            return;
        }
        if (this.player.hp <= 0) { this.log(`Dungeon Failed! Escaped.`); this.stopAction(); this.player.hp = 1; this.updatePlayerHUD(); return; }
        if (this.dungeonTurn === 1) { 
            const dmg = Math.max(0, this.currentDungeonEnemy.skills.attack - currentSkills.defense);
            if (Math.random() < 1 - Math.exp(-this.currentDungeonEnemy.skills.luck)) {
                this.player.hp -= dmg;
                this.log(`${this.currentDungeonEnemy.name} hits for ${dmg} dmg!`);
            }
            else { this.log(`${this.currentDungeonEnemy.name} missed!`); }
            this.dungeonTurn = 0;
        } else { 
            const dmg = Math.max(0, currentSkills.attack - this.currentDungeonEnemy.skills.defense);
            if (Math.random() < 1 - Math.exp(-currentSkills.luck)) {
                this.currentDungeonEnemy.hp -= dmg;
                this.player.exp += 1;
                this.log(`Hit ${this.currentDungeonEnemy.name} for ${dmg} dmg!`); 
            }
            else { this.log(`You missed!`); }
            this.dungeonTurn = 1;
        }
        this.updatePlayerHUD();
    },

    // --- REVISED INPUT HANDLING ---
    setupInput: function() {
        document.addEventListener('keydown', (e) => {
            // 1. Dialogue Choices (Highest Priority if active)
            if (this.inDialogue && document.getElementById('dialogue-questions').classList.contains('active')) {
                 const btns = document.querySelectorAll('.choice-btn');
                 if (e.key === "ArrowUp") {
                     this.choiceCursor = (this.choiceCursor - 1 + btns.length) % btns.length;
                     this.updateChoiceVisuals();
                 } else if (e.key === "ArrowDown") {
                     this.choiceCursor = (this.choiceCursor + 1) % btns.length;
                     this.updateChoiceVisuals();
                 } else if (e.key === "Enter") {
                     if(btns[this.choiceCursor]) btns[this.choiceCursor].click();
                 }
                 return; // Stop other inputs
            }

            // 2. Standard Dialogue Advance
            if (this.inDialogue) {
                if (e.key === "Enter") this.advanceDialogue();
                return;
            }

            // 3. Character Menu Navigation
            if (this.player.active) {
                if (e.key === "ArrowUp") this.player.moveCursor(-1);
                else if (e.key === "ArrowDown") this.player.moveCursor(1);
                else if (e.key === "Enter") this.player.selectOption();
                else if (e.key === "Escape" || e.key.toLowerCase() === "c") this.toggleCharacterMenu();
                return;
            }

            // 4. World Navigation
            if (this.currentNode && Object.keys(this.currentNode).length > 0) {
                if (e.key === "ArrowUp") {
                    this.cursor = (this.cursor - 1 + Object.keys(this.currentNode).length) % Object.keys(this.currentNode).length;
                    this.render();
                } else if (e.key === "ArrowDown") {
                    this.cursor = (this.cursor + 1) % Object.keys(this.currentNode).length;
                    this.render();
                } else if (e.key === "Enter") {
                    this.executeOption();
                }
            }

            // Global Toggles
            if (e.key.toLowerCase() === "c") this.toggleCharacterMenu();
            if (e.key === "Escape") this.stopAction();
        });
    }
};

Game.init();