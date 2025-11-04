class DerivTrader {
  constructor() {
    this.ws = null;
    this.apiToken = "";
    this.accountBalance = 0;
    this.loginId = "";
    this.currency = "";
    this.tradeHistory = [];
    this.totalWins = 0;
    this.totalLosses = 0;
    this.isConnected = false;
    this.isBotRunning = false;
    this.currentPrice = 0;
    this.lastDigit = 0;
    this.activeContractId = null;
    this.digitHistory = [];
    this.isWaitingForResult = false;

    // Market selection
    this.selectedMarket = "1HZ100V"; // Changed from R_100
    this.selectedMarketDisplay = "Volatility 100 Index";

    // Dynamic pattern customization
    this.patternLength = 5; // Default pattern length
    this.customPattern = ["E", "E", "E", "O", "E"]; // Default pattern
    this.tradeType = "DIGITODD"; // Default trade type

    // Martingale settings
    this.martingaleEnabled = false;
    this.martingaleMultiplier = 2;
    this.martingaleMaxSteps = 5;
    this.martingaleCurrentStep = 0;
    this.baseStake = 0.35;
    this.currentStake = 0.35;

    // Consecutive wins tracking
    this.consecutiveWins = 0;
    this.isCooldown = false;
    this.cooldownEndTime = null;
    this.cooldownTimer = null;

    // Reconnect state
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 15000;
    this.shouldReconnect = true;

    this.initializeElements();
    this.attachEventListeners();
    this.updateMartingaleDisplay();
    this.generatePatternBoxes();
    this.initializeDefaultPattern();
  }

  initializeElements() {
    this.elements = {
      apiToken: document.getElementById("apiToken"),
      connectBtn: document.getElementById("connectBtn"),
      startBotBtn: document.getElementById("startBotBtn"),
      stopBotBtn: document.getElementById("stopBotBtn"),
      statusMessage: document.getElementById("statusMessage"),
      accountInfo: document.getElementById("accountInfo"),
      tradingSection: document.getElementById("tradingSection"),
      balance: document.getElementById("balance"),
      loginId: document.getElementById("loginId"),
      currency: document.getElementById("currency"),
      stakeAmount: document.getElementById("stakeAmount"),
      historyList: document.getElementById("historyList"),
      totalTrades: document.getElementById("totalTrades"),
      totalWins: document.getElementById("totalWins"),
      totalLosses: document.getElementById("totalLosses"),
      winRate: document.getElementById("winRate"),
      priceDigits: document.getElementById("priceDigits"),
      lastDigitLabel: document.getElementById("lastDigitLabel"),
      botStatus: document.getElementById("botStatus"),
      botStatusText: document.getElementById("botStatusText"),
      botInfo: document.getElementById("botInfo"),
      patternDisplay: document.getElementById("patternDisplay"),
      patternStatus: document.getElementById("patternStatus"),
      patternBoxes: document.getElementById("patternBoxes"),
      patternLength: document.getElementById("patternLength"),
      tradeType: document.getElementById("tradeType"),
      savePatternBtn: document.getElementById("savePatternBtn"),
      resetPatternBtn: document.getElementById("resetPatternBtn"),
      savedPatternDisplay: document.getElementById("savedPatternDisplay"),

      // Market elements
      marketSection: document.getElementById("marketSection"),
      patternSetup: document.getElementById("patternSetup"),
      marketSelect: document.getElementById("marketSelect"),
      selectedMarketDisplay: document.getElementById("selectedMarketDisplay"),

      // Martingale elements
      martingaleToggle: document.getElementById("martingaleToggle"),
      martingaleControls: document.getElementById("martingaleControls"),
      martingaleMultiplier: document.getElementById("martingaleMultiplier"),
      martingaleMaxSteps: document.getElementById("martingaleMaxSteps"),
      progressionList: document.getElementById("progressionList"),
      totalRisk: document.getElementById("totalRisk"),
      currentStakeValue: document.getElementById("currentStakeValue"),
      martingaleStepInfo: document.getElementById("martingaleStepInfo"),
    };
  }

  generatePatternBoxes() {
    // Clear existing boxes
    this.elements.patternBoxes.innerHTML = "";

    // Create boxes based on pattern length
    for (let i = 0; i < this.patternLength; i++) {
      const box = document.createElement("div");
      box.className = "pattern-select even";
      box.setAttribute("data-index", i);
      box.textContent = this.customPattern[i] || "E";

      // Set correct class based on value
      if (this.customPattern[i] === "O") {
        box.className = "pattern-select odd";
      }

      box.addEventListener("click", (e) => {
        const el = e.target;
        el.textContent = el.textContent === "E" ? "O" : "E";
        el.classList.toggle("even");
        el.classList.toggle("odd");
      });

      this.elements.patternBoxes.appendChild(box);
    }

    console.log(`Generated ${this.patternLength} pattern boxes`);
  }

  generateObservationBoxes() {
    // Clear existing observation boxes
    this.elements.patternDisplay.innerHTML = "";

    // Create observation boxes based on pattern length
    for (let i = 0; i < this.patternLength; i++) {
      const box = document.createElement("div");
      box.className = "digit-box empty";
      box.innerHTML = "<span>-</span><span>-</span>";
      this.elements.patternDisplay.appendChild(box);
    }

    console.log(`Generated ${this.patternLength} observation boxes`);
  }

  initializeDefaultPattern() {
    // Set the default pattern display on page load
    const tradeLabel = this.tradeType === "DIGITODD" ? "ODD" : "EVEN";
    this.elements.savedPatternDisplay.textContent = `Saved Pattern: ${this.customPattern.join(
      "-"
    )} | Trade: ${tradeLabel} | Length: ${this.patternLength}`;
  }

  attachEventListeners() {
    // Connection and bot controls
    this.elements.connectBtn.addEventListener("click", () => this.connect());
    this.elements.startBotBtn.addEventListener("click", () => this.startBot());
    this.elements.stopBotBtn.addEventListener("click", () => this.stopBot());

    // Pattern length change
    this.elements.patternLength.addEventListener("change", (e) => {
      this.changePatternLength(parseInt(e.target.value));
    });

    // Market selection
    this.elements.marketSelect.addEventListener("change", (e) => {
      this.changeMarket(e.target.value);
    });

    // Pattern customization
    this.elements.savePatternBtn.addEventListener("click", () =>
      this.savePattern()
    );
    this.elements.resetPatternBtn.addEventListener("click", () =>
      this.resetPattern()
    );

    // Martingale controls
    this.elements.martingaleToggle.addEventListener("change", (e) => {
      this.martingaleEnabled = e.target.checked;
      if (this.martingaleEnabled) {
        this.elements.martingaleControls.classList.remove(
          "martingale-disabled"
        );
      } else {
        this.elements.martingaleControls.classList.add("martingale-disabled");
      }
      this.updateMartingaleDisplay();
    });

    this.elements.stakeAmount.addEventListener("input", () => {
      this.baseStake = parseFloat(this.elements.stakeAmount.value) || 0.35;
      this.updateMartingaleDisplay();
    });

    this.elements.martingaleMultiplier.addEventListener("input", () => {
      this.martingaleMultiplier =
        parseFloat(this.elements.martingaleMultiplier.value) || 2;
      this.updateMartingaleDisplay();
    });

    this.elements.martingaleMaxSteps.addEventListener("input", () => {
      this.martingaleMaxSteps =
        parseInt(this.elements.martingaleMaxSteps.value) || 5;
      this.updateMartingaleDisplay();
    });
  }

  changePatternLength(newLength) {
    if (this.isBotRunning) {
      this.showStatus(
        "Please stop the bot before changing pattern length",
        "warning"
      );
      this.elements.patternLength.value = this.patternLength;
      return;
    }

    this.patternLength = newLength;

    // Adjust custom pattern array
    if (this.customPattern.length > newLength) {
      // Trim the pattern
      this.customPattern = this.customPattern.slice(0, newLength);
    } else if (this.customPattern.length < newLength) {
      // Extend the pattern with default "E"
      while (this.customPattern.length < newLength) {
        this.customPattern.push("E");
      }
    }

    // Regenerate boxes
    this.generatePatternBoxes();
    this.generateObservationBoxes();

    // Reset digit history
    this.digitHistory = [];
    this.updatePatternDisplay();

    this.showStatus(`Pattern length changed to ${newLength} digits`, "success");
    console.log(
      `Pattern length changed to ${newLength}. Pattern:`,
      this.customPattern
    );
  }

  startCooldown() {
    this.isCooldown = true;
    this.cooldownEndTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    this.showStatus("🎉 4 wins in a row! Taking 10-minute break...", "success");
    this.elements.botStatus.classList.remove("active");
    this.elements.botStatusText.textContent = "Cooldown - 4 Wins Streak";

    this.updateCooldownDisplay();

    // Update countdown every second
    this.cooldownTimer = setInterval(() => {
      this.updateCooldownDisplay();
    }, 1000);
  }

  updateCooldownDisplay() {
    if (!this.isCooldown) return;

    const timeLeft = this.cooldownEndTime - Date.now();

    if (timeLeft <= 0) {
      this.endCooldown();
      return;
    }

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    this.elements.botInfo.textContent = `⏱️ Cooldown: ${minutes}:${seconds
      .toString()
      .padStart(2, "0")} remaining | Consecutive wins reset after break`;
  }

  endCooldown() {
    this.isCooldown = false;
    this.cooldownEndTime = null;
    this.consecutiveWins = 0; // Reset consecutive wins after cooldown

    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }

    if (this.isBotRunning) {
      // Reset digit history and waiting state BEFORE resuming
      this.digitHistory = [];
      this.isWaitingForResult = false;
      this.updatePatternDisplay();

      this.elements.botStatus.classList.add("active");
      this.elements.botStatusText.textContent =
        "Bot Running - Observing Pattern";
      this.elements.botInfo.textContent =
        "Cooldown complete! Collecting new digits...";

      // Reset pattern status to waiting
      this.elements.patternStatus.className = "pattern-status waiting";
      this.elements.patternStatus.textContent = `Collecting digits... (0/${this.patternLength})`;

      this.showStatus(
        "✅ Cooldown complete! Resuming pattern observation...",
        "success"
      );

      console.log("Cooldown ended. Starting fresh pattern observation.");
    }
  }

  changeMarket(marketSymbol) {
    // Don't allow market change while bot is running
    if (this.isBotRunning) {
      this.showStatus("Please stop the bot before changing markets", "warning");
      this.elements.marketSelect.value = this.selectedMarket;
      return;
    }

    const selectedOption =
      this.elements.marketSelect.options[
        this.elements.marketSelect.selectedIndex
      ];
    const displayName =
      selectedOption.getAttribute("data-display") || selectedOption.textContent;

    this.selectedMarket = marketSymbol;
    this.selectedMarketDisplay = displayName;
    this.elements.selectedMarketDisplay.textContent = displayName;

    // If connected, resubscribe to the new market
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Unsubscribe from old market and subscribe to new one
      this.ws.send(
        JSON.stringify({
          forget_all: "ticks",
        })
      );

      setTimeout(() => {
        this.ws.send(
          JSON.stringify({
            ticks: this.selectedMarket,
            subscribe: 1,
          })
        );
        this.showStatus(`Switched to ${displayName}`, "success");
      }, 500);
    }

    // Reset digit history when changing markets
    this.digitHistory = [];
    this.updatePatternDisplay();
  }

  showStatus(message, type) {
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status show status-${type}`;
    setTimeout(() => {
      this.elements.statusMessage.classList.remove("show");
    }, 4000);
  }

  savePattern() {
    // Get current pattern from the boxes
    const boxes =
      this.elements.patternBoxes.querySelectorAll(".pattern-select");
    this.customPattern = Array.from(boxes).map((b) => b.textContent);

    // Validate pattern - make sure no boxes are empty
    if (this.customPattern.some((p) => p === "-" || p === "")) {
      this.showStatus(
        `Please set all ${this.patternLength} pattern boxes (click to toggle E/O)`,
        "error"
      );
      return;
    }

    // Validate pattern length matches
    if (this.customPattern.length !== this.patternLength) {
      this.showStatus(
        `Pattern length mismatch. Expected ${this.patternLength} digits.`,
        "error"
      );
      return;
    }

    this.tradeType = this.elements.tradeType.value;
    const tradeLabel = this.tradeType === "DIGITODD" ? "ODD" : "EVEN";
    this.elements.savedPatternDisplay.textContent = `Saved Pattern: ${this.customPattern.join(
      "-"
    )} | Trade: ${tradeLabel} | Length: ${this.patternLength}`;

    // Regenerate observation boxes to match pattern length
    this.generateObservationBoxes();

    this.showStatus(
      `✓ Pattern saved: ${this.customPattern.join("-")} (${
        this.patternLength
      } digits) | Trade: ${tradeLabel}`,
      "success"
    );

    console.log(
      "Pattern saved:",
      this.customPattern,
      "Length:",
      this.patternLength,
      "Trade type:",
      this.tradeType
    );
  }

  resetPattern() {
    // Reset to default pattern based on current length
    const defaultPattern = [];
    for (let i = 0; i < this.patternLength; i++) {
      // Create a simple pattern: mostly EVEN with one ODD in the middle
      if (i === Math.floor(this.patternLength / 2)) {
        defaultPattern.push("O");
      } else {
        defaultPattern.push("E");
      }
    }

    this.customPattern = defaultPattern;

    // Update the pattern boxes
    const boxes =
      this.elements.patternBoxes.querySelectorAll(".pattern-select");
    boxes.forEach((box, index) => {
      box.textContent = defaultPattern[index];
      if (defaultPattern[index] === "E") {
        box.className = "pattern-select even";
      } else {
        box.className = "pattern-select odd";
      }
    });

    // Reset trade type to default
    this.elements.tradeType.value = "DIGITODD";
    this.tradeType = "DIGITODD";

    const tradeLabel = "ODD";
    this.elements.savedPatternDisplay.textContent = `Saved Pattern: ${this.customPattern.join(
      "-"
    )} | Trade: ${tradeLabel} | Length: ${this.patternLength}`;

    this.showStatus(
      `Pattern reset to default (${defaultPattern.join("-")} | ODD)`,
      "warning"
    );
  }

  // Martingale calculation methods
  calculateStakeForStep(step) {
    return this.baseStake * Math.pow(this.martingaleMultiplier, step);
  }

  calculateTotalRisk() {
    let total = 0;
    for (let i = 0; i <= this.martingaleMaxSteps - 1; i++) {
      total += this.calculateStakeForStep(i);
    }
    return total;
  }

  updateMartingaleDisplay() {
    // Update current stake display
    this.currentStake = this.calculateStakeForStep(this.martingaleCurrentStep);
    this.elements.currentStakeValue.textContent = `${this.currentStake.toFixed(
      2
    )} ${this.currency || "USD"}`;

    if (this.martingaleEnabled) {
      this.elements.martingaleStepInfo.textContent = `Step ${
        this.martingaleCurrentStep + 1
      } of ${this.martingaleMaxSteps}`;
    } else {
      this.elements.martingaleStepInfo.textContent = `Martingale Disabled`;
    }

    // Update progression list
    this.elements.progressionList.innerHTML = "";
    for (let i = 0; i < this.martingaleMaxSteps; i++) {
      const stake = this.calculateStakeForStep(i);
      const item = document.createElement("div");
      item.className = "progression-item";
      if (i === this.martingaleCurrentStep && this.martingaleEnabled) {
        item.classList.add("current-step");
      }
      item.innerHTML = `
        <span class="progression-step">Step ${i + 1}:</span>
        <span class="progression-amount">${stake.toFixed(2)} ${
        this.currency || "USD"
      }</span>
      `;
      this.elements.progressionList.appendChild(item);
    }

    // Update total risk
    const totalRisk = this.calculateTotalRisk();
    this.elements.totalRisk.textContent = `${totalRisk.toFixed(2)} ${
      this.currency || "USD"
    }`;
  }

  resetMartingale() {
    this.martingaleCurrentStep = 0;
    this.updateMartingaleDisplay();
  }

  incrementMartingaleStep() {
    if (
      this.martingaleEnabled &&
      this.martingaleCurrentStep < this.martingaleMaxSteps - 1
    ) {
      this.martingaleCurrentStep++;
      this.updateMartingaleDisplay();
      this.showStatus(
        `Martingale Step ${
          this.martingaleCurrentStep + 1
        }: Stake increased to ${this.currentStake.toFixed(2)} ${this.currency}`,
        "warning"
      );
    } else if (
      this.martingaleEnabled &&
      this.martingaleCurrentStep >= this.martingaleMaxSteps - 1
    ) {
      this.showStatus(
        `Max Martingale steps reached! Resetting to base stake.`,
        "error"
      );
      this.resetMartingale();
    }
  }

  async connect() {
    this.apiToken = this.elements.apiToken.value.trim();
    if (!this.apiToken) {
      this.showStatus("Please enter your API token", "error");
      return;
    }

    this.elements.connectBtn.disabled = true;
    this.elements.connectBtn.innerHTML =
      'Connecting<span class="loading"></span>';

    try {
      this.ws = new WebSocket(
        "wss://ws.derivws.com/websockets/v3?app_id=67094"
      );

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.authorize();
      };

      this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
      this.ws.onerror = () =>
        this.showStatus("WebSocket error occurred", "error");
      this.ws.onclose = () => this.handleDisconnection();
    } catch (error) {
      this.showStatus("Connection failed: " + error.message, "error");
      this.handleDisconnection();
    }
  }

  handleDisconnection() {
    this.isConnected = false;
    if (this.ws) this.ws.close();
    this.ws = null;
    if (!this.shouldReconnect) return;

    this.showStatus("Connection lost, reconnecting...", "warning");
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  authorize() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ authorize: this.apiToken }));
  }

  handleMessage(data) {
    if (data.error) {
      this.showStatus("Error: " + data.error.message, "error");
      return;
    }

    switch (data.msg_type) {
      case "authorize":
        this.handleAuthorize(data);
        break;
      case "balance":
        this.updateBalance(data.balance);
        break;
      case "tick":
        this.updatePrice(data.tick);
        break;
      case "proposal":
        this.handleProposal(data);
        break;
      case "buy":
        this.handleBuyResponse(data);
        break;
      case "proposal_open_contract":
        this.handleContractUpdate(data);
        break;
      case "forget_all":
        console.log("Unsubscribed from previous market");
        break;
    }
  }

  handleAuthorize(data) {
    this.isConnected = true;
    this.loginId = data.authorize.loginid;
    this.currency = data.authorize.currency;
    this.accountBalance = data.authorize.balance;

    this.updateAccountDisplay();
    this.updateMartingaleDisplay();
    this.showStatus("Connected successfully!", "success");

    this.elements.connectBtn.textContent = "Connected";
    this.elements.accountInfo.classList.remove("hidden");
    this.elements.marketSection.classList.remove("hidden");
    this.elements.patternSetup.classList.remove("hidden");
    this.elements.tradingSection.classList.remove("hidden");

    this.ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
    this.ws.send(JSON.stringify({ ticks: this.selectedMarket, subscribe: 1 }));

    // Generate observation boxes on first connection
    this.generateObservationBoxes();

    console.log("Connected to market:", this.selectedMarket);
  }

  updateBalance(balance) {
    this.accountBalance = parseFloat(balance.balance);
    this.elements.balance.textContent = `${this.accountBalance.toFixed(2)} ${
      balance.currency
    }`;
  }

  updateAccountDisplay() {
    this.elements.loginId.textContent = this.loginId;
    this.elements.balance.textContent = `${this.accountBalance.toFixed(2)} ${
      this.currency
    }`;
    this.elements.currency.textContent = this.currency;
  }

  updatePrice(tick) {
    this.currentPrice = parseFloat(tick.quote);
    const priceStr = this.currentPrice.toFixed(2);
    const priceDigits = priceStr.replace(".", "");
    const lastChar = priceDigits.charAt(priceDigits.length - 1);
    this.lastDigit = parseInt(lastChar);

    const beforeLast = priceStr.substring(0, priceStr.length - 1);
    const lastDigitDisplay = priceStr.charAt(priceStr.length - 1);
    this.elements.priceDigits.innerHTML = `${beforeLast}<span class="last-digit">${lastDigitDisplay}</span>`;
    this.elements.lastDigitLabel.textContent = this.lastDigit;

    // Only add to history if bot is running, not waiting for result, and NOT in cooldown
    if (this.isBotRunning && !this.isWaitingForResult && !this.isCooldown) {
      this.addDigitToHistory(this.lastDigit);
    }
  }

  addDigitToHistory(digit) {
    this.digitHistory.push(digit);
    if (this.digitHistory.length > this.patternLength) {
      this.digitHistory.shift();
    }
    this.updatePatternDisplay();
    this.checkPattern();
  }

  updatePatternDisplay() {
    const boxes = this.elements.patternDisplay.children;
    for (let i = 0; i < this.patternLength; i++) {
      const box = boxes[i];
      if (!box) continue;

      const digitSpan = box.children[0];
      const typeSpan = box.children[1];

      if (i < this.digitHistory.length) {
        const digit = this.digitHistory[i];
        const isEven = digit % 2 === 0;
        digitSpan.textContent = digit;
        typeSpan.textContent = isEven ? "EVEN" : "ODD";
        box.className = isEven ? "digit-box even" : "digit-box odd";
      } else {
        digitSpan.textContent = "-";
        typeSpan.textContent = "-";
        box.className = "digit-box empty";
      }
    }
  }

  checkPattern() {
    if (this.digitHistory.length < this.patternLength) {
      this.elements.patternStatus.textContent = `Collecting digits... (${this.digitHistory.length}/${this.patternLength})`;
      return;
    }

    const patternStr = this.digitHistory
      .map((d) => (d % 2 === 0 ? "E" : "O"))
      .join("");
    const targetPattern = this.customPattern.join("");

    console.log("Checking pattern:", patternStr, "Target:", targetPattern);

    if (patternStr === targetPattern) {
      this.elements.patternStatus.className = "pattern-status matched";
      const tradeLabel = this.tradeType === "DIGITODD" ? "ODD" : "EVEN";
      this.elements.patternStatus.textContent = `✓ Pattern ${targetPattern} matched! Executing ${tradeLabel} trade...`;
      this.showStatus(
        `Pattern ${targetPattern} detected! Executing ${tradeLabel} trade...`,
        "success"
      );
      this.executeTrade();
    } else {
      this.elements.patternStatus.className = "pattern-status waiting";
      this.elements.patternStatus.textContent = `Current: ${patternStr} | Waiting for: ${targetPattern}`;
    }
  }

  startBot() {
    if (!this.isConnected) {
      this.showStatus("Please connect first", "error");
      return;
    }

    if (this.customPattern.length !== this.patternLength) {
      this.showStatus(
        `Please save a valid ${this.patternLength}-digit pattern first`,
        "error"
      );
      return;
    }

    // Check if pattern contains invalid values
    if (this.customPattern.some((p) => p === "-" || p === "")) {
      this.showStatus("Please save a valid pattern (no empty boxes)", "error");
      return;
    }

    const stake = parseFloat(this.elements.stakeAmount.value);
    if (isNaN(stake) || stake < 0.35) {
      this.showStatus("Minimum stake is 0.35 USD", "error");
      return;
    }

    // Initialize base stake and reset martingale
    this.baseStake = stake;
    this.resetMartingale();
    this.consecutiveWins = 0;

    this.isBotRunning = true;
    this.digitHistory = [];
    this.isWaitingForResult = false;

    this.elements.startBotBtn.disabled = true;
    this.elements.stopBotBtn.disabled = false;
    this.elements.stakeAmount.disabled = true;
    this.elements.martingaleToggle.disabled = true;
    this.elements.martingaleMultiplier.disabled = true;
    this.elements.martingaleMaxSteps.disabled = true;
    this.elements.marketSelect.disabled = true;
    this.elements.patternLength.disabled = true;

    this.elements.botStatus.classList.add("active");
    this.elements.botStatusText.textContent = "Bot Running - Observing Pattern";

    let botInfoText = `Observing pattern: ${this.customPattern.join("-")} (${
      this.patternLength
    } digits) on ${this.selectedMarketDisplay}`;
    if (this.martingaleEnabled) {
      botInfoText += ` | Martingale: ON (${this.martingaleMultiplier}x, ${this.martingaleMaxSteps} steps)`;
    }
    this.elements.botInfo.textContent = botInfoText;

    this.showStatus(
      `Trading bot started on ${this.selectedMarketDisplay}`,
      "success"
    );
    console.log(
      "Bot started with pattern:",
      this.customPattern,
      "Length:",
      this.patternLength,
      "Trade type:",
      this.tradeType
    );
  }

  stopBot() {
    this.isBotRunning = false;
    this.digitHistory = [];
    this.isWaitingForResult = false;
    this.resetMartingale();
    this.consecutiveWins = 0;

    // Clear cooldown if active
    if (this.isCooldown) {
      this.isCooldown = false;
      if (this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }

    this.elements.startBotBtn.disabled = false;
    this.elements.stopBotBtn.disabled = true;
    this.elements.stakeAmount.disabled = false;
    this.elements.martingaleToggle.disabled = false;
    this.elements.martingaleMultiplier.disabled = false;
    this.elements.martingaleMaxSteps.disabled = false;
    this.elements.marketSelect.disabled = false;
    this.elements.patternLength.disabled = false;

    this.elements.botStatus.classList.remove("active");
    this.elements.botStatusText.textContent = "Bot Stopped";
    this.elements.botInfo.textContent =
      "Start the bot to begin pattern observation";

    this.elements.patternStatus.className = "pattern-status waiting";
    this.elements.patternStatus.textContent = `Waiting for pattern: ${this.customPattern.join(
      "-"
    )}`;

    this.showStatus("Trading bot stopped", "warning");
  }

  async executeTrade() {
    if (
      !this.isBotRunning ||
      !this.isConnected ||
      this.isWaitingForResult ||
      this.isCooldown
    )
      return;

    console.log("Executing trade - Current state:", {
      isBotRunning: this.isBotRunning,
      isWaitingForResult: this.isWaitingForResult,
      isCooldown: this.isCooldown,
      consecutiveWins: this.consecutiveWins,
    });

    this.isWaitingForResult = true;

    // Use current stake based on martingale step
    const stake = this.currentStake;

    const proposalRequest = {
      proposal: 1,
      amount: stake,
      basis: "stake",
      contract_type: this.tradeType,
      symbol: this.selectedMarket,
      duration: 1,
      duration_unit: "t",
      currency: this.currency,
      product_type: "basic",
    };

    console.log("Executing trade:", proposalRequest);
    this.ws.send(JSON.stringify(proposalRequest));
    this.elements.botInfo.textContent = `Requesting trade proposal on ${
      this.selectedMarketDisplay
    }... (Stake: ${stake.toFixed(2)} ${this.currency})`;

    // Safety timeout: If no response in 30 seconds, reset state
    setTimeout(() => {
      if (this.isWaitingForResult && this.isBotRunning && !this.isCooldown) {
        console.warn("Trade timeout - resetting state");
        this.isWaitingForResult = false;
        this.digitHistory = [];
        this.activeContractId = null;
        this.updatePatternDisplay();
        this.elements.patternStatus.className = "pattern-status waiting";
        this.elements.patternStatus.textContent = `Collecting digits... (0/${this.patternLength})`;
        this.showStatus("Trade timeout - restarting observation", "warning");
      }
    }, 30000);
  }

  handleProposal(data) {
    if (!data.proposal) return;
    const proposal = data.proposal;
    const buyRequest = {
      buy: proposal.id,
      price: parseFloat(proposal.ask_price),
    };
    this.ws.send(JSON.stringify(buyRequest));
    this.elements.botInfo.textContent = "Trade executed, waiting for result...";
    console.log("Trade proposal accepted, buying contract...");
  }

  handleBuyResponse(data) {
    if (data.buy) {
      this.activeContractId = data.buy.contract_id;
      this.ws.send(
        JSON.stringify({
          proposal_open_contract: 1,
          contract_id: this.activeContractId,
          subscribe: 1,
        })
      );
      console.log("Contract purchased, ID:", this.activeContractId);
    }
  }

  handleContractUpdate(data) {
    const contract = data.proposal_open_contract;

    // Only process if contract is sold and matches our active contract
    if (!contract.is_sold || contract.contract_id !== this.activeContractId) {
      return;
    }

    const profit = parseFloat(contract.profit);
    const isWin = profit > 0;

    console.log("Contract result received:", {
      contractId: contract.contract_id,
      isWin,
      profit,
      consecutiveWins: this.consecutiveWins,
    });

    const tradeResult = {
      time: new Date().toLocaleTimeString(),
      stake: contract.buy_price,
      profit,
      isWin,
      contractId: contract.contract_id,
      pattern: this.digitHistory.map((d) => (d % 2 === 0 ? "E" : "O")).join(""),
      patternLength: this.patternLength,
      martingaleStep: this.martingaleCurrentStep + 1,
      martingaleEnabled: this.martingaleEnabled,
      market: this.selectedMarketDisplay,
    };

    this.addTradeToHistory(tradeResult);

    if (isWin) {
      this.totalWins++;
      this.consecutiveWins++;

      console.log("Win! Consecutive wins:", this.consecutiveWins);

      // Reset martingale on win
      if (this.martingaleEnabled) {
        this.showStatus(
          `Win! +${profit.toFixed(2)} ${
            this.currency
          } | Martingale reset | Streak: ${this.consecutiveWins}`,
          "success"
        );
        this.resetMartingale();
      } else {
        this.showStatus(
          `Win! +${profit.toFixed(2)} ${this.currency} | Win streak: ${
            this.consecutiveWins
          }`,
          "success"
        );
      }

      // Check if we hit 4 consecutive wins
      if (this.consecutiveWins >= 4) {
        console.log("4 consecutive wins! Starting cooldown...");
        setTimeout(() => {
          if (this.isBotRunning) {
            this.startCooldown();
          }
        }, 2000);
      }
    } else {
      this.totalLosses++;
      console.log(
        "Loss! Resetting consecutive wins from",
        this.consecutiveWins,
        "to 0"
      );
      this.consecutiveWins = 0;

      // Increment martingale on loss
      if (this.martingaleEnabled) {
        this.incrementMartingaleStep();
        this.showStatus(
          `Loss ${profit.toFixed(2)} ${
            this.currency
          } | Next stake: ${this.currentStake.toFixed(2)} | Streak reset`,
          "error"
        );
      } else {
        this.showStatus(
          `Loss ${profit.toFixed(2)} ${this.currency} | Win streak reset`,
          "error"
        );
      }
    }

    this.updateStats();

    console.log(
      "Trade completed:",
      isWin ? "WIN" : "LOSS",
      "Profit:",
      profit,
      "Consecutive wins:",
      this.consecutiveWins
    );

    // CRITICAL: Always reset states after trade completes
    setTimeout(() => {
      if (this.isBotRunning && !this.isCooldown) {
        console.log("Resetting states for next trade...");
        this.isWaitingForResult = false;
        this.digitHistory = [];
        this.activeContractId = null;
        this.updatePatternDisplay();

        // Reset pattern status
        this.elements.patternStatus.className = "pattern-status waiting";
        this.elements.patternStatus.textContent = `Collecting digits... (0/${this.patternLength})`;

        this.elements.botInfo.textContent = `Ready to observe next pattern | Current stake: ${this.currentStake.toFixed(
          2
        )} ${this.currency} | Win streak: ${this.consecutiveWins}`;
      }
    }, 2000);
  }

  addTradeToHistory(trade) {
    this.tradeHistory.unshift(trade);
    this.renderHistory();
  }

  renderHistory() {
    if (this.tradeHistory.length === 0) {
      this.elements.historyList.innerHTML =
        '<p style="text-align:center; color:#aaa;">No trades yet</p>';
      return;
    }

    this.elements.historyList.innerHTML = this.tradeHistory
      .map(
        (trade) => `
            <div class="history-item ${trade.isWin ? "win" : "loss"}">
                <div>
                    <div class="history-time">${trade.time}</div>
                    <div>Market: ${trade.market}</div>
                    <div>Stake: ${trade.stake.toFixed(2)} ${this.currency}</div>
                    <div>Pattern: ${trade.pattern} (${
          trade.patternLength
        } digits)</div>
                    ${
                      trade.martingaleEnabled
                        ? `<div style="font-size: 11px; opacity: 0.8;">Martingale Step: ${trade.martingaleStep}</div>`
                        : ""
                    }
                </div>
                <div class="history-result">${
                  trade.isWin ? "+" : ""
                }${trade.profit.toFixed(2)} ${this.currency}</div>
            </div>
        `
      )
      .join("");
  }

  updateStats() {
    const total = this.tradeHistory.length;
    const winRate = total ? ((this.totalWins / total) * 100).toFixed(1) : 0;
    this.elements.totalTrades.textContent = total;
    this.elements.totalWins.textContent = this.totalWins;
    this.elements.totalLosses.textContent = this.totalLosses;
    this.elements.winRate.textContent = `${winRate}%`;
  }
}

// Initialize the trader
const trader = new DerivTrader();
