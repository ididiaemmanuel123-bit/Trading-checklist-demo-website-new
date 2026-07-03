// ── USER NAME SYSTEM ──────────────────────────────────────────────────────────

const USER_NAME_KEY = 'smcUserName';
const USER_ID_KEY = 'smcUserId';

// Generate a short unique ID for the user — runs once and is saved permanently
// Format: USR-XXXXXX where X is a random alphanumeric character
// This ID appears on every PDF so each user's exports are uniquely tagged
function generateUserId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'USR-';
  for (var i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Get the saved user name — returns saved name or default 'User' if not set yet
function getUserName() {
  return localStorage.getItem(USER_NAME_KEY) || 'User';
}

// Get the saved user ID — generates and saves one if it doesn't exist yet
// This means every device that opens the tool gets a permanent unique ID
function getUserId() {
  var id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateUserId();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

// Check on page load if the user has already set their name
// If not — show the welcome modal so they can enter it
// If yes — skip the modal entirely, proceed normally
function checkUserName() {
  const saved = localStorage.getItem(USER_NAME_KEY);
  if (!saved) {
    openNameModal();
  }
}

// Open the name modal
function openNameModal() {
  const modal = document.getElementById('nameModal');
  if (modal) modal.classList.add('open');
  // Focus the input so the user can start typing immediately
  setTimeout(function() {
    const input = document.getElementById('nameInput');
    if (input) input.focus();
  }, 100);
}

// Close the name modal
function closeNameModal() {
  const modal = document.getElementById('nameModal');
  if (modal) modal.classList.remove('open');
}

// Save the name the user typed and close the modal
// If the field is empty, save 'User' as the default
function saveUserName() {
  const input = document.getElementById('nameInput');
  const name = input.value.trim();

  // Use entered name or fall back to 'User' if blank
  const finalName = name !== '' ? name : 'User';

  localStorage.setItem(USER_NAME_KEY, finalName);
  closeNameModal();
  showToast('Welcome, ' + finalName + '!');
}

// Wire up the Get Started button and settings gear icon
document.getElementById('saveNameBtn').addEventListener('click', saveUserName);

// Allow pressing Enter in the name input to confirm
document.getElementById('nameInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') saveUserName();
});

// Settings gear icon — re-opens the modal so user can update their name
// Also pre-fills the input with their current saved name
document.getElementById('settingsBtn').addEventListener('click', function() {
  const input = document.getElementById('nameInput');
  input.value = getUserName();
  // Change the button text to reflect it's an update not a first-time setup
  document.getElementById('saveNameBtn').textContent = 'Update Name';
  document.querySelector('.nameModalBox h3').textContent = 'Update Your Name';
  document.querySelector('.nameModalBox p').textContent = 'Change the name that appears on your trade receipts.';
  openNameModal();
});


// ── TOAST NOTIFICATION ────────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 3000);
}


// ── MOBILE / TABLET HELPERS ───────────────────────────────────────────────────

function isMobile() {
  return window.innerWidth <= 460;
}

function isTablet() {
  return window.innerWidth <= 960 && window.innerWidth > 460;
}

