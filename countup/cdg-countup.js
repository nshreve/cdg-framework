class CountUp {
  constructor(target, endVal, options = {}) {
    this.endVal = endVal;
    this.options = options;
    this.version = "2.9.0";
    
    // Default configuration
    this.defaults = {
      startVal: 0,
      decimalPlaces: 0,
      duration: 2,
      useEasing: true,
      useGrouping: true,
      useIndianSeparators: false,
      smartEasingThreshold: 999,
      smartEasingAmount: 333,
      separator: ",",
      decimal: ".",
      prefix: "",
      suffix: "",
      enableScrollSpy: false,
      scrollSpyDelay: 200,
      scrollSpyOnce: false
    };
    
    // Merge options with defaults
    this.options = { ...this.defaults, ...options };
    
    // Initialize properties
    this.finalEndVal = null;
    this.useEasing = true;
    this.countDown = false;
    this.error = "";
    this.startVal = 0;
    this.paused = true;
    this.once = false;
    
    // Get target element
    this.el = typeof target === 'string' ? document.getElementById(target) : target;
    
    // Parse end value if needed
    if (endVal === null || endVal === undefined) {
      endVal = this.parseValue(this.el.innerHTML);
    }
    
    // Validate and set values
    this.startVal = this.validateValue(this.options.startVal);
    this.frameVal = this.startVal;
    this.endVal = this.validateValue(endVal);
    
    // Setup formatting and easing functions
    this.formattingFn = this.options.formattingFn || this.formatNumber.bind(this);
    this.easingFn = this.options.easingFn || this.easeOutExpo.bind(this);
    
    // Initialize
    this.resetDuration();
    this.useEasing = this.options.useEasing;
    
    if (this.options.separator === "") {
      this.options.useGrouping = false;
    }
    
    if (this.el) {
      this.printValue(this.startVal);
    } else {
      this.error = "[CountUp] target is null or undefined";
    }
    
    // Setup scroll spy if enabled
    if (typeof window !== 'undefined' && this.options.enableScrollSpy) {
      this.setupScrollSpy();
    }
  }
  
  // Main animation loop
  count = (timestamp) => {
    if (!this.startTime) {
      this.startTime = timestamp;
    }
    
    const progress = timestamp - this.startTime;
    this.remaining = this.duration - progress;
    
    // Calculate current frame value
    if (this.useEasing) {
      if (this.countDown) {
        this.frameVal = this.startVal - this.easingFn(
          progress, 0, this.startVal - this.endVal, this.duration
        );
      } else {
        this.frameVal = this.easingFn(
          progress, this.startVal, this.endVal - this.startVal, this.duration
        );
      }
    } else {
      this.frameVal = this.startVal + (this.endVal - this.startVal) * (progress / this.duration);
    }
    
    // Check if we've reached the end
    const isComplete = this.countDown ? this.frameVal < this.endVal : this.frameVal > this.endVal;
    this.frameVal = isComplete ? this.endVal : this.frameVal;
    
    // Round to specified decimal places
    this.frameVal = Number(this.frameVal.toFixed(this.options.decimalPlaces));
    
    // Update display
    this.printValue(this.frameVal);
    
    // Continue animation or complete
    if (progress < this.duration) {
      this.rAF = requestAnimationFrame(this.count);
    } else if (this.finalEndVal !== null) {
      this.update(this.finalEndVal);
    } else if (this.options.onCompleteCallback) {
      this.options.onCompleteCallback();
    }
  }
  
  // Format number with separators, decimals, prefix, suffix
  formatNumber(num) {
    const isNegative = num < 0;
    const sign = isNegative ? "-" : "";
    
    let numStr = Math.abs(num).toFixed(this.options.decimalPlaces);
    let [integerPart, decimalPart] = numStr.split(".");
    
    decimalPart = decimalPart ? this.options.decimal + decimalPart : "";
    
    // Add grouping separators
    if (this.options.useGrouping) {
      let formattedInteger = "";
      let groupSize = 3;
      let groupCount = 0;
      
      for (let i = 0; i < integerPart.length; i++) {
        if (this.options.useIndianSeparators && i === 4) {
          groupSize = 2;
          groupCount = 1;
        }
        
        if (i !== 0 && groupCount % groupSize === 0) {
          formattedInteger = this.options.separator + formattedInteger;
        }
        
        groupCount++;
        formattedInteger = integerPart[integerPart.length - i - 1] + formattedInteger;
      }
      
      integerPart = formattedInteger;
    }
    
    // Apply custom numerals if provided
    if (this.options.numerals && this.options.numerals.length) {
      integerPart = integerPart.replace(/[0-9]/g, (digit) => this.options.numerals[+digit]);
      decimalPart = decimalPart.replace(/[0-9]/g, (digit) => this.options.numerals[+digit]);
    }
    
    return sign + this.options.prefix + integerPart + decimalPart + this.options.suffix;
  }
  
  // Easing function (ease-out exponential)
  easeOutExpo(t, b, c, d) {
    return c * (1 - Math.pow(2, -10 * t / d)) * 1024 / 1023 + b;
  }
  
  // Public methods
  start(callback) {
    if (this.error) return;
    
    if (this.options.onStartCallback) {
      this.options.onStartCallback();
    }
    
    if (callback) {
      this.options.onCompleteCallback = callback;
    }
    
    if (this.duration > 0) {
      this.determineDirectionAndSmartEasing();
      this.paused = false;
      this.rAF = requestAnimationFrame(this.count);
    } else {
      this.printValue(this.endVal);
    }
  }
  
  pauseResume() {
    if (this.paused) {
      this.startTime = null;
      this.duration = this.remaining;
      this.startVal = this.frameVal;
      this.determineDirectionAndSmartEasing();
      this.rAF = requestAnimationFrame(this.count);
    } else {
      cancelAnimationFrame(this.rAF);
    }
    this.paused = !this.paused;
  }
  
  reset() {
    cancelAnimationFrame(this.rAF);
    this.paused = true;
    this.resetDuration();
    this.startVal = this.validateValue(this.options.startVal);
    this.frameVal = this.startVal;
    this.printValue(this.startVal);
  }
  
  update(newEndVal) {
    cancelAnimationFrame(this.rAF);
    this.startTime = null;
    this.endVal = this.validateValue(newEndVal);
    
    if (this.endVal !== this.frameVal) {
      this.startVal = this.frameVal;
      if (this.finalEndVal === null) {
        this.resetDuration();
      }
      this.finalEndVal = null;
      this.determineDirectionAndSmartEasing();
      this.rAF = requestAnimationFrame(this.count);
    }
  }
  
  // Helper methods
  determineDirectionAndSmartEasing() {
    const endVal = this.finalEndVal ? this.finalEndVal : this.endVal;
    this.countDown = this.startVal > endVal;
    
    const diff = endVal - this.startVal;
    
    if (Math.abs(diff) > this.options.smartEasingThreshold && this.options.useEasing) {
      this.finalEndVal = endVal;
      const direction = this.countDown ? 1 : -1;
      this.endVal = endVal + direction * this.options.smartEasingAmount;
      this.duration = this.duration / 2;
    } else {
      this.endVal = endVal;
      this.finalEndVal = null;
    }
    
    if (this.finalEndVal !== null) {
      this.useEasing = false;
    } else {
      this.useEasing = this.options.useEasing;
    }
  }
  
  printValue(value) {
    if (this.el) {
      const formattedValue = this.formattingFn(value);
      
      if (this.options.plugin?.render) {
        this.options.plugin.render(this.el, formattedValue);
      } else if (this.el.tagName === "INPUT") {
        this.el.value = formattedValue;
      } else if (this.el.tagName === "text" || this.el.tagName === "tspan") {
        this.el.textContent = formattedValue;
      } else {
        this.el.innerHTML = formattedValue;
      }
    }
  }
  
  validateValue(value) {
    const num = Number(value);
    if (typeof num === 'number' && !isNaN(num)) {
      return num;
    }
    this.error = `[CountUp] invalid start or end value: ${value}`;
    return null;
  }
  
  resetDuration() {
    this.startTime = null;
    this.duration = Number(this.options.duration) * 1000;
    this.remaining = this.duration;
  }
  
  parseValue(value) {
    const escapedSeparator = this.options.separator.replace(/([.,'  ])/g, "\\$1");
    const escapedDecimal = this.options.decimal.replace(/([.,'  ])/g, "\\$1");
    
    const cleanValue = value
      .replace(new RegExp(escapedSeparator, "g"), "")
      .replace(new RegExp(escapedDecimal, "g"), ".");
    
    return parseFloat(cleanValue);
  }
  
  setupScrollSpy() {
    if (this.error) {
      console.error(this.error);
      return;
    }
    
    window.onScrollFns = window.onScrollFns || [];
    window.onScrollFns.push(() => this.handleScroll());
    
    window.onscroll = () => {
      window.onScrollFns.forEach(fn => fn());
    };
    
    this.handleScroll();
  }
  
  handleScroll() {
    if (!this.once && window) {
      const windowBottom = window.innerHeight + window.scrollY;
      const rect = this.el.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const elementBottom = rect.top + rect.height + window.pageYOffset;
      
      if (elementBottom < windowBottom && elementBottom > window.scrollY && this.paused) {
        this.paused = false;
        setTimeout(() => this.start(), this.options.scrollSpyDelay);
        if (this.options.scrollSpyOnce) {
          this.once = true;
        }
      } else if ((window.scrollY > elementBottom || elementTop > windowBottom) && !this.paused) {
        this.reset();
      }
    }
  }
}

// CUSTOM AUTO-INITIALIZATION SYSTEM
class CountUpAutoInit {
  constructor() {
    this.counters = new Map();
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.scanAndInitialize());
    } else {
      this.scanAndInitialize();
    }
    
    // Also scan for dynamically added elements
    this.observeChanges();
  }
  
  scanAndInitialize() {
    const elements = document.querySelectorAll('[data-cdg-countup]');
    
    elements.forEach(element => {
      if (!this.counters.has(element)) {
        this.initializeElement(element);
      }
    });
  }
  
  initializeElement(element) {
    try {
      // Get the target number from the element's content or data attribute
      const targetValue = this.getTargetValue(element);
      
      // Get custom start value or default to 0
      const startValue = this.getStartValue(element);
      
      // Get configuration from data attributes
      const config = this.getConfigFromAttributes(element);
      
      // Set the start value in config
      config.startVal = startValue;
      
      // Create and store the counter
      const counter = new CountUp(element, targetValue, config);
      this.counters.set(element, counter);
      
      // Start the animation
      counter.start();
      
      console.log(`CountUp initialized for element with target: ${targetValue}, start: ${startValue}`);
      
    } catch (error) {
      console.error('Error initializing CountUp for element:', element, error);
    }
  }
  
  getTargetValue(element) {
    // First, check if there's a data-cdg-countup attribute with a value
    const dataValue = element.getAttribute('data-cdg-countup');
    if (dataValue && dataValue !== '' && !isNaN(parseFloat(dataValue))) {
      return parseFloat(dataValue);
    }
    
    // Otherwise, parse the element's text content
    const textContent = element.textContent.trim();
    if (textContent && !isNaN(parseFloat(textContent))) {
      return parseFloat(textContent);
    }
    
    // Default fallback
    return 100;
  }
  
  getStartValue(element) {
    const startAttr = element.getAttribute('data-cdg-countup-start');
    if (startAttr !== null && !isNaN(parseFloat(startAttr))) {
      return parseFloat(startAttr);
    }
    return 0; // Always default to 0 as requested
  }
  
  getConfigFromAttributes(element) {
    const config = {};
    
    // Duration
    const duration = element.getAttribute('data-cdg-countup-duration');
    if (duration && !isNaN(parseFloat(duration))) {
      config.duration = parseFloat(duration);
    }
    
    // Decimal places
    const decimals = element.getAttribute('data-cdg-countup-decimals');
    if (decimals && !isNaN(parseInt(decimals))) {
      config.decimalPlaces = parseInt(decimals);
    }
    
    // Prefix
    const prefix = element.getAttribute('data-cdg-countup-prefix');
    if (prefix !== null) {
      config.prefix = prefix;
    }
    
    // Suffix
    const suffix = element.getAttribute('data-cdg-countup-suffix');
    if (suffix !== null) {
      config.suffix = suffix;
    }
    
    // Separator
    const separator = element.getAttribute('data-cdg-countup-separator');
    if (separator !== null) {
      config.separator = separator;
    }
    
    // Decimal separator
    const decimal = element.getAttribute('data-cdg-countup-decimal');
    if (decimal !== null) {
      config.decimal = decimal;
    }
    
    // Easing
    const useEasing = element.getAttribute('data-cdg-countup-easing');
    if (useEasing !== null) {
      config.useEasing = useEasing !== 'false';
    }
    
    // Grouping
    const useGrouping = element.getAttribute('data-cdg-countup-grouping');
    if (useGrouping !== null) {
      config.useGrouping = useGrouping !== 'false';
    }
    
    // Scroll spy
    const scrollSpy = element.getAttribute('data-cdg-countup-scroll');
    if (scrollSpy !== null) {
      config.enableScrollSpy = scrollSpy !== 'false';
      config.scrollSpyOnce = true; // Default to once for auto-init
    }
    
    return config;
  }
  
  observeChanges() {
    // Use MutationObserver to watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node itself has the attribute
            if (node.hasAttribute && node.hasAttribute('data-cdg-countup')) {
              this.initializeElement(node);
            }
            
            // Check if any children have the attribute
            const childElements = node.querySelectorAll ? node.querySelectorAll('[data-cdg-countup]') : [];
            childElements.forEach(child => {
              if (!this.counters.has(child)) {
                this.initializeElement(child);
              }
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Public methods for manual control
  getCounter(element) {
    return this.counters.get(element);
  }
  
  resetCounter(element) {
    const counter = this.counters.get(element);
    if (counter) {
      counter.reset();
    }
  }
  
  startCounter(element) {
    const counter = this.counters.get(element);
    if (counter) {
      counter.start();
    }
  }
  
  pauseCounter(element) {
    const counter = this.counters.get(element);
    if (counter) {
      counter.pauseResume();
    }
  }
}

// Auto-initialize when script loads
const countUpAutoInit = new CountUpAutoInit();

// Make it available globally for manual access
window.CountUpAutoInit = countUpAutoInit;
window.CountUp = CountUp;
