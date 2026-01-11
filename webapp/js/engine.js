// --- UTILITIES ---
function dictDraw(dct) { let norm=0; let entries=[]; for(let key in dct){ let w=dct[key]; let i=key; if(Array.isArray(w)){ i=w[1]; w=w[0]; } if(w<0) return null; norm+=w; entries.push({item:i, weight:w}); } let r=Math.random()*norm; let acc=0; for(let e of entries){ acc+=e.weight; if(r<acc) return e.item; } return null; }
function createFloatingTextPlaceholder(filename, extraClasses = "") { const div = document.createElement('div'); div.className = `missing-asset-placeholder ${extraClasses}`; div.innerText = `FILE NOT FOUND:\n${filename}`; return div; }
function safelySetBackgroundImage(containerId, imgId, basePath, filename) { const container = document.getElementById(containerId); const img = document.getElementById(imgId); img.style.display = 'block'; const existingPlaceholder = container.querySelector('.missing-asset-placeholder'); if (existingPlaceholder) container.removeChild(existingPlaceholder); img.onerror = function() { this.style.display = 'none'; container.appendChild(createFloatingTextPlaceholder(filename)); }; img.src = basePath + filename; }

// --- PATHFINDING & COMPRESSION ---
const findSceneNode = (tree, targetId, visited = new Set()) => { if (typeof tree !== 'object' || tree === null || visited.has(tree)) return null; visited.add(tree); for (let key in tree) { if (!key.includes(':')) continue; const parts = key.split(';')[0].split(':'); const id = parts[1]; if (id === targetId) return { key: key, node: tree[key] }; const childNode = tree[key]; if (childNode && typeof childNode === 'object' && !Array.isArray(childNode)) { const result = findSceneNode(childNode, targetId, visited); if (result) return result; } } return null; };
const findPathToNode = (tree, targetId, currentPath = []) => { for (let key in tree) { const parts = key.split(';')[0].split(':'); const id = parts[1]; if (id === targetId) return [...currentPath, { key: key, node: tree[key] }]; const childNode = tree[key]; if (childNode && typeof childNode === 'object' && !Array.isArray(childNode)) { const result = findPathToNode(childNode, targetId, [...currentPath, { key: key, node: tree[key] }]); if (result) return result; } } return null; };
const Compressor = { compress: function(u){let i,d={},c,wc,w="",r=[],s=256;for(i=0;i<256;i++)d[String.fromCharCode(i)]=i;for(i=0;i<u.length;i++){c=u.charAt(i);wc=w+c;if(d.hasOwnProperty(wc))w=wc;else{r.push(d[w]);d[wc]=s++;w=String(c);}}if(w!=="")r.push(d[w]);return r;}, decompress: function(c){let i,d=[],w,r,k,e="",s=256;for(i=0;i<256;i++)d[i]=String.fromCharCode(i);w=String.fromCharCode(c[0]);r=w;for(i=1;i<c.length;i++){k=c[i];if(d[k])e=d[k];else if(k===s)e=w+w.charAt(0);else return null;r+=e;d[s++]=w+e.charAt(0);w=e;}return r;}, encode: function(s){const d=this.compress(s),a16=new Uint16Array(d),a8=new Uint8Array(a16.buffer);let b='';for(let i=0;i<a8.byteLength;i++)b+=String.fromCharCode(a8[i]);return btoa(b);}, decode: function(b64){const b=atob(b64),bytes=new Uint8Array(b.length);for(let i=0;i<b.length;i++)bytes[i]=b.charCodeAt(i);const a16=new Uint16Array(bytes.buffer);return this.decompress(Array.from(a16));}};

// --- CHARACTER MENU LOGIC ---
class CharacterMenu {
    constructor() { this.name="Player"; this.exp=0; this.inventory={}; this.equipment={weapon:null, body:null, leggings:null}; this.active=false; this.hp=10; this.skills=new Skills(4,2,1,1); this.menuCursor=0; this.interactables=[]; }
    createItem(n, a) { let d=ITEM_DEFINITIONS[n]||{}; return new Item(n, d.is_weapon, d.is_armor_body, d.is_armor_leggings, a, d.bonus_hp||0, d.bonus_skills); }
    addItem(n, a=1) { if(typeof n==='object'&&n.name)n=n.name; if(!this.inventory[n])this.inventory[n]=this.createItem(n,0); this.inventory[n].amount+=a; }
    getItemCount(n) { return this.inventory[n]?this.inventory[n].amount:0; }
    equipItem(n) { if(!this.inventory[n]||this.inventory[n].amount<=0)return; let i=this.inventory[n], s=i.is_weapon?"weapon":i.is_armor_body?"body":i.is_armor_leggings?"leggings":null; if(s){ this.unequipItem(s); i.amount--; if(i.amount===0)delete this.inventory[n]; this.equipment[s]=this.createItem(n,1); Game.render(); }}
    unequipItem(s) { if(this.equipment[s]){ this.addItem(this.equipment[s].name,1); this.equipment[s]=null; Game.render(); }}
    getRawCombatSkills() { let t=new Skills(this.skills.attack,this.skills.defense,this.skills.healing,this.skills.luck); let l=this.getLevel(); t=t.add(new Skills(l,l,l,l)); return t; }
    getCombatSkills() { let t=this.getRawCombatSkills(); for(let s in this.equipment) if(this.equipment[s]) t=t.add(this.equipment[s].bonus_skills); return t; }
    getLevel() { return Math.floor(Math.sqrt(0.1*this.exp)); } getMaxExp() { return 10*Math.pow(this.getLevel()+1,2); }
    getMaxHP() { let b=10+(this.getLevel()*5), bo=0; for(let s in this.equipment)if(this.equipment[s])bo+=this.equipment[s].bonus_hp; return b+bo; }
    moveCursor(o) { if(this.interactables.length===0)return; this.menuCursor+=o; if(this.menuCursor<0)this.menuCursor=this.interactables.length-1; if(this.menuCursor>=this.interactables.length)this.menuCursor=0; Game.render(); }
    selectOption() { if(this.interactables.length===0)return; const t=this.interactables[this.menuCursor]; if(t.type==='slot')this.unequipItem(t.id); else if(t.type==='item')this.equipItem(t.id); else if(t.type==='close') Game.toggleCharacterMenu(); }
    
