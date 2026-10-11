(() => {
  "use strict";

  const STORAGE_KEY = "thiruFnoPaperTradingV1";
  const INITIAL_CAPITAL = 100000;
  const $ = (selector) => document.querySelector(selector);
  const money = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(Number(value) || 0);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  let state = loadState();
  let editingId = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.positions) && Array.isArray(saved.closedTrades)) return saved;
    } catch (error) {
      console.warn("Could not load saved paper trades:", error);
    }
    return { positions: [], closedTrades: [] };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      showMessage("Your browser could not save this session. Keep a separate record of your trades.", true);
    }
  }

  function pnl(position) {
    const difference = Number(position.ltp) - Number(position.entry);
    return (position.side === "BUY" ? difference : -difference) * Number(position.quantity);
  }

  function setPnlTone(element, value) {
    element.classList.toggle("positive", value > 0);
    element.classList.toggle("negative", value < 0);
  }

  function showMessage(message, isError = false) {
    const element = $("#formMessage");
    element.textContent = message;
    element.classList.toggle("error", isError);
  }

  function render() {
    const unrealized = state.positions.reduce((sum, position) => sum + pnl(position), 0);
    const realized = state.closedTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    $("#virtualCapital").textContent = money(INITIAL_CAPITAL);
    $("#openCount").textContent = String(state.positions.length);
    $("#unrealizedPnl").textContent = money(unrealized);
    $("#realizedPnl").textContent = money(realized);
    $("#totalPnl").textContent = money(unrealized + realized);
    setPnlTone($("#unrealizedPnl"), unrealized);
    setPnlTone($("#realizedPnl"), realized);
    setPnlTone($("#totalPnl"), unrealized + realized);

    $("#emptyState").hidden = state.positions.length > 0;
    $("#positionsTableWrap").hidden = state.positions.length === 0;
    $("#positionsBody").innerHTML = state.positions.map((position) => {
      const result = pnl(position);
      const contract = `${escapeHtml(position.underlying)} ${escapeHtml(position.strike)} ${escapeHtml(position.optionType)}`;
      const expiry = position.expiry ? new Date(position.expiry + "T00:00:00").toLocaleDateString("en-IN") : "No expiry";
      return `<tr>
        <td><strong>${contract}</strong><small class="table-subtext">Expiry: ${escapeHtml(expiry)}</small></td>
        <td><span class="side-tag ${position.side.toLowerCase()}">${position.side}</span></td>
        <td>${Number(position.quantity)}</td>
        <td>${money(position.entry)}</td>
        <td>${money(position.ltp)}</td>
        <td class="pnl-cell ${result > 0 ? "positive" : result < 0 ? "negative" : ""}">${money(result)}</td>
        <td><div class="row-actions"><button class="small-button" type="button" data-update="${position.id}">Update</button><button class="small-button close-trade" type="button" data-close="${position.id}">Close</button></div></td>
      </tr>`;
    }).join("");
  }

  $("#tradeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry = Number(form.get("entryPrice"));
    const ltp = Number(form.get("ltp"));
    const strike = Number(form.get("strike"));
    const quantity = Number(form.get("quantity"));
    if (![entry, ltp, strike, quantity].every(Number.isFinite) || entry < 0 || ltp < 0 || strike <= 0 || quantity < 1 || !Number.isInteger(quantity)) {
      showMessage("Enter valid positive strike and quantity, and non-negative premiums.", true);
      return;
    }
    const position = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      underlying: form.get("underlying"),
      optionType: form.get("optionType"),
      side: form.get("side"),
      expiry: form.get("expiry"),
      strike,
      quantity,
      entry,
      ltp,
      openedAt: new Date().toISOString()
    };
    state.positions.unshift(position);
    saveState();
    render();
    event.currentTarget.reset();
    $("#quantity").value = "1";
    showMessage("Paper position added. No real order was placed.");
  });

  $("#positionsBody").addEventListener("click", (event) => {
    const updateButton = event.target.closest("[data-update]");
    const closeButton = event.target.closest("[data-close]");
    if (updateButton) {
      const position = state.positions.find((item) => item.id === updateButton.dataset.update);
      if (!position) return;
      editingId = position.id;
      $("#editingPositionId").value = position.id;
      $("#newLtp").value = position.ltp;
      $("#priceDialog").showModal();
      $("#newLtp").focus();
    }
    if (closeButton) {
      const position = state.positions.find((item) => item.id === closeButton.dataset.close);
      if (!position) return;
      if (!window.confirm("Close this paper position and record its simulated P&L?")) return;
      state.closedTrades.unshift({ ...position, pnl: pnl(position), closedAt: new Date().toISOString() });
      state.positions = state.positions.filter((item) => item.id !== position.id);
      saveState();
      render();
      showMessage("Paper position closed and P&L recorded.");
    }
  });

  $("#priceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const latest = Number($("#newLtp").value);
    if (!Number.isFinite(latest) || latest < 0) return;
    const position = state.positions.find((item) => item.id === editingId);
    if (position) {
      position.ltp = latest;
      saveState();
      render();
      showMessage("Premium updated. P&L recalculated.");
    }
    $("#priceDialog").close();
    editingId = null;
  });

  function closePriceDialog() {
    $("#priceDialog").close();
    editingId = null;
  }
  $("#cancelPrice").addEventListener("click", closePriceDialog);
  $("#cancelPrice2").addEventListener("click", closePriceDialog);

  $("#resetButton").addEventListener("click", () => {
    if (!window.confirm("Reset all open and closed paper trades on this browser? This cannot be undone.")) return;
    state = { positions: [], closedTrades: [] };
    saveState();
    render();
    showMessage("Simulator reset. Your virtual starting capital remains ₹1,00,000.");
  });

  // Default expiry is a convenience only; verify the actual contract expiry yourself.
  const expiryInput = $("#expiry");
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  expiryInput.value = localDate;
  expiryInput.min = localDate;
  render();
})();