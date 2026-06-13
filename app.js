/* ═══════════════════════════════════════════════════════════
   PrimeTiers — Tierlist App Logic
   Fetches data from bot API, renders leaderboard
   ═══════════════════════════════════════════════════════════ */

// ── Configuration ───────────────────────────────────────────
// Change this to fetch from the local static JSON file
const API_BASE = './data.json';

// ── Constants ───────────────────────────────────────────────
const TIER_POINTS = {
    HT1: 60, LT1: 45,
    HT2: 30, LT2: 20,
    HT3: 10, LT3: 6,
    HT4: 4,  LT4: 3,
    HT5: 2,  LT5: 1,
};

const MODE_ICONS = {
    sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line></svg>',
    npot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v4"></path><path d="M14 3v4"></path><path d="M8 3h8"></path><path d="M9 7l-3 8a4.5 4.5 0 0 0 9.5 2.5 4.5 4.5 0 0 0-1.5-10.5z"></path></svg>',
    dpot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v4"></path><path d="M14 3v4"></path><path d="M8 3h8"></path><path d="M9 7l-3 8a4.5 4.5 0 0 0 9.5 2.5 4.5 4.5 0 0 0-1.5-10.5z"></path><circle cx="12" cy="15" r="2"></circle></svg>',
    mace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 15L3 21"></path><path d="M14 10l6-6a2.828 2.828 0 1 1 4 4l-6 6z"></path></svg>',
    smp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    uhc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    vanilla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>',
};

const MODE_IMAGES = {
    sword: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/diamond_sword.png',
    axe: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/diamond_axe.png',
    npot: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/netherite_helmet.png',
    dpot: 'https://minecraft.wiki/images/Splash_Potion_of_Healing_JE2_BE2.png',
    mace: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/mace.png',
    smp: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/ender_pearl.png',
    uhc: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/golden_apple.png',
    vanilla: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/item/end_crystal.png',
};

const MODE_LABELS = {
    sword: 'Sword',
    axe: 'Axe',
    npot: 'nPot',
    dpot: 'dPot',
    mace: 'Mace',
    smp: 'SMP',
    uhc: 'UHC',
    vanilla: 'Vanilla'
};

const TITLE_THRESHOLDS = [
    { min: 400, title: 'Combat Grandmaster' },
    { min: 250, title: 'Combat Master' },
    { min: 100, title: 'Combat Ace' },
    { min: 50,  title: 'Combat Specialist' },
    { min: 20,  title: 'Combat Cadet' },
    { min: 10,  title: 'Combat Novice' },
];

function getPlayerTitle(points) {
    for (const t of TITLE_THRESHOLDS) {
        if (points >= t.min) return t.title;
    }
    return 'Rookie';
}

// ── State ───────────────────────────────────────────────────
let allPlayers = [];
let currentView = 'global';   // 'global' or 'modes'
let currentMode = 'all';      // 'all' or specific mode
let searchQuery = '';

// ── DOM References ──────────────────────────────────────────
const $loading     = document.getElementById('loading');
const $error       = document.getElementById('error-state');
const $tableWrap   = document.getElementById('table-wrapper');
const $tableBody   = document.getElementById('table-body');
const $noResults   = document.getElementById('no-results');
const $modeBar     = document.getElementById('mode-bar');
const $searchInput = document.getElementById('search-input');

// Stats
const $statPlayers = document.getElementById('stat-players');
const $statTests   = document.getElementById('stat-tests');
const $statUpdated = document.getElementById('stat-updated');

// ── Load Data ───────────────────────────────────────────────
async function loadLeaderboard() {
    $loading.style.display = '';
    $error.style.display = 'none';
    $tableWrap.style.display = 'none';
    $noResults.style.display = 'none';

    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        allPlayers = data.players || [];

        // Stats
        $statPlayers.textContent = allPlayers.length;
        let totalTiers = 0;
        allPlayers.forEach(p => {
            totalTiers += Object.keys(p.tiers).length;
        });
        $statTests.textContent = totalTiers;

        if (data.updated) {
            const d = new Date(data.updated);
            $statUpdated.textContent = d.toLocaleString();
        }

        $loading.style.display = 'none';
        render();
    } catch (err) {
        console.error('Failed to load leaderboard:', err);
        $loading.style.display = 'none';
        $error.style.display = '';
    }
}