    getDisplayHTML() {
        this.interactables = [];
        let c = 0, invH = "", keys = Object.keys(this.inventory), equipH = "";
        
        // --- 1. EQUIPMENT ---
        ['weapon', 'body', 'leggings'].forEach(s => {
            let i = this.equipment[s];
            this.interactables.push({ type: 'slot', id: s });
            let sel = (c === this.menuCursor); 
            let sc = "equip-slot interactive-row" + (sel ? " menu-focus-row" : ""); // Add interactive-row class
            // Add onmouseenter logic
            equipH += `<div class="${sc}" onmouseenter="Game.updateCharacterCursor(${c})"><span>${i ? `${i.name} <span class="inv-btn" onclick="Game.player.unequipItem('${s}')">Unequip</span>` : `<span style="color:#666">Empty ${s}</span>`}</span></div>`;
            c++;
        });

        // --- 2. INVENTORY ---
        if (keys.length > 0) {
            keys.forEach(k => {
                let i = this.inventory[k], dc = Number.isInteger(i.amount) ? i.amount : i.amount.toFixed(1), ce = (i.is_weapon || i.is_armor_body || i.is_armor_leggings);
                this.interactables.push({ type: ce ? 'item' : 'none', id: k });
                let sel = (c === this.menuCursor); 
                let rs = "display:flex; justify-content:space-between; margin-bottom:4px; padding:2px 4px; border-radius:4px; border:1px solid transparent;" + (sel ? " border-color: var(--accent); background: rgba(255,255,255,0.1);" : "");
                let rowClass = "interactive-row" + (sel ? " menu-focus-row" : "");
                // Add onmouseenter logic
                invH += `<div class="${rowClass}" style="${rs}" onmouseenter="Game.updateCharacterCursor(${c})"><span>- ${i.name} x${dc}</span>${ce ? `<span class="inv-btn" onclick="Game.player.equipItem('${k}')">Equip</span>` : ""}</div>`;
                c++;
            });
        } else {
            invH = "<div style='color:#666; font-style:italic'>(Bag is empty)</div>";
        }

        // --- 3. SKILLS ---
        let cs = this.getCombatSkills();
        let raw_skills = this.getRawCombatSkills();
        const fs = (base, total) => { let bo = total - base; return bo > 0 ? `${base}<span style="color:#4f4">+${bo}</span>` : `${base}`; };
        const skillLabels = { attack: "ATK", defense: "DEF", healing: "HEAL", luck: "LCK" };
        let skillsHTML = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">';
        for (let key in skillLabels) { if (cs[key] !== undefined) { skillsHTML += `<div>${skillLabels[key]}: ${fs(raw_skills[key], cs[key])}</div>`; } }
        skillsHTML += '</div>';
        let hpHtml = `<div>HP: ${Math.floor(this.hp)} / ${this.getMaxHP()}</div>`;

        // --- 4. CLOSE BUTTON ---
        this.interactables.push({ type: 'close', id: 'close' });
        let closeSel = (c === this.menuCursor);
        let closeClass = "menu-item interactive-row" + (closeSel ? " menu-focus-row" : "");
        // Add onmouseenter logic
        let closeBtn = `<div class="${closeClass}" style="justify-content:center; margin-top:15px; background:#444; color:#fff; font-weight:bold; text-align:center;" onclick="Game.toggleCharacterMenu()" onmouseenter="Game.updateCharacterCursor(${c})">CLOSE BAG</div>`;

        return `<div style="font-family:'Courier New'; line-height:1.4; font-size:13px;">
            <div style="border-bottom:1px solid #555; margin-bottom:10px; padding-bottom:5px; text-align:center;"><strong>CHARACTER MENU</strong></div>
            <div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold;">ATTRIBUTES</div>${hpHtml}${skillsHTML}</div>
            <div style="margin-bottom:10px;"><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">EQUIPMENT (Enter to Unequip)</div>${equipH}</div>
            <div><div style="color:var(--accent); font-weight:bold; margin-bottom:5px;">INVENTORY (Enter to Equip)</div><div id="inv-scroll-container" style="max-height:150px; overflow-y:auto; padding-right:5px;">${invH}</div></div>
            ${closeBtn}</div>`;
    }
}

