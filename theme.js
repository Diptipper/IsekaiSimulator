// 1. Site Configuration
window.SiteConfig = {
    title: "Isekai Simulator - Devlog",
    description: "The most awesome openworld sandbox RPG."
};

// 2. The CSS Themes
const Win95Theme = `
    :root {
        --desktop-bg: #008080;
        --win-bg: #c0c0c0;
        --win-light: #ffffff;
        --win-dark: #808080;
        --win-darker: #000000;
        --win-blue: #000080;
        --win-text: #000000;
    }
    body {
        font-family: Tahoma, "MS Sans Serif", Arial, sans-serif;
        background-color: var(--desktop-bg);
        color: var(--win-text);
        line-height: 1.4;
        margin: 0;
        padding: 30px 10px;
    }
    #app { max-width: 800px; margin: 0 auto; }
    .window-border {
        background-color: var(--win-bg);
        border-top: 2px solid var(--win-light);
        border-left: 2px solid var(--win-light);
        border-right: 2px solid var(--win-darker);
        border-bottom: 2px solid var(--win-darker);
        padding: 2px;
    }
    header { margin-bottom: 30px; }
    .title-bar {
        background-color: var(--win-blue);
        color: white;
        padding: 3px 6px;
        font-weight: bold;
        font-size: 1.1em;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .title-bar-controls { display: flex; gap: 2px; }
    .win-button {
        background-color: var(--win-bg);
        border-top: 1px solid var(--win-light);
        border-left: 1px solid var(--win-light);
        border-right: 1px solid var(--win-darker);
        border-bottom: 1px solid var(--win-darker);
        width: 16px; height: 14px;
        font-family: "Courier New", Courier, monospace;
        font-size: 10px; font-weight: bold; line-height: 12px;
        text-align: center; cursor: pointer; color: black;
    }
    .win-button:active {
        border-top: 1px solid var(--win-darker);
        border-left: 1px solid var(--win-darker);
        border-right: 1px solid var(--win-light);
        border-bottom: 1px solid var(--win-light);
    }
    header .content-area { padding: 10px; }
    .post-card { margin-bottom: 20px; }
    .post-date {
        display: block; padding: 5px 10px; background-color: var(--win-bg);
        font-size: 0.9em; border-bottom: 1px solid var(--win-dark);
    }
    .post-body {
        background-color: white; padding: 15px; margin: 5px; overflow-x: auto;
        border-top: 2px solid var(--win-dark); border-left: 2px solid var(--win-dark);
        border-right: 2px solid var(--win-light); border-bottom: 2px solid var(--win-light);
    }
    h1, h2, h3 { color: var(--win-text); margin-top: 1em; margin-bottom: 0.5em; }
    h2, h3 { border-bottom: 1px solid var(--win-dark); padding-bottom: 2px; }
    pre { background: white; padding: 10px; border: 2px inset var(--win-darker); overflow-x: auto; }
    code { font-family: "Courier New", Courier, monospace; }
    figure { margin: 20px 0; text-align: center; background: var(--win-bg); padding: 10px; border-top: 2px solid var(--win-light); border-left: 2px solid var(--win-light); border-right: 2px solid var(--win-darker); border-bottom: 2px solid var(--win-darker); }
    img { max-width: 100%; border-top: 2px solid var(--win-dark); border-left: 2px solid var(--win-dark); border-right: 2px solid var(--win-light); border-bottom: 2px solid var(--win-light); }
    figcaption { margin-top: 8px; font-size: 0.9em; }
    blockquote {
        background-color: #c7e6ff;
        border-left: 4px solid #15158a;
        margin: 1.5em 0;
        padding: 10px 15px;
        font-style: italic;
        color: #15158a;
        box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);
        border-radius: 0 4px 4px 0;
    }
`;