// ── Render ──────────────────────────────────────────────────
function render() {
    let players = [...allPlayers];

    // Search filter
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        players = players.filter(p => p.username.toLowerCase().includes(q));
    }

    if (players.length === 0 && allPlayers.length > 0) {
        $tableWrap.style.display = 'none';
        document.getElementById('board-wrapper').style.display = 'none';
        $noResults.style.display = '';
        return;
    }

    $noResults.style.display = 'none';

    if (currentView === 'modes' && currentMode !== 'all') {
        // BOARD LAYOUT
        $tableWrap.style.display = 'none';
        const $boardWrap = document.getElementById('board-wrapper');
        $boardWrap.style.display = 'grid';
        $boardWrap.innerHTML = '';

        // Filter players who have a tier in this mode
        const modePlayers = players.filter(p => p.tiers[currentMode] && p.tiers[currentMode].current);

        const tiersArr = [
            { id: 1, name: 'Tier 1', icon: '🏆', ht: 'HT1', lt: 'LT1', cls: 't1' },
            { id: 2, name: 'Tier 2', icon: '🥈', ht: 'HT2', lt: 'LT2', cls: 't2' },
            { id: 3, name: 'Tier 3', icon: '🥉', ht: 'HT3', lt: 'LT3', cls: 't3' },
            { id: 4, name: 'Tier 4', icon: '', ht: 'HT4', lt: 'LT4', cls: 't4' },
            { id: 5, name: 'Tier 5', icon: '', ht: 'HT5', lt: 'LT5', cls: 't5' }
        ];

        tiersArr.forEach(t => {
            const col = document.createElement('div');
            col.className = 'board-col';

            const header = document.createElement('div');
            header.className = `board-header ${t.cls}`;
            header.innerHTML = `${t.icon} ${t.name}`;
            col.appendChild(header);

            // Get players for this tier (either HT or LT)
            const tPlayers = modePlayers.filter(p => p.tiers[currentMode].current === t.ht || p.tiers[currentMode].current === t.lt);
            
            // Sort: HT first, then by total points descending
            tPlayers.sort((a, b) => {
                const aIsHT = a.tiers[currentMode].current === t.ht ? 1 : 0;
                const bIsHT = b.tiers[currentMode].current === t.ht ? 1 : 0;
                if (aIsHT !== bIsHT) return bIsHT - aIsHT;
                return b.totalPoints - a.totalPoints;
            });

            tPlayers.forEach((p, index) => {
                const isHT = p.tiers[currentMode].current === t.ht;
                const card = document.createElement('div');
                card.className = `board-card tier-${t.id} ${isHT ? 'ht-tier' : 'lt-tier'}`;
                card.style.animationDelay = `${Math.min(index * 0.04, 1)}s`;
                
                const upArrowHT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
                const upArrowLT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;

                card.innerHTML = `
                    <img class="card-avatar" src="https://mc-heads.net/avatar/${p.uuid}/24" alt="">
                    <div class="card-name">${p.username}</div>
                    <div class="card-arrow">
                        ${isHT ? upArrowHT : upArrowLT}
                    </div>
                `;
                
                card.addEventListener('click', () => openProfile(p));
                col.appendChild(card);
            });

            $boardWrap.appendChild(col);
        });

    } else {
        // TABLE LAYOUT
        document.getElementById('board-wrapper').style.display = 'none';
        $tableWrap.style.display = '';
        $tableBody.innerHTML = '';

    players.forEach((player, index) => {
        const rank = index + 1;
        const row = document.createElement('div');
        row.className = 'player-row';
        if (rank <= 3) row.classList.add(`rank-${rank}`);
        row.style.animationDelay = `${Math.min(index * 0.04, 1)}s`;

        // Rank
        const rankEl = document.createElement('span');
        rankEl.className = 'rank-num';
        rankEl.textContent = `#${rank}`;

        // Player info
        const infoEl = document.createElement('div');
        infoEl.className = 'player-info';

        const avatarImg = document.createElement('img');
        avatarImg.className = 'player-avatar';
        avatarImg.src = `https://mc-heads.net/avatar/${player.uuid}/40`;
        avatarImg.alt = player.username;
        avatarImg.loading = 'lazy';

        const nameWrap = document.createElement('div');
        nameWrap.className = 'player-name-wrap';

        const nameEl = document.createElement('span');
        nameEl.className = 'player-name';
        nameEl.textContent = player.username;

        const titleEl = document.createElement('span');
        titleEl.className = 'player-title';
        titleEl.textContent = getPlayerTitle(player.totalPoints);

        nameWrap.appendChild(nameEl);
        nameWrap.appendChild(titleEl);
        infoEl.appendChild(avatarImg);
        infoEl.appendChild(nameWrap);

        // Tiers
        const tiersEl = document.createElement('div');
        tiersEl.className = 'tiers-cell';

        if (currentView === 'modes' && currentMode !== 'all') {
            // Show only the selected mode's tier
            const tierData = player.tiers[currentMode];
            if (tierData) {
                tiersEl.appendChild(createTierBadge(currentMode, tierData.current));
            }
        } else {
            // Show all tiers
            const modes = Object.entries(player.tiers);
            // Sort by tier rank descending
            const TIER_ORDER = ['LT5', 'HT5', 'LT4', 'HT4', 'LT3', 'HT3', 'LT2', 'HT2', 'LT1', 'HT1'];
            modes.sort((a, b) => {
                return TIER_ORDER.indexOf(b[1].current) - TIER_ORDER.indexOf(a[1].current);
            });
            modes.forEach(([mode, data]) => {
                tiersEl.appendChild(createTierBadge(mode, data.current));
            });
        }

        // Points
        const pointsEl = document.createElement('span');
        pointsEl.className = 'points-cell';
        if (currentView === 'modes' && currentMode !== 'all') {
            const tierData = player.tiers[currentMode];
            pointsEl.textContent = tierData ? (TIER_POINTS[tierData.current] || 0) : 0;
        } else {
            pointsEl.textContent = player.totalPoints;
        }

        row.appendChild(rankEl);
        row.appendChild(infoEl);
        row.appendChild(tiersEl);
        row.appendChild(pointsEl);

        row.addEventListener('click', () => openProfile(player));

        $tableBody.appendChild(row);
    });
    }
}