// --- SCENE FUNCTIONS ---
const SceneFunctions = {
    fn_intro_combat: function(next) { if (!GlobalState.variables["combatIntroPlayed"]) { Game.startDialogue(introCombatData, () => { GlobalState.variables["combatIntroPlayed"] = true; if (next) next(); }); } else { if (next) next(); } },
    fn_interaction: function(next, interactionId) {
        const rules = INTERACTION_REGISTRY[interactionId]; if (!rules) { console.error("Missing interaction:", interactionId); if(next) next(); return; }
        let activeRule = rules.find(r => { if (r.condition === "default") return true; const conditions = Array.isArray(r.condition) ? r.condition : [r.condition]; return conditions.every(cond => { if (cond.type === "item") { const count = Game.player.getItemCount(cond.id); if (cond.op === ">=") return count >= cond.val; if (cond.op === "==") return count == cond.val; } else { const val = GlobalState.variables[cond.var]; if (cond.op === "==") return val == cond.val; if (cond.op === "!=") return val != cond.val; if (cond.op === "in") return cond.val.includes(val); } return false; }); });
        if (!activeRule) { if(next) next(); return; }
        const data = activeRule.data;
        const executeActions = (actList) => { if (!actList) return; actList.forEach(act => { if (act.type === "set_state") GlobalState.variables[act.key] = act.val; else if (act.type === "reward") Game.player.addItem(act.item, act.count); else if (act.type === "consume") Game.player.addItem(act.item, -act.count); else if (act.type === "log") Game.log(act.text); else if (act.type === "goto") { const fullPath = findPathToNode(worldMap, act.target); if (fullPath && fullPath.length > 0) { const target = fullPath.pop(); Game.pathStack = fullPath.map(step => { const info = Game.parseKey(step.key); return { key: step.key, node: step.node, title: info.name, image: info.image, cursor: 0 }; }); Game.currentNode = null; Game.enterScene(target.key, target.node); } } }); };
        if (data.log_only) { Game.log(data.log_only); if (next) next(); return; }
        if (data.binding) GlobalState.activeVariable = data.binding;
        if (data.dialogue) { Game.startDialogue(data.dialogue, () => { if (data.on_finish) { const logic = data.on_finish; if (logic.check_var) { const val = GlobalState.variables[logic.check_var]; if (logic.if_true && val) { logic.if_true.dialogue ? Game.startDialogue(logic.if_true.dialogue, () => executeActions(logic.if_true.actions)) : executeActions(logic.if_true.actions); } else if (logic.if_false && !val) { logic.if_false.dialogue ? Game.startDialogue(logic.if_false.dialogue, () => executeActions(logic.if_false.actions)) : executeActions(logic.if_false.actions); } if (logic.if_value) { const branch = logic.if_value[val] || logic.if_value["default"]; if (branch) executeActions(branch.actions); } } executeActions(logic.actions); } if (next) next(); }); } 
        else { if (data.on_finish) executeActions(data.on_finish.actions); if (next) next(); }
    }
};