const WinXPTheme = `
    :root {
        --xp-desktop: #2e7de1;      
        --xp-window-bg: #ece9d8;    
        --xp-border: #0055ea;
        --xp-text: #000000;
        --title-shadow: #002371;
    }
    body {
        font-family: Tahoma, "Trebuchet MS", Arial, sans-serif;
        background-color: var(--xp-desktop);
        color: var(--xp-text);
        line-height: 1.5;
        margin: 0;
        padding: 40px 15px;
    }
    #app { max-width: 800px; margin: 0 auto; }
    .window-border {
        background-color: var(--xp-window-bg);
        border: 3px solid var(--xp-border);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.4);
        overflow: hidden; 
    }
    header { margin-bottom: 40px; }
    .title-bar {
        background: linear-gradient(to bottom, #0058e6 0%, #3a93ff 8%, #288eff 40%, #127dff 88%, #0366de 100%);
        color: white;
        padding: 4px 8px;
        font-weight: bold;
        font-size: 1.1em;
        text-shadow: 1px 1px 2px var(--title-shadow);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #00138c;
    }
    .title-bar-controls { display: flex; gap: 2px; align-items: center; }
    .win-button {
        background: linear-gradient(to bottom, #fff 0%, #bbceef 100%);
        border: 1px solid white;
        border-radius: 3px;
        width: 21px; height: 21px;
        font-family: "Arial", sans-serif;
        font-size: 12px; font-weight: bold; line-height: 19px;
        text-align: center; cursor: pointer; color: #1a4a9f;
        box-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
    .win-button:active {
        box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5);
        background: #8faada;
    }
    
    /* FIX: Target the last button in the row for the red 'X' instead of relying on a specific class */
    .title-bar-controls .win-button:last-child {
        background: linear-gradient(to bottom, #e4a093 0%, #e24227 40%, #d02b13 100%);
        color: white;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
    }
    .title-bar-controls .win-button:last-child:active {
        background: #b02310;
    }

    header .content-area { 
        padding: 10px 15px; 
        font-size: 0.9em;
        border-bottom: 1px solid #c5c2b0;
    }
    .post-card { margin-bottom: 30px; }
    .post-date {
        display: block; padding: 4px 15px; 
        background-color: var(--xp-window-bg);
        font-size: 0.85em; 
        color: #555;
        border-bottom: 1px solid #c5c2b0;
    }
    .post-body {
        background-color: #ffffff;
        padding: 20px; margin: 0; overflow-x: auto;
        border-top: 1px solid #8e8f8f;
        min-height: 150px;
    }
    h1, h2, h3 { 
        color: var(--xp-border); 
        margin-top: 1em; 
        margin-bottom: 0.5em; 
        font-weight: normal; 
    }
    h2, h3 { border-bottom: 1px solid #d5d5d5; padding-bottom: 4px; }
    pre { 
        background: #f5f5f5; 
        padding: 12px; 
        border: 1px solid #c5c2b0;
        overflow-x: auto; 
    }
    code { font-family: "Courier New", Courier, monospace; color: #000080; }
    figure { 
        margin: 20px 0; text-align: center; 
        background: #ffffff; 
        padding: 10px; 
        border: 1px solid #c5c2b0;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    }
    img { max-width: 100%; }
    figcaption { margin-top: 8px; font-size: 0.9em; color: #666; }
    blockquote {
        background-color: #d6c6a6; /* Slightly darker shadowed parchment */
        border-left: 4px solid #8a1515; /* Deep red XP title bar color */
        margin: 1.5em 0;
        padding: 10px 15px;
        font-style: italic;
        color: #3b2311; /* Darker ink for readability */
        box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);
        border-radius: 0 4px 4px 0;
    }
`;

// 3. System Initialization
function applyTheme() {
    // --- SET YOUR THEME HERE ---
    const activeTheme = Win95Theme; 
    // ---------------------------

    // Inject CSS into the head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = activeTheme;
    document.head.appendChild(styleElement);

    // Build the header and inject it into the app div
    const appDiv = document.getElementById('app');
    const header = document.createElement('header');
    header.className = 'window-border';
    
    // Clean, static header without the dropdown
    header.innerHTML = `
        <div class="title-bar">
            <span>${window.SiteConfig.title}</span>
            <div class="title-bar-controls">
                <div class="win-button">_</div>
                <div class="win-button">□</div>
                <div class="win-button">X</div>
            </div>
        </div>
        <div class="content-area">
            ${window.SiteConfig.description}
        </div>
    `;
    
    // Insert the header right before the main feed
    appDiv.insertBefore(header, document.getElementById('feed'));
}

// Run the theme application as soon as the DOM is ready
document.addEventListener("DOMContentLoaded", applyTheme);