function createTierBadge(mode, tier) {
    const badge = document.createElement('span');
    badge.className = `tier-badge tier-${tier}`;

    const iconImg = document.createElement('img');
    iconImg.className = 'mode-icon-img';
    iconImg.src = MODE_IMAGES[mode] || MODE_IMAGES['sword'];
    iconImg.style.width = '14px';
    iconImg.style.height = '14px';
    iconImg.style.imageRendering = 'pixelated';

    const text = document.createTextNode(tier);

    badge.appendChild(iconImg);
    badge.appendChild(text);
    return badge;
}

// ── Event Listeners ─────────────────────────────────────────

// Navigation (Global / By Mode)
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;

        if (currentView === 'modes') {
            $modeBar.classList.add('visible');
        } else {
            $modeBar.classList.remove('visible');
            currentMode = 'all';
        }

        render();
    });
});

// Mode chips
document.querySelectorAll('.mode-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentMode = chip.dataset.mode;
        render();
    });
});

// Search
$searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
});

$searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const q = searchQuery.toLowerCase();
        const players = allPlayers.filter(p => p.username.toLowerCase().includes(q));
        if (players.length > 0) {
            openProfile(players[0]);
        }
    }
});

// ── Modals ──────────────────────────────────────────────────

function openProfile(player) {
    const $overlay = document.getElementById('profile-overlay');
    
    document.getElementById('profile-username').textContent = player.username;
    document.getElementById('profile-pts-num').textContent = player.totalPoints;
    
    const titleBadge = document.getElementById('profile-title-badge');
    titleBadge.textContent = getPlayerTitle(player.totalPoints);
    
    const skinImg = document.getElementById('profile-skin');
    skinImg.src = `https://mc-heads.net/body/${player.uuid}/left`;
    
    document.getElementById('profile-namemc-link').href = `https://namemc.com/profile/${player.uuid}`;

    const MODES = ['sword', 'axe', 'npot', 'dpot', 'mace', 'smp', 'uhc', 'vanilla'];
    
    const $currGrid = document.getElementById('profile-tiers-grid');
    const $highGrid = document.getElementById('profile-highest-grid');
    
    $currGrid.innerHTML = '';
    $highGrid.innerHTML = '';

    MODES.forEach(mode => {
        const data = player.tiers[mode];
        
        // Current slot
        const currSlot = document.createElement('div');
        currSlot.className = `tier-slot ${data && data.current ? 'has-tier slot-' + data.current : ''}`;
        currSlot.innerHTML = `
            <div class="tier-slot-icon ${!(data && data.current) ? 'empty-slot' : ''}">
                <img src="${MODE_IMAGES[mode]}" alt="${mode}">
            </div>
            <div class="tier-slot-tier">${data && data.current ? data.current : '?'}</div>
            <div class="tier-slot-mode">${MODE_LABELS[mode]}</div>
        `;
        $currGrid.appendChild(currSlot);

        // Highest slot
        const highSlot = document.createElement('div');
        highSlot.className = `tier-slot ${data && data.highest ? 'has-tier slot-' + data.highest : ''}`;
        highSlot.innerHTML = `
            <div class="tier-slot-icon ${!(data && data.highest) ? 'empty-slot' : ''}">
                <img src="${MODE_IMAGES[mode]}" alt="${mode}">
            </div>
            <div class="tier-slot-tier">${data && data.highest ? data.highest : '?'}</div>
            <div class="tier-slot-mode">${MODE_LABELS[mode]}</div>
        `;
        $highGrid.appendChild(highSlot);
    });

    $overlay.classList.add('active');
}

document.getElementById('profile-close').addEventListener('click', () => {
    document.getElementById('profile-overlay').classList.remove('active');
});
document.getElementById('profile-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'profile-overlay') e.target.classList.remove('active');
});

// Info Modal
document.getElementById('info-btn').addEventListener('click', () => {
    document.getElementById('info-overlay').classList.add('active');
});

document.getElementById('info-close').addEventListener('click', () => {
    document.getElementById('info-overlay').classList.remove('active');
});

document.getElementById('info-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'info-overlay') e.target.classList.remove('active');
});

document.querySelectorAll('.info-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.info-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.info-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`info-tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// ── Init ────────────────────────────────────────────────────
loadLeaderboard();