function openHistoryPanel() {
  const historySection = document.getElementById('historySection');
  const overlay = document.getElementById('historyOverlay');
  historySection.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function closeHistoryPanel() {
  const historySection = document.getElementById('historySection');
  const overlay = document.getElementById('historyOverlay');
  historySection.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function showBackBtn() {
  const btn = document.getElementById('backBtnFixed');
  if (btn) btn.classList.add('visible');
}

function hideBackBtn() {
  const btn = document.getElementById('backBtnFixed');
  if (btn) btn.classList.remove('visible');
}

function showTradeDetail() {
  if (isMobile()) {
    closeHistoryPanel();
    const riskCal = document.querySelector('.riskCal');
    if (riskCal) riskCal.scrollTop = 0;
    showBackBtn();
  }
}

function handleBackBtn() {
  openHistoryPanel();
  hideBackBtn();
  summaryOutput.innerHTML = '';
  window.currentTrade = null;
}


// ── STAGE 4: Live Risk/Reward Calculation ─────────────────────────────────────

const entryInput = document.getElementById('entryPrice');
const stopInput = document.getElementById('stopPrice');
const takeProfitInput = document.getElementById('takeProfitPrice');

const riskSpan = document.getElementById('riskValue');
const rewardSpan = document.getElementById('rewardValue');
const rrSpan = document.getElementById('rrValue');

function calculateRR() {
  const entry = parseFloat(entryInput.value);
  const stop = parseFloat(stopInput.value);
  const tp = parseFloat(takeProfitInput.value);
  const directionInput = document.querySelector('[name="direction"]:checked');
  const direction = directionInput ? directionInput.value : null;

  if (isNaN(entry) || isNaN(stop) || isNaN(tp) || !direction) {
    riskSpan.textContent = '--';
    rewardSpan.textContent = '--';
    rrSpan.textContent = '--';
    return;
  }

  let risk;
  let reward;

  if (direction === 'long') {
    risk = entry - stop;
    reward = tp - entry;
  } else if (direction === 'short') {
    risk = stop - entry;
    reward = entry - tp;
  }

  if (risk <= 0 || reward <= 0) {
    riskSpan.textContent = 'Invalid';
    rewardSpan.textContent = 'Invalid';
    rrSpan.textContent = 'Check prices';
    riskSpan.style.color = 'red';
    rewardSpan.style.color = 'red';
    rrSpan.style.color = 'red';
    return;
  }

  const ratio = (reward / risk).toFixed(2);
  riskSpan.textContent = risk.toFixed(5);
  rewardSpan.textContent = reward.toFixed(5);
  rrSpan.textContent = '1 : ' + ratio;
  riskSpan.style.color = 'red';
  rewardSpan.style.color = 'rgb(117, 190, 8)';
  rrSpan.style.color = 'rgb(117, 190, 8)';
}

entryInput.addEventListener('input', calculateRR);
stopInput.addEventListener('input', calculateRR);
takeProfitInput.addEventListener('input', calculateRR);
document.querySelectorAll('[name="direction"]').forEach(function(radio) {
  radio.addEventListener('change', calculateRR);
});


// ── STAGE 5: Render Summary Card ──────────────────────────────────────────────

const summaryOutput = document.getElementById('summaryOutput');

function renderSummaryCard(trade) {
  const liquidityText = trade.liquidity.length > 0 ? trade.liquidity.join(', ') : 'None';
  const confluencesText = trade.confluences.length > 0 ? trade.confluences.join(', ') : 'None';
  const directionDisplay = trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
  const notesDisplay = trade.notes.trim() !== '' ? trade.notes : '—';

  const exitPriceRow = trade.actualExitPrice !== null
    ? `<div class="cardRow">
        <span class="cardLabel">Actual Exit Price</span>
        <span class="cardValue">${trade.actualExitPrice}</span>
       </div>`
    : '';

  const dateClosedRow = trade.dateClosed !== null
    ? `<div class="cardRow">
        <span class="cardLabel">Date Closed</span>
        <span class="cardValue">${trade.dateClosed}</span>
       </div>`
    : '';

  const cardHTML = `
    <div class="summaryCard" id="summaryCard-${trade.id}">
      <div class="cardTitle">
        Trade Plan — ${trade.pair}
        <span class="badge ${trade.direction}">${directionDisplay}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Date Opened</span>
        <span class="cardValue">${trade.dateOpened}</span>
      </div>
      ${dateClosedRow}
      <div class="cardRow">
        <span class="cardLabel">Outcome</span>
        <span class="cardValue">
          <span class="badge ${trade.outcome.toLowerCase()}">${trade.outcome}</span>
        </span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">HTF Timeframe</span>
        <span class="cardValue">${trade.htfTimeframe}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">LTF Timeframe</span>
        <span class="cardValue">${trade.ltfTimeframe}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Bias</span>
        <span class="cardValue">${trade.biasDirection}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">POI Type</span>
        <span class="cardValue">${trade.poiType}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Liquidity</span>
        <span class="cardValue">${liquidityText}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Confluences</span>
        <span class="cardValue">${confluencesText}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Entry Price</span>
        <span class="cardValue">${trade.entryPrice}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Stop Loss</span>
        <span class="cardValue">${trade.stopPrice}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Take Profit</span>
        <span class="cardValue">${trade.takeProfitPrice}</span>
      </div>
      ${exitPriceRow}
      <div class="cardRow">
        <span class="cardLabel">Risk</span>
        <span class="cardValue" style="color: red;">${trade.riskValue}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Reward</span>
        <span class="cardValue" style="color: rgb(117,190,8);">${trade.rewardValue}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">R:R Ratio</span>
        <span class="cardValue" style="color: rgb(117,190,8);">${trade.rrValue}</span>
      </div>
      <div class="cardRow">
        <span class="cardLabel">Notes</span>
        <span class="cardValue">${notesDisplay}</span>
      </div>
      <div class="cardActions">
        <button class="btnSave" onclick="saveTrade(${trade.id})">Save Trade</button>
        <button class="btnExport" onclick="exportPDF(${trade.id})">Export PDF</button>
      </div>
    </div>
  `;

  summaryOutput.innerHTML = cardHTML;
}


// ── STAGE 6: localStorage ─────────────────────────────────────────────────────

const STORAGE_KEY = 'smcTrades';

function loadTrades() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveAllTrades(trades) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

function updateTradeCount(trades) {
  const countEl = document.getElementById('tradeCount');
  countEl.textContent = trades.length + ' trade' + (trades.length !== 1 ? 's' : '') + ' saved';
}

function updatePerformance(trades) {
  const totalEl = document.getElementById('totalTrades');
  const winRateEl = document.getElementById('winRate');
  const avgRREl = document.getElementById('avgRR');

  const closedTrades = trades.filter(function(t) {
    return t.outcome === 'Win' || t.outcome === 'Loss';
  });

  const wins = trades.filter(function(t) {
    return t.outcome === 'Win';
  });

  const winRate = closedTrades.length > 0
    ? ((wins.length / closedTrades.length) * 100).toFixed(1)
    : 0;

  const rrValues = trades
    .map(function(t) {
      if (t.rrValue && t.rrValue.includes(' : ')) {
        return parseFloat(t.rrValue.split(' : ')[1]);
      }
      return null;
    })
    .filter(function(v) { return v !== null && !isNaN(v); });

  const avgRR = rrValues.length > 0
    ? (rrValues.reduce(function(sum, v) { return sum + v; }, 0) / rrValues.length).toFixed(2)
    : '--';

  totalEl.textContent = trades.length;
  winRateEl.textContent = winRate + '%';
  avgRREl.textContent = avgRR !== '--' ? '1 : ' + avgRR : '--';
}

function renderHistory() {
  const trades = loadTrades();
  const historyList = document.getElementById('historyList');

  const pairFilter = document.getElementById('filterPair').value;
  const outcomeFilter = document.getElementById('filterOutcome').value;

  const filtered = trades.filter(function(trade) {
    const pairMatch = pairFilter === 'all' || trade.pair === pairFilter;
    const outcomeMatch = outcomeFilter === 'all' || trade.outcome === outcomeFilter;
    return pairMatch && outcomeMatch;
  });

  if (filtered.length === 0) {
    historyList.innerHTML = '<p style="color: rgba(255,255,255,0.3); font-size: 13px; padding: 1rem 0; text-align: center;">No trades found.</p>';
    updateTradeCount(trades);
    updatePerformance(trades);
    return;
  }

  const sorted = filtered.slice().sort(function(a, b) { return b.id - a.id; });

  const historyHTML = sorted.map(function(trade) {
    const directionDisplay = trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
    return `
      <div class="historyCard" id="historyCard-${trade.id}">
        <div class="historyCardTop">
          <span class="historyPair">${trade.pair}</span>
          <span class="badge ${trade.direction}">${directionDisplay}</span>
          <span class="badge ${trade.outcome.toLowerCase()}">${trade.outcome}</span>
        </div>
        <div class="historyCardMid">
          <span>${trade.dateOpened}</span>
          <span style="color: rgb(117,190,8);">${trade.rrValue}</span>
        </div>
        <div class="historyCardActions">
          <button onclick="viewTrade(${trade.id})">View</button>
          <button onclick="openOutcomeUpdate(${trade.id})">Update</button>
          <button onclick="deleteTrade(${trade.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  historyList.innerHTML = historyHTML;
  updateTradeCount(trades);
  updatePerformance(trades);
}

function viewTrade(id) {
  const trades = loadTrades();
  const trade = trades.find(function(t) { return t.id === id; });
  if (trade) {
    renderSummaryCard(trade);
    window.currentTrade = trade;
    if (isTablet()) closeHistoryPanel();
    if (isMobile()) showTradeDetail();
  }
}

function deleteTrade(id) {
  const trades = loadTrades();
  const updated = trades.filter(function(t) { return t.id !== id; });
  saveAllTrades(updated);
  renderHistory();
  showToast('Trade deleted.');
  if (window.currentTrade && window.currentTrade.id === id) {
    summaryOutput.innerHTML = '';
    window.currentTrade = null;
  }
}

function openOutcomeUpdate(id) {
  const cardEl = document.getElementById('historyCard-' + id);
  if (!cardEl) return;
  if (cardEl.querySelector('.outcomeForm')) return;

  const trades = loadTrades();
  const trade = trades.find(function(t) { return t.id === id; });
  if (!trade) return;

  const formHTML = `
    <div class="outcomeForm">
      <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">
        How did this trade close?
      </p>
      <div class="outcomeButtons">
        <button class="outcomeBtn btnLoss"
          onclick="confirmOutcomeUpdate(${id}, 'Loss', ${trade.stopPrice})">
          SL Hit
        </button>
        <button class="outcomeBtn btnWin"
          onclick="confirmOutcomeUpdate(${id}, 'Win', ${trade.takeProfitPrice})">
          TP Hit
        </button>
        <button class="outcomeBtn btnBreakeven"
          onclick="showBreakevenInput(${id})">
          Breakeven
        </button>
      </div>
      <div id="breakevenInput-${id}" style="display:none; margin-top:6px;">
        <input
          type="number"
          id="breakevenPrice-${id}"
          step="any"
          placeholder="Enter breakeven price"
        />
        <div class="outcomeFormActions" style="margin-top:6px;">
          <button onclick="confirmBreakeven(${id})">Confirm</button>
          <button onclick="cancelOutcomeUpdate(${id})">Cancel</button>
        </div>
      </div>
      <button class="keepOpenBtn" onclick="cancelOutcomeUpdate(${id})">
        Keep Open
      </button>
    </div>
  `;
  cardEl.insertAdjacentHTML('beforeend', formHTML);
}

function cancelOutcomeUpdate(id) {
  const formEl = document.querySelector('#historyCard-' + id + ' .outcomeForm');
  if (formEl) formEl.remove();
}

function confirmOutcomeUpdate(id, outcome, exitPrice) {
  const trades = loadTrades();
  const index = trades.findIndex(function(t) { return t.id === id; });
  if (index === -1) { showToast('Trade not found.'); return; }
  trades[index].outcome = outcome;
  trades[index].dateClosed = new Date().toLocaleDateString();
  trades[index].actualExitPrice = exitPrice;
  saveAllTrades(trades);
  renderHistory();
  showToast('Outcome marked as ' + outcome + '.');
  if (window.currentTrade && window.currentTrade.id === id) {
    renderSummaryCard(trades[index]);
    window.currentTrade = trades[index];
  }
}

function showBreakevenInput(id) {
  const breakevenDiv = document.getElementById('breakevenInput-' + id);
  if (breakevenDiv) breakevenDiv.style.display = 'block';
}

function confirmBreakeven(id) {
  const priceInput = document.getElementById('breakevenPrice-' + id);
  const exitPrice = parseFloat(priceInput.value);
  if (isNaN(exitPrice)) { showToast('Please enter a valid breakeven price.'); return; }
  const trades = loadTrades();
  const index = trades.findIndex(function(t) { return t.id === id; });
  if (index === -1) { showToast('Trade not found.'); return; }
  trades[index].outcome = 'Breakeven';
  trades[index].dateClosed = new Date().toLocaleDateString();
  trades[index].actualExitPrice = exitPrice;
  saveAllTrades(trades);
  renderHistory();
  showToast('Outcome marked as Breakeven.');
  if (window.currentTrade && window.currentTrade.id === id) {
    renderSummaryCard(trades[index]);
    window.currentTrade = trades[index];
  }
}

document.getElementById('filterPair').addEventListener('change', renderHistory);
document.getElementById('filterOutcome').addEventListener('change', renderHistory);


// ── STAGE 3: Form Data Capture ────────────────────────────────────────────────

const tradeForm = document.getElementById('tradeForm');

tradeForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const pair = document.getElementById('pair').value;
  const htfTimeframe = document.getElementById('htfTimeframe').value;
  const ltfTimeframe = document.getElementById('ltfTimeframe').value;
  const biasDirection = document.getElementById('biasDirection').value;
  const poiType = document.getElementById('poiType').value;
  const notes = document.getElementById('notes').value;
  const entryPrice = parseFloat(document.getElementById('entryPrice').value);
  const stopPrice = parseFloat(document.getElementById('stopPrice').value);
  const takeProfitPrice = parseFloat(document.getElementById('takeProfitPrice').value);
  const directionInput = document.querySelector('[name="direction"]:checked');
  const direction = directionInput ? directionInput.value : null;
  const liquidityChecked = document.querySelectorAll('[name="liquidity"]:checked');
  const liquidity = Array.from(liquidityChecked).map(function(input) { return input.value; });
  const confluencesChecked = document.querySelectorAll('[name="confluences"]:checked');
  const confluences = Array.from(confluencesChecked).map(function(input) { return input.value; });
  const dateOpened = new Date().toLocaleDateString();
  const outcome = 'Open';
  const id = Date.now();
  const riskValue = riskSpan.textContent;
  const rewardValue = rewardSpan.textContent;
  const rrValue = rrSpan.textContent;

  if (!direction) { showToast('Please select a direction — Long or Short.'); return; }
  if (isNaN(entryPrice) || isNaN(stopPrice) || isNaN(takeProfitPrice)) { showToast('Please enter valid numbers for Entry, Stop Loss, and Take Profit.'); return; }
  if (entryPrice === stopPrice) { showToast('Entry price and Stop Loss cannot be the same.'); return; }
  if (riskValue === 'Invalid' || riskValue === '--') { showToast('Please check your prices — R:R calculation is invalid.'); return; }

  const tradeData = {
    id, pair, direction, htfTimeframe, ltfTimeframe, biasDirection,
    poiType, liquidity, confluences, entryPrice, stopPrice, takeProfitPrice,
    riskValue, rewardValue, rrValue, notes, dateOpened, outcome,
    dateClosed: null, actualExitPrice: null
  };

  renderSummaryCard(tradeData);
  window.currentTrade = tradeData;

  if (isMobile()) {
    const riskCal = document.querySelector('.riskCal');
    if (riskCal) riskCal.scrollIntoView({ behavior: 'smooth' });
  }
});


// ── saveTrade ─────────────────────────────────────────────────────────────────

function saveTrade(id) {
  const trades = loadTrades();
  const alreadySaved = trades.find(function(t) { return t.id === id; });
  if (alreadySaved) { showToast('This trade is already saved.'); return; }
  if (!window.currentTrade || window.currentTrade.id !== id) {
    showToast('No trade data found to save.');
    return;
  }
  trades.unshift(window.currentTrade);
  saveAllTrades(trades);
  renderHistory();
  showToast('Trade saved to history.');
}


// ── STAGE 7: PDF Export ───────────────────────────────────────────────────────

function exportPDF(id) {
  const trades = loadTrades();
  const trade = trades.find(function(t) { return t.id === id; });
  const tradeToExport = trade || window.currentTrade;

  if (!tradeToExport) {
    showToast('No trade data found. Please save the trade first.');
    return;
  }

  // Read the current user name and ID from localStorage
  // getUserName() returns 'User' as default if no name has been set
  // getUserId() generates and saves a permanent unique ID on first call
  const userName = getUserName();
  const userId = getUserId();

  const liquidityText = tradeToExport.liquidity.length > 0
    ? tradeToExport.liquidity.join(', ') : 'None';
  const confluencesText = tradeToExport.confluences.length > 0
    ? tradeToExport.confluences.join(', ') : 'None';
  const directionDisplay = tradeToExport.direction.charAt(0).toUpperCase()
    + tradeToExport.direction.slice(1);
  const notesDisplay = tradeToExport.notes.trim() !== '' ? tradeToExport.notes : '—';
  const outcomeDisplay = tradeToExport.outcome;
  const dateClosedDisplay = tradeToExport.dateClosed ? tradeToExport.dateClosed : 'Still Open';
  const exitPriceDisplay = tradeToExport.actualExitPrice !== null
    ? tradeToExport.actualExitPrice : '—';

  const receiptHTML = `
    <div style="
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 30px;
      color: #111;
      background: #fff;
    ">
      <div style="border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: 1px;">
          SMC TRADE PLAN
        </h1>
        <p style="margin: 0; font-size: 13px; color: #555;">
          Trade Journal — ${userName} &nbsp;|&nbsp; ${userId}
        </p>
      </div>

      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f4f4f4;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 20px;
      ">
        <div>
          <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Pair</p>
          <p style="margin: 0; font-size: 20px; font-weight: 800;">${tradeToExport.pair}</p>
        </div>
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Direction</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700;
            color: ${tradeToExport.direction === 'long' ? '#3a7d0a' : '#b50000'};">
            ${directionDisplay}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Outcome</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700;
            color: ${
              outcomeDisplay === 'Win' ? '#3a7d0a' :
              outcomeDisplay === 'Loss' ? '#b50000' :
              outcomeDisplay === 'Breakeven' ? '#b07000' : '#555'
            };">
            ${outcomeDisplay}
          </p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Date Opened</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600;">${tradeToExport.dateOpened}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Date Closed</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600;">${dateClosedDisplay}</p>
        </div>
      </div>

      <div style="border-top: 1px solid #ddd; margin: 16px 0;"></div>

      <h2 style="font-size: 13px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin: 0 0 12px 0;">Analysis</h2>
      ${buildRow('HTF Timeframe', tradeToExport.htfTimeframe)}
      ${buildRow('LTF Timeframe', tradeToExport.ltfTimeframe)}
      ${buildRow('Bias Direction', tradeToExport.biasDirection)}
      ${buildRow('POI Type', tradeToExport.poiType)}
      ${buildRow('Liquidity Context', liquidityText)}
      ${buildRow('Confluences', confluencesText)}

      <div style="border-top: 1px solid #ddd; margin: 16px 0;"></div>

      <h2 style="font-size: 13px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin: 0 0 12px 0;">Prices</h2>
      ${buildRow('Entry Price', tradeToExport.entryPrice)}
      ${buildRow('Stop Loss', tradeToExport.stopPrice)}
      ${buildRow('Take Profit', tradeToExport.takeProfitPrice)}
      ${buildRow('Actual Exit Price', exitPriceDisplay)}

      <div style="border-top: 1px solid #ddd; margin: 16px 0;"></div>

      <h2 style="font-size: 13px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin: 0 0 12px 0;">Risk & Reward</h2>
      ${buildRow('Risk', tradeToExport.riskValue, '#b50000')}
      ${buildRow('Reward', tradeToExport.rewardValue, '#3a7d0a')}
      ${buildRow('R:R Ratio', tradeToExport.rrValue, '#3a7d0a')}

      <div style="border-top: 1px solid #ddd; margin: 16px 0;"></div>

      <h2 style="font-size: 13px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin: 0 0 8px 0;">Notes</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #333; margin: 0;">${notesDisplay}</p>

      <div style="
        border-top: 2px solid #111;
        margin-top: 30px;
        padding-top: 12px;
        text-align: center;
        font-size: 11px;
        color: #aaa;
      ">
        SMC Trade Setup Checklist &nbsp;|&nbsp; Trade ID: ${tradeToExport.id} &nbsp;|&nbsp; User: ${userId}
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = receiptHTML;
  document.body.appendChild(container);

  const options = {
    margin: 10,
    filename: 'SMC-Trade-' + tradeToExport.pair + '-' + tradeToExport.dateOpened.replace(/\//g, '-') + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  showToast('Generating PDF...');

  html2pdf().set(options).from(container).save().then(function() {
    document.body.removeChild(container);
    showToast('PDF downloaded — ' + userName + '.');
  });
}

function buildRow(label, value, color) {
  const valueColor = color || '#111';
  return `
    <div style="
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    ">
      <span style="color: #666;">${label}</span>
      <span style="font-weight: 600; color: ${valueColor};">${value}</span>
    </div>
  `;
}


// ── Wire up floating history button and back button ───────────────────────────

const historyFloatBtn = document.querySelector('.hitoryBtn');
if (historyFloatBtn) {
  historyFloatBtn.addEventListener('click', openHistoryPanel);
}

const historyOverlay = document.getElementById('historyOverlay');
if (historyOverlay) {
  historyOverlay.addEventListener('click', closeHistoryPanel);
}

const backBtnFixed = document.getElementById('backBtnFixed');
if (backBtnFixed) {
  backBtnFixed.addEventListener('click', handleBackBtn);
}


// ── Initialize on page load ───────────────────────────────────────────────────

renderHistory();

// Check if user name is set — shows welcome modal on first visit
checkUserName();