// --- MAIN GAME ENGINE ---
const Game = {
    player: new CharacterMenu(), currentNode: null, currentTitle: "", currentImage: "", currentKey: "", pathStack: [],
    cursor: 0, choiceCursor: 0, activeInterval: null, currentActionName: "", inCombat: false, inDialogue: false, inMainMenu: true, dialogueQueue: [], dialogueIndex: 0, dialogueOnComplete: null,
    dungeonStages: [], dungeonIndex: 0, currentDungeonEnemy: null, dungeonTurn: 0,
    
    init: function() { this.player.hp = this.player.getMaxHP(); this.setupUI(); this.setupInput(); this.startPassiveRegen(); this.showMainMenu(); },
    setupUI: function() { const attach = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; }; attach('menu-toggle-btn', () => this.toggleCharacterMenu()); attach('system-menu-btn', () => this.toggleSaveModal(true)); attach('btn-close-modal', () => this.toggleSaveModal(false)); attach('btn-copy-save', () => this.generateSave()); attach('btn-load-save', () => this.loadSave()); },

    // --- MAIN MENU WITH HOVER FIX ---
    showMainMenu: function() {
        this.inMainMenu = true; this.stopAction();
        document.getElementById('hud-overlay').style.display = 'none';
        document.getElementById('location-pill').style.display = 'none';
        safelySetBackgroundImage('scene-bg-container', 'scene-image', "images/bg/", "title_screen.png");
        const menuContainer = document.getElementById('menu-list'); menuContainer.innerHTML = '';
        const options = ["Start New Game", "Load Game"]; this.cursor = 0;
        
        const renderMenu = () => {
            menuContainer.innerHTML = `<div class="main-menu-screen"><div class="title-text">✨ ISEKAI SIMULATOR ✨<br><span style="font-size:12px; color:#888;">Text Edition</span></div><div id="mm-opts" style="width:100%"></div></div>`;
            const optsContainer = document.getElementById('mm-opts');
            options.forEach((opt, idx) => {
                const el = document.createElement('div');
                el.className = 'menu-item' + (idx === this.cursor ? ' active' : '');
                el.innerHTML = `<span style="pointer-events: none;">${opt}</span>`;
                
                // HOVER FIX: Sync mouse hover with game cursor
                el.onmouseenter = () => { 
                    this.cursor = idx; 
                    const allItems = optsContainer.querySelectorAll('.menu-item');
                    allItems.forEach(item => item.classList.remove('active'));
                    el.classList.add('active');
                };

                el.onclick = () => { if(idx === 0) this.startNewGame(); if(idx === 1) this.toggleSaveModal(true); };
                optsContainer.appendChild(el);
            });
        };
        renderMenu();
    },

    startNewGame: function() { this.inMainMenu = false; document.getElementById('hud-overlay').style.display = 'flex'; document.getElementById('location-pill').style.display = 'block'; this.player = new CharacterMenu(); this.player.hp = this.player.getMaxHP(); this.pathStack = []; Object.keys(GlobalState.variables).forEach(k => { if(typeof GlobalState.variables[k] === 'boolean') GlobalState.variables[k] = false; if(GlobalState.variables[k] === 'completed' || GlobalState.variables[k] === 'started') GlobalState.variables[k] = 'not_started'; }); const rootKey = "scene:open world:Open World:world_map.png; fn_interaction:intro_logic"; this.enterScene(rootKey, worldMap[rootKey]); },

    // --- SAVE / LOAD ---
    toggleSaveModal: function(show) { const modal = document.getElementById('save-modal'); if(show) { modal.classList.add('active'); document.getElementById('save-data-area').value = ""; document.getElementById('save-msg').innerText = ""; } else { modal.classList.remove('active'); } },
    generateSave: function() { try { const p = this.player; const pureInventory = []; for (let k in p.inventory) pureInventory.push([k, p.inventory[k].amount]); const pureEquip = []; ['weapon', 'body', 'leggings'].forEach(slot => { if (p.equipment[slot]) pureEquip.push(p.equipment[slot].name); }); const locId = this.parseKey(this.currentKey).id; const pureStack = this.pathStack.map(step => this.parseKey(step.key).id); const saveData = { v: GlobalState.variables, l: locId, s: pureStack, p: { hp: p.hp, xp: p.exp, inv: pureInventory, eq: pureEquip } }; const finalStr = `RPG✨${Compressor.encode(JSON.stringify(saveData))}`; const area = document.getElementById('save-data-area'); area.value = finalStr; area.select(); document.execCommand('copy'); document.getElementById('save-msg').innerText = "Compressed Save Copied!"; document.getElementById('save-msg').style.color = "#4f4"; } catch (e) { console.error(e); document.getElementById('save-msg').innerText = "Error saving."; } },
    loadSave: function() { try { let rawStr = document.getElementById('save-data-area').value.trim(); if (!rawStr.startsWith("RPG✨")) throw new Error("Missing Save Header"); rawStr = rawStr.replace("RPG✨", ""); const data = JSON.parse(Compressor.decode(rawStr)); GlobalState.variables = data.v; this.player = new CharacterMenu(); this.player.hp = data.p.hp; this.player.exp = data.p.xp; data.p.inv.forEach(item => this.player.addItem(item[0], item[1])); if (data.p.eq) data.p.eq.forEach(itemName => { this.player.addItem(itemName, 1); this.player.equipItem(itemName); }); this.pathStack = []; if (data.s) { data.s.forEach(id => { const found = findSceneNode(worldMap, id); if (found) { const info = this.parseKey(found.key); this.pathStack.push({ key: found.key, node: found.node, title: info.name, image: info.image, cursor: 0 }); } }); } const currentScene = findSceneNode(worldMap, data.l); if (currentScene) { this.inMainMenu = false; this.toggleSaveModal(false); document.getElementById('hud-overlay').style.display = 'flex'; document.getElementById('location-pill').style.display = 'block'; this.currentNode = null; this.enterScene(currentScene.key, currentScene.node); } } catch (e) { console.error(e); document.getElementById('save-msg').innerText = "Corrupt/Invalid Save"; document.getElementById('save-msg').style.color = "#f44"; } },

    // --- DIALOGUE ---
    startDialogue: function(dialogueObj, callback) { this.inDialogue = true; this.dialogueQueue = dialogueObj.data; this.dialogueIndex = 0; this.dialogueOnComplete = callback; document.getElementById('dialogue-visual-layer').classList.add('active'); document.getElementById('dialogue-box').classList.add('active'); document.getElementById('menu-list').style.display = 'none'; document.getElementById('location-pill').classList.remove('visible'); safelySetBackgroundImage('dialogue-bg-container', 'dialogue-bg', "images/bg/", dialogueObj.background); const spriteContainer = document.getElementById('sprite-container'); spriteContainer.innerHTML = ''; if (dialogueObj.speakers) { for (let speakerName in dialogueObj.speakers) { const data = dialogueObj.speakers[speakerName]; const filename = data[0]; const position = data[1]; let leftPos = "50%", bottomPos = "0%"; let coords = position.replace(/[()]/g, '').split(','); if (coords.length === 2) { leftPos = coords[0]; bottomPos = coords[1]; } const wrapper = document.createElement('div'); wrapper.id = 'sprite-' + speakerName; wrapper.className = 'sprite-wrapper'; wrapper.style.left = leftPos; wrapper.style.bottom = bottomPos; wrapper.style.transform = `translateX(-${leftPos})`; wrapper.style.opacity = '0'; const img = document.createElement('img'); img.className = 'character-sprite'; img.src = "images/sprites/" + filename; img.onerror = function() { const placeholder = createFloatingTextPlaceholder(filename, 'character-sprite'); wrapper.innerHTML = ''; wrapper.appendChild(placeholder); }; wrapper.appendChild(img); spriteContainer.appendChild(wrapper); } } setTimeout(() => { this.renderDialogueFrame(); }, 50); },
    advanceDialogue: function() { if (!this.inDialogue) return; const currentStep = this.dialogueQueue[this.dialogueIndex]; if (currentStep && currentStep[0] === 'question' && document.getElementById('dialogue-questions').classList.contains('active')) return; this.dialogueIndex++; if (this.dialogueIndex >= this.dialogueQueue.length) { this.endDialogue(); } else { this.renderDialogueFrame(); } },
    endDialogue: function(returnValue) { this.inDialogue = false; document.getElementById('dialogue-visual-layer').classList.remove('active'); document.getElementById('dialogue-box').classList.remove('active'); document.getElementById('menu-list').style.display = 'flex'; document.getElementById('sprite-container').innerHTML = ''; document.getElementById('location-pill').classList.add('visible'); if (this.dialogueOnComplete) this.dialogueOnComplete(returnValue); this.render(); },
    
    renderDialogueFrame: function() {
        const step = this.dialogueQueue[this.dialogueIndex]; if (!step) return;
        const type = step[0]; const speaker = step[1]; let text = step[2]; const effects = step[3] || []; const questionData = step[4];
        text = text.replace(/\{([a-zA-Z0-9\s]+)\}/g, (match, v) => (GlobalState.variables && GlobalState.variables[v] !== undefined) ? GlobalState.variables[v] : match);
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

        const questionContainer = document.getElementById('dialogue-questions'); questionContainer.innerHTML = text + '<br>';
        if (type === 'question' && questionData) {
            questionContainer.classList.add('active'); this.choiceCursor = 0;
            let idx = 0; // NEW: Counter for hover
            for (let label in questionData) {
                let retVal = questionData[label]; let btn = document.createElement('div'); btn.className = 'choice-btn'; btn.innerText = label;
                let currentIdx = idx; // Capture index
                
                // HOVER FIX: Dialogue Choices
                btn.onmouseenter = () => { 
                    this.choiceCursor = currentIdx; 
                    this.updateChoiceVisuals(); 
                };
                
                btn.onclick = (e) => { e.stopPropagation(); questionContainer.classList.remove('active'); if (GlobalState.activeVariable in GlobalState.variables){ GlobalState.variables[GlobalState.activeVariable] = retVal; GlobalState.activeVariable = "" } this.advanceDialogue(); };
                questionContainer.appendChild(btn);
                idx++;
            }
            this.updateChoiceVisuals();
        } else { questionContainer.classList.remove('active'); }
    },
    updateChoiceVisuals: function() { const btns = document.querySelectorAll('.choice-btn'); btns.forEach((btn, index) => { if (index === this.choiceCursor) { btn.classList.add('selected'); } else { btn.classList.remove('selected'); } }); },
    
    // --- NEW HELPER: CHARACTER MENU HOVER ---
    updateCharacterCursor: function(idx) {
        this.player.menuCursor = idx;
        const rows = document.querySelectorAll('.interactive-row');
        rows.forEach((row, i) => {
            if (i === idx) row.classList.add('menu-focus-row');
            else row.classList.remove('menu-focus-row');
        });
    },

    toggleCharacterMenu: function() { if(this.inDialogue) return; this.player.active = !this.player.active; if(this.player.active) this.player.menuCursor = 0; this.render(); },
    startPassiveRegen: function() { setInterval(() => { if (this.inCombat) return; const maxHp = this.player.getMaxHP(); if (this.player.hp <= 0 || this.player.hp >= maxHp) return; this.player.hp += this.player.skills.healing; if (this.player.hp > maxHp) this.player.hp = maxHp; this.updatePlayerHUD(); }, 2000); },
    updatePlayerHUD: function() { const lvl = this.player.getLevel(); document.getElementById('player-name').textContent = `${this.player.name} Lv.${lvl}`; const maxHp = this.player.getMaxHP(); document.getElementById('hud-hp-bar').style.width = `${Math.max(0, Math.min(100, (this.player.hp / maxHp) * 100))}%`; const maxExp = this.player.getMaxExp(); document.getElementById('hud-exp-bar').style.width = `${Math.max(0, Math.min(100, (this.player.exp / maxExp) * 100))}%`; },
    
    showEnemyHUD: function(name, currentHp, maxHp, isBoss = false) { const hud = document.getElementById('enemy-hud'); hud.classList.add('visible'); const nameEl = document.getElementById('enemy-name'); nameEl.textContent = name; if (isBoss) nameEl.classList.add('boss-name'); else nameEl.classList.remove('boss-name'); this.updateEnemyHUD(currentHp, maxHp); },
    updateEnemyHUD: function(currentHp, maxHp) { document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%`; document.getElementById('enemy-stats').textContent = `${Math.ceil(currentHp)}/${maxHp} HP`; },
    hideEnemyHUD: function() { document.getElementById('enemy-hud').classList.remove('visible'); },
    updateDungeonUI: function() { const bar = document.getElementById('hud-dungeon-bar'); const row = document.getElementById('dungeon-progress-row'); if (this.currentActionName && this.currentActionName.startsWith('dungeon') && this.dungeonStages.length > 0) { row.classList.add('visible'); const pct = (this.dungeonIndex / this.dungeonStages.length) * 100; bar.style.width = `${pct}%`; } else { row.classList.remove('visible'); bar.style.width = '0%'; } },

    render: function() {
        if(this.inDialogue) return;
        document.getElementById('location-pill').textContent = this.currentTitle;
        safelySetBackgroundImage('scene-bg-container', 'scene-image', "images/bg/", this.currentImage);
        this.updatePlayerHUD(); this.updateDungeonUI();
        const menuContainer = document.getElementById('menu-list'); menuContainer.innerHTML = '';
        if (this.player.active) { menuContainer.innerHTML = this.player.getDisplayHTML(); const activeRow = document.querySelector('.menu-focus-row'); if (activeRow) activeRow.scrollIntoView({ block: 'nearest' }); return; }
        if (!this.currentNode) return;
        const options = Object.keys(this.currentNode);
        if(options.length === 0) { menuContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Nothing here...</div>'; return; }
        if (this.cursor >= options.length) this.cursor = 0;
        options.forEach((key, index) => {
            const info = this.parseKey(key); const el = document.createElement('div'); el.className = 'menu-item';
            if (index === this.cursor) el.classList.add('active');
            
            // HOVER FIX: Standard Menu
            el.onmouseenter = () => { this.cursor = index; Array.from(menuContainer.children).forEach(child => child.classList.remove('active')); el.classList.add('active'); };
            
            let content = `<span>${info.name}</span>`;
            if (info.role === 'craft') { const recipe = this.currentNode[key][2]; let canAfford = true; for (let rKey in recipe) { if (rKey.startsWith('input:')) { let item = rKey.split(':')[1]; let cost = recipe[rKey]; if (this.player.getItemCount(item) < cost) canAfford = false; } } if (!canAfford) content += `<span class="insufficient">(insufficient ingredients)</span>`; }
            if (this.activeInterval && this.currentActionName === key) content += `<span class="menu-item-tag">STOP</span>`;
            el.innerHTML = content;
            el.onclick = () => { this.cursor = index; this.executeOption(key); this.render(); };
            menuContainer.appendChild(el);
        });
        const activeEl = menuContainer.children[this.cursor]; if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    
    log: function(msg) { const container = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = msg; container.appendChild(toast); setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2500); },
    parseKey: function(k) { if (!k) return { role: "null", id: "error", name: "Error", image: "" }; const s = k.split(';'); const p = s[0]; let fn = null; let fa = null; if (s[1]) { const rf = s[1].trim(); const fp = rf.split(':'); fn = fp[0]; fa = fp[1] || null; } const pa = p.split(':'); return { role: pa[0], id: pa[1], name: pa[2] || pa[1], image: pa[3] || "placeholder.png", onEnter: fn, onEnterArg: fa }; },

    enterScene: function(keyString, nodeObj) { const info = this.parseKey(keyString); if (nodeObj !== null) { if (this.currentNode) { this.pathStack.push({ key: this.currentKey, node: this.currentNode, title: this.currentTitle, image: this.currentImage, cursor: this.cursor }); } let place_name = info.id; this.currentNode = nodeObj; this.currentTitle = place_name; this.currentImage = info.image; this.currentKey = keyString; this.cursor = 0; this.stopAction(); } if (info.onEnter && SceneFunctions[info.onEnter]) { SceneFunctions[info.onEnter](null, info.onEnterArg); } this.render(); },
    returnScene: function() { if (this.pathStack.length === 0) return; const p = this.pathStack.pop(); this.currentNode = p.node; this.currentTitle = p.title; this.currentImage = p.image; this.currentKey = p.key; this.cursor = p.cursor; this.stopAction(); this.render(); },
    stopAction: function() { if (this.activeInterval) { clearInterval(this.activeInterval); this.activeInterval = null; this.currentActionName = ""; this.inCombat = false; this.hideEnemyHUD(); this.dungeonIndex = 0; for (let key in this.player.inventory) { this.player.inventory[key].amount = Math.floor(this.player.inventory[key].amount); if (this.player.inventory[key].amount <= 0) delete this.player.inventory[key]; } this.render(); } },
    executeOption: function(specificKey = null) {
        const options = Object.keys(this.currentNode); if (options.length === 0) return;
        const selectedKey = specificKey || options[this.cursor]; const selectedValue = this.currentNode[selectedKey]; const info = this.parseKey(selectedKey);
        if (this.activeInterval && this.currentActionName === selectedKey) { this.stopAction(); return; }
        const runAction = () => { switch (info.role) { case "scene": this.enterScene(selectedKey, selectedValue); break; case "return": this.returnScene(); break; case "harvest": this.stopAction(); this.currentActionName = selectedKey; this.startHarvestLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break; case "fight": this.stopAction(); this.currentActionName = selectedKey; this.startFightLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break; case "dungeon": this.stopAction(); this.currentActionName = selectedKey; this.startDungeonLoop(selectedValue); this.render(); break; case "craft": this.stopAction(); this.currentActionName = selectedKey; this.startCraftLoop(selectedValue[0], selectedValue[1], selectedValue[2]); this.render(); break; default: this.log(`Unknown role: ${info.role}`); } };
        if (info.onEnter && info.role !== "scene" && SceneFunctions[info.onEnter]) { SceneFunctions[info.onEnter](runAction, info.onEnterArg); if (this.inDialogue) return; } else { runAction(); }
    },

    startCraftLoop: function(interval, notif, recipe) { this.log(notif); this.activeInterval = setInterval(() => { let canAfford = true; for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(':')[1]; let cost = recipe[key]; if (this.player.getItemCount(item) < cost) canAfford = false; } } if (!canAfford) { this.log("Stopped: Insufficient ingredients."); this.stopAction(); return; } for (let key in recipe) { if (key.startsWith("input:")) { let item = key.split(':')[1]; let cost = recipe[key]; this.player.inventory[item].amount -= cost; } } let outputStr = ""; for (let key in recipe) { if (key.startsWith("output:")) { let item = key.split(':')[1]; let amount = recipe[key]; this.player.addItem(item, amount); outputStr += `${amount} ${item} `; } } this.log(`Crafted: ${outputStr}`); this.render(); }, interval); },
    startHarvestLoop: function(interval, notif, itemDict) { this.log(notif); this.activeInterval = setInterval(() => { const item = dictDraw(itemDict); if (item) { this.player.addItem(item); this.log(`+1 ${item}`); this.updatePlayerHUD(); } }, interval); },
    startFightLoop: function(interval, notif, enemyDict) {
        this.inCombat = true; let enemyTemplate = dictDraw(enemyDict); let enemy = new Enemy(enemyTemplate.name, enemyTemplate.hp, enemyTemplate.loots, enemyTemplate.skills); let turn = 0; let enemy_hp = enemy.hp; let currentSkills = this.player.getCombatSkills();
        this.showEnemyHUD(enemy.name, enemy_hp, enemy.maxHp); this.log(`Encounter: ${enemy.name}!`);
        this.activeInterval = setInterval(() => { this.updateEnemyHUD(enemy_hp, enemy.maxHp); if (enemy_hp <= 0) { let loot = dictDraw(enemy.loots); this.player.addItem(loot); this.log(`Victory! Found: ${loot}`); this.stopAction(); return; } if (this.player.hp <= 0) { this.log(`Defeated! Retreated.`); this.stopAction(); this.player.hp = 1; this.updatePlayerHUD(); return; } if (turn === 1) { const dmg = Math.max(0, enemy.skills.attack - currentSkills.defense); if (Math.random() < 1-Math.exp(-enemy.skills.luck)) { this.player.hp -= dmg; this.log(`${enemy.name} hits for ${dmg} dmg!`); } else { this.log(`${enemy.name} missed!`); } turn = 0; } else { const dmg = Math.max(0, currentSkills.attack - enemy.skills.defense); if (Math.random() < 1-Math.exp(-currentSkills.luck)) { enemy_hp -= dmg; this.player.exp += 1; this.log(`Hit ${enemy.name} for ${dmg} dmg!`); } else { this.log(`You missed!`); } turn = 1; } this.updatePlayerHUD(); }, interval);
    },
    startDungeonLoop: function(stages) { this.dungeonStages = stages; this.dungeonIndex = 0; this.inCombat = true; this.loadDungeonEnemy(); this.updateDungeonUI(); this.activeInterval = setInterval(() => { this.processDungeonTurn(); }, this.dungeonStages[this.dungeonIndex][0]); },
    loadDungeonEnemy: function() { if (this.dungeonIndex >= this.dungeonStages.length) { this.log("Dungeon Cleared!"); this.stopAction(); return; } const stage = this.dungeonStages[this.dungeonIndex]; const enemyDict = stage[2]; const enemyTemplate = dictDraw(enemyDict); this.currentDungeonEnemy = new Enemy(enemyTemplate.name, enemyTemplate.hp, enemyTemplate.loots, enemyTemplate.skills); this.dungeonTurn = 0; const isBoss = (this.dungeonIndex === this.dungeonStages.length - 1); this.showEnemyHUD(this.currentDungeonEnemy.name, this.currentDungeonEnemy.hp, this.currentDungeonEnemy.maxHp, isBoss); this.log(isBoss ? `BOSS BATTLE: ${this.currentDungeonEnemy.name}!` : `Stage ${this.dungeonIndex+1}: ${this.currentDungeonEnemy.name}`); this.updateDungeonUI(); },
    processDungeonTurn: function() { if (!this.currentDungeonEnemy) return; this.updateEnemyHUD(this.currentDungeonEnemy.hp, this.currentDungeonEnemy.maxHp); let currentSkills = this.player.getCombatSkills(); if (this.currentDungeonEnemy.hp <= 0) { let loot = dictDraw(this.currentDungeonEnemy.loots); this.player.addItem(loot); this.log(`Defeated! Found: ${loot}`); this.dungeonIndex++; if (this.dungeonIndex >= this.dungeonStages.length) { this.updateDungeonUI(); this.log("DUNGEON CONQUERED!"); this.stopAction(); } else { this.loadDungeonEnemy(); } return; } if (this.player.hp <= 0) { this.log(`Dungeon Failed! Escaped.`); this.stopAction(); this.player.hp = 1; this.updatePlayerHUD(); return; } if (this.dungeonTurn === 1) { const dmg = Math.max(0, this.currentDungeonEnemy.skills.attack - currentSkills.defense); if (Math.random() < 1 - Math.exp(-this.currentDungeonEnemy.skills.luck)) { this.player.hp -= dmg; this.log(`${this.currentDungeonEnemy.name} hits for ${dmg} dmg!`); } else { this.log(`${this.currentDungeonEnemy.name} missed!`); } this.dungeonTurn = 0; } else { const dmg = Math.max(0, currentSkills.attack - this.currentDungeonEnemy.skills.defense); if (Math.random() < 1 - Math.exp(-currentSkills.luck)) { this.currentDungeonEnemy.hp -= dmg; this.player.exp += 1; this.log(`Hit ${this.currentDungeonEnemy.name} for ${dmg} dmg!`); } else { this.log(`You missed!`); } this.dungeonTurn = 1; } this.updatePlayerHUD(); },
    
    setupInput: function() {
        document.addEventListener('keydown', (e) => {
            if (this.inMainMenu) {
                if (e.key === "ArrowUp") { this.cursor = (this.cursor === 1) ? 0 : 1; const menuItems = document.querySelectorAll('.menu-item'); if(menuItems.length > 1) { menuItems[0].className = 'menu-item' + (this.cursor === 0 ? ' active' : ''); menuItems[1].className = 'menu-item' + (this.cursor === 1 ? ' active' : ''); } }
                else if (e.key === "ArrowDown") { this.cursor = (this.cursor === 0) ? 1 : 0; const menuItems = document.querySelectorAll('.menu-item'); if(menuItems.length > 1) { menuItems[0].className = 'menu-item' + (this.cursor === 0 ? ' active' : ''); menuItems[1].className = 'menu-item' + (this.cursor === 1 ? ' active' : ''); } }
                else if (e.key === "Enter") { if (this.cursor === 0) this.startNewGame(); else this.toggleSaveModal(true); }
                return;
            }
            if (e.key.toLowerCase() === "s" && !this.inDialogue && !this.player.active) { this.toggleSaveModal(true); return; }
            if (e.key === "Escape" && document.getElementById('save-modal').classList.contains('active')) { this.toggleSaveModal(false); return; }
            if (this.inDialogue && document.getElementById('dialogue-questions').classList.contains('active')) { const btns = document.querySelectorAll('.choice-btn'); if (e.key === "ArrowUp") { this.choiceCursor = (this.choiceCursor - 1 + btns.length) % btns.length; this.updateChoiceVisuals(); } else if (e.key === "ArrowDown") { this.choiceCursor = (this.choiceCursor + 1) % btns.length; this.updateChoiceVisuals(); } else if (e.key === "Enter") { if(btns[this.choiceCursor]) btns[this.choiceCursor].click(); } return; }
            if (this.inDialogue) { if (e.key === "Enter") this.advanceDialogue(); return; }
            if (this.player.active) { if (e.key === "ArrowUp") this.player.moveCursor(-1); else if (e.key === "ArrowDown") this.player.moveCursor(1); else if (e.key === "Enter") this.player.selectOption(); else if (e.key === "Escape" || e.key.toLowerCase() === "c") this.toggleCharacterMenu(); return; }
            if (this.currentNode && Object.keys(this.currentNode).length > 0) { if (e.key === "ArrowUp") { this.cursor = (this.cursor - 1 + Object.keys(this.currentNode).length) % Object.keys(this.currentNode).length; this.render(); } else if (e.key === "ArrowDown") { this.cursor = (this.cursor + 1) % Object.keys(this.currentNode).length; this.render(); } else if (e.key === "Enter") { this.executeOption(); } }
            if (e.key.toLowerCase() === "c") this.toggleCharacterMenu(); if (e.key === "Escape") this.stopAction();
        });
    },
};

Game.init();