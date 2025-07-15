class CDGTextSplit {
  constructor(selector, options = {}) {
    this.version = "1.0.0";
    this.elements = this._selectElements(selector);
    this.chars = [];
    this.words = [];
    this.lines = [];
    this.masks = [];
    this.isSplit = false;
    
    // Default options
    this.options = {
      type: 'chars,words,lines',
      charsClass: 'char',
      wordsClass: 'word',
      linesClass: 'line',
      tag: 'div',
      aria: 'auto',
      propIndex: false,
      smartWrap: true,
      reduceWhiteSpace: true,
      wordDelimiter: ' ',
      specialChars: null,
      deepSlice: true,
      autoSplit: false,
      prepareText: null,
      onSplit: null,
      onRevert: null,
      ignore: null,
      mask: null,
      ...options
    };

    // Internal state
    this._originalData = [];
    this._resizeObserver = null;
    this._resizeTimeout = null;
    this._isDestroyed = false;
    
    // Feature detection
    this._hasIntlSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter;
    this._hasResizeObserver = typeof ResizeObserver !== 'undefined';
    
    // Unicode/Emoji regex for fallback
    this._emojiRegex = /\p{RI}\p{RI}|\p{Emoji}(\p{EMod}|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?(\u{200D}\p{Emoji}(\p{EMod}|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?)*|./gu;
    
    this._init();
  }

  // Element Selection
  _selectElements(selector) {
    try {
      if (typeof selector === 'string') {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).filter(el => el instanceof HTMLElement);
      } else if (selector && 'length' in selector) {
        return Array.from(selector).filter(el => el instanceof HTMLElement);
      } else if (selector instanceof HTMLElement) {
        return [selector];
      }
      return [];
    } catch (error) {
      console.warn('CDGTextSplit: Invalid selector provided', error);
      return [];
    }
  }

  _init() {
    if (this.elements.length === 0) {
      console.warn('CDGTextSplit: No valid elements found');
      return;
    }

    // Store original data
    this.elements.forEach((element, index) => {
      this._originalData[index] = {
        element,
        html: element.innerHTML,
        ariaLabel: element.getAttribute('aria-label'),
        ariaHidden: element.getAttribute('aria-hidden'),
        width: element.offsetWidth
      };
    });

    // Setup resize observer for auto-split
    if (this.options.autoSplit && this._hasResizeObserver) {
      this._setupResizeObserver();
    }

    // Check font loading
    this._checkFontLoading();
  }

  // Font Loading Check
  _checkFontLoading() {
    if (document.fonts) {
      if (document.fonts.status === 'loading') {
        console.warn('CDGTextSplit: Called before fonts loaded. Consider waiting for font loading completion.');
        if (this.options.autoSplit) {
          document.fonts.addEventListener('loadingdone', () => {
            this._handleAutoSplit();
          });
        }
      }
    }
  }

  // Performance & Responsiveness
  _setupResizeObserver() {
    if (!this._hasResizeObserver) return;

    this._resizeObserver = new ResizeObserver(() => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        this._handleResize();
      }, 200);
    });

    this.elements.forEach(element => {
      this._resizeObserver.observe(element);
    });
  }

  _handleResize() {
    if (this._isDestroyed || !this.isSplit) return;

    let needsReSplit = false;
    this.elements.forEach((element, index) => {
      const currentWidth = element.offsetWidth;
      const originalWidth = this._originalData[index].width;
      if (currentWidth !== originalWidth) {
        this._originalData[index].width = currentWidth;
        needsReSplit = true;
      }
    });

    if (needsReSplit) {
      this._handleAutoSplit();
    }
  }

  _handleAutoSplit() {
    if (this.options.autoSplit && this.isSplit) {
      this.split(this.options);
    }
  }

  // Text Processing
  _prepareText(text, element) {
    let processedText = text;

    // Apply custom text preparation
    if (typeof this.options.prepareText === 'function') {
      processedText = this.options.prepareText(processedText, element);
    }

    // Handle whitespace reduction
    if (this.options.reduceWhiteSpace) {
      processedText = processedText.replace(/\s+/g, ' ');
    }

    // Handle pre-formatted text
    const computedStyle = window.getComputedStyle(element);
    const isPreFormatted = computedStyle.whiteSpace.substring(0, 3) === 'pre';
    
    if (!this.options.reduceWhiteSpace && isPreFormatted) {
      processedText = processedText.replace(/\n/g, this.options.wordDelimiter + '\n');
    }

    return processedText;
  }

  // Advanced Text Handling
  _segmentText(text) {
    if (this._hasIntlSegmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text)).map(segment => segment.segment);
    }
    
    // Fallback for browsers without Intl.Segmenter
    return text.match(this._emojiRegex) || [];
  }

  _splitWords(text) {
    const delimiter = this.options.wordDelimiter;
    if (typeof delimiter === 'object') {
      const pattern = delimiter.delimiter || delimiter;
      return text.split(pattern);
    }
    return text.split(delimiter || ' ');
  }

  _processSpecialChars(segments) {
    if (!this.options.specialChars) return segments;

    const specialCharsRegex = Array.isArray(this.options.specialChars) 
      ? new RegExp(`(?:${this.options.specialChars.join('|')})`, 'gu')
      : this.options.specialChars;

    const specialMatches = new Set(segments.join('').match(specialCharsRegex) || []);
    
    if (specialMatches.size === 0) return segments;

    let i = segments.length;
    while (--i > -1) {
      const current = segments[i];
      for (const match of specialMatches) {
        if (match.startsWith(current) && match.length > current.length) {
          let j = 0;
          let combined = current;
          
          while (match.startsWith(combined += segments[i + ++j]) && combined.length < match.length);
          
          if (j && combined.length === match.length) {
            segments[i] = match;
            segments.splice(i + 1, j);
            break;
          }
        }
      }
    }
    
    return segments;
  }

  // CSS Class Generation
  _createClassGenerator(type, collection) {
    const baseClass = this.options[`${type}sClass`] || type;
    const hasIncrement = baseClass.includes('++');
    const className = hasIncrement ? baseClass.replace('++', '') : baseClass;

    return (content) => {
      const element = document.createElement(this.options.tag === 'span' ? 'span' : 'div');
      const index = collection.length + 1;
      
      element.className = hasIncrement ? `${className} ${className}${index}` : className;
      
      if (this.options.propIndex) {
        element.style.setProperty(`--${type}`, index.toString());
      }

      if (this.options.aria !== 'none') {
        element.setAttribute('aria-hidden', 'true');
      }

      if (this.options.tag !== 'span') {
        element.style.position = 'relative';
        element.style.display = type === 'line' ? 'block' : 'inline-block';
      }

      element.textContent = content;
      collection.push(element);
      
      return element;
    };
  }

  // Layout & Positioning
  _makeInlineBlock(element) {
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'inline') {
      element.style.display = 'inline-block';
    }
  }

  _insertNode(node, parent, before) {
    const nodeToInsert = typeof node === 'string' 
      ? document.createTextNode(node) 
      : node;
    parent.insertBefore(nodeToInsert, before);
  }

  _detectLines(elements) {
    if (!elements.length) return [];

    const lines = [];
    let currentLine = [];
    let currentTop = elements[0].getBoundingClientRect().top;
    const tolerance = 1;

    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      
      if (Math.abs(rect.top - currentTop) > tolerance) {
        if (currentLine.length) {
          lines.push([...currentLine]);
          currentLine = [];
        }
        currentTop = rect.top;
      }
      
      currentLine.push(element);
    });

    if (currentLine.length) {
      lines.push(currentLine);
    }

    return lines;
  }

  _wrapLine(lineElements, parentElement) {
    const lineWrapper = this._createClassGenerator('line', this.lines)('');
    const originalTextAlign = window.getComputedStyle(parentElement).textAlign || 'left';
    
    lineWrapper.style.textAlign = originalTextAlign;
    lineWrapper.textContent = '';

    // Insert wrapper before first element
    parentElement.insertBefore(lineWrapper, lineElements[0]);

    // Move elements to wrapper
    lineElements.forEach(element => {
      lineWrapper.appendChild(element);
    });

    // Normalize text content
    lineWrapper.normalize();
  }

  // Element Management & DOM Processing
  _processTextNode(textNode, parentElement, charGenerator, wordGenerator, splitChars, smartWrap) {
    const text = this._prepareText(textNode.textContent || '', parentElement);
    if (!text) return;

    const words = this._splitWords(text);
    const wordDelimiter = this.options.wordDelimiter;
    const isSpaceDelimiter = wordDelimiter === ' ';

    let lastWordElement = null;

    words.forEach((word, wordIndex) => {
      if (!word && wordIndex < words.length - 1) return;

      // Handle leading/trailing spaces
      const hasLeadingSpace = isSpaceDelimiter && word.charAt(0) === ' ';
      const hasTrailingSpace = isSpaceDelimiter && word.slice(-1) === ' ';

      if (hasLeadingSpace) {
        this._insertNode(' ', parentElement, textNode);
        word = word.slice(1);
      }

      if (!word) {
        if (wordIndex < words.length - 1) {
          this._insertNode(wordDelimiter, parentElement, textNode);
        }
        return;
      }

      // Create word wrapper
      let wordElement;
      if (splitChars && lastWordElement && wordIndex === 1 && !hasLeadingSpace && 
          this.words.includes(lastWordElement.parentNode)) {
        // Merge with previous word if conditions are met
        wordElement = this.words[this.words.length - 1];
        wordElement.appendChild(document.createTextNode(splitChars ? '' : word));
      } else {
        wordElement = wordGenerator(splitChars ? '' : word);
        this._insertNode(wordElement, parentElement, textNode);
        if (lastWordElement && wordIndex === 1 && !hasLeadingSpace) {
          wordElement.insertBefore(lastWordElement, wordElement.firstChild);
        }
      }

      // Split into characters if needed
      if (splitChars) {
        const chars = this._segmentText(word);
        const processedChars = this._processSpecialChars(chars);
        
        processedChars.forEach(char => {
          const charElement = char === ' ' 
            ? document.createTextNode(' ')
            : charGenerator(char);
          wordElement.appendChild(charElement);
        });
      }

      // Handle smart wrapping
      if (smartWrap && this.options.deepSlice) {
        const wordRect = wordElement.getBoundingClientRect();
        const parentRect = parentElement.getBoundingClientRect();
        
        if (wordRect.top > parentRect.top && wordRect.left <= parentRect.left) {
          // Word wrapped to new line
          const clonedParent = parentElement.cloneNode(false);
          let previousSibling = parentElement.firstChild;
          
          while (previousSibling && previousSibling !== wordElement) {
            const next = previousSibling.nextSibling;
            clonedParent.appendChild(previousSibling);
            previousSibling = next;
          }
          
          if (clonedParent.hasChildNodes()) {
            parentElement.parentNode.insertBefore(clonedParent, parentElement);
            this._makeInlineBlock(clonedParent);
          }
        }
      }

      if (hasTrailingSpace || wordIndex < words.length - 1) {
        this._insertNode(
          hasTrailingSpace ? ' ' + wordDelimiter : wordDelimiter,
          parentElement,
          textNode
        );
      }

      lastWordElement = wordElement;
    });
  }

  _processElement(element, charGenerator, wordGenerator, splitChars, ignoreElements) {
    const childNodes = Array.from(element.childNodes);
    let lastProcessedElement = null;

    childNodes.forEach(node => {
      if (node.nodeType === 3) { // Text node
        this._processTextNode(node, element, charGenerator, wordGenerator, splitChars, this.options.smartWrap);
        element.removeChild(node);
        lastProcessedElement = null;
      } else if (node.nodeType === 1) { // Element node
        if (ignoreElements && ignoreElements.includes(node)) {
          if (this.words.includes(node.previousSibling) && this.words[this.words.length - 1]) {
            this.words[this.words.length - 1].appendChild(node);
          }
          lastProcessedElement = node;
        } else {
          this._processElement(node, charGenerator, wordGenerator, splitChars, ignoreElements);
          lastProcessedElement = null;
        }
        this._makeInlineBlock(node);
      }
    });
  }

  // Accessibility
  _setupAccessibility(element) {
    const ariaOption = this.options.aria;
    
    if (ariaOption === 'auto') {
      const textContent = (element.textContent || '').trim();
      if (textContent) {
        element.setAttribute('aria-label', textContent);
      }
    } else if (ariaOption === 'hidden') {
      element.setAttribute('aria-hidden', 'true');
    }
  }

  // Main Split Method
  split(options = {}) {
    if (this.isSplit) {
      this.revert();
    }

    // Merge options
    this.options = { ...this.options, ...options };

    const types = this.options.type.split(',').map(t => t.trim());
    const splitChars = types.includes('chars');
    const splitWords = types.includes('words');
    const splitLines = types.includes('lines');

    if (!splitChars && !splitWords && !splitLines) {
      console.warn('CDGTextSplit: No valid split types specified');
      return this;
    }

    const ignoreElements = this.options.ignore ? this._selectElements(this.options.ignore) : null;

    this.elements.forEach((element, elementIndex) => {
      try {
        // Setup accessibility
        this._setupAccessibility(element);

        // Create generators
        const charGenerator = splitChars ? this._createClassGenerator('char', this.chars) : null;
        const wordGenerator = this._createClassGenerator('word', this.words);

        // Process element
        this._processElement(element, charGenerator, wordGenerator, splitChars, ignoreElements);

        // Handle line splitting
        if (splitLines) {
          const childElements = Array.from(element.children);
          const lines = this._detectLines(childElements);
          
          lines.forEach(lineElements => {
            this._wrapLine(lineElements, element);
          });

          // Remove any remaining BR elements
          const brElements = element.querySelectorAll('br');
          brElements.forEach(br => br.remove());
        }

        // Handle non-word splitting cleanup
        if (!splitWords) {
          this.words.forEach(wordElement => {
            if (splitChars || !wordElement.nextSibling || wordElement.nextSibling.nodeType !== 3) {
              if (this.options.smartWrap && !splitLines) {
                const wrapper = document.createElement('span');
                wrapper.style.whiteSpace = 'nowrap';
                wordElement.parentNode.insertBefore(wrapper, wordElement);
                wrapper.appendChild(wordElement);
              } else {
                wordElement.replaceWith(...wordElement.childNodes);
              }
            } else {
              // Merge with adjacent text
              const nextText = wordElement.nextSibling;
              if (nextText && nextText.nodeType === 3) {
                nextText.textContent = (wordElement.textContent || '') + (nextText.textContent || '');
                wordElement.remove();
              }
            }
          });
          this.words.length = 0;
          element.normalize();
        }

        // Handle masking
        if (this.options.mask && this[this.options.mask]) {
          this[this.options.mask].forEach(maskElement => {
            const clone = maskElement.cloneNode(false);
            maskElement.parentNode.insertBefore(clone, maskElement);
            clone.appendChild(maskElement);
            
            if (maskElement.className) {
              clone.className = maskElement.className.replace(/(\b\w+\b)/g, '$1-mask');
            }
            clone.style.overflow = 'clip';
            this.masks.push(clone);
          });
        }

      } catch (error) {
        console.error('CDGTextSplit: Error processing element', element, error);
      }
    });

    this.isSplit = true;

    // Setup auto-split observer
    if (this.options.autoSplit && splitLines) {
      this.elements.forEach((element, index) => {
        this._originalData[index].width = element.offsetWidth;
        if (this._resizeObserver) {
          this._resizeObserver.observe(element);
        }
      });
    }

    // Call onSplit callback
    if (typeof this.options.onSplit === 'function') {
      try {
        const result = this.options.onSplit(this);
        if (result && typeof result.totalTime === 'function') {
          // Handle animation timeline return
          this._animationTimeline = result;
        }
      } catch (error) {
        console.error('CDGTextSplit: Error in onSplit callback', error);
      }
    }

    return this;
  }

  // Revert Method
  revert() {
    if (!this.isSplit) return this;

    try {
      // Disconnect resize observer
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
      }

      // Clear animation timeline
      if (this._animationTimeline && typeof this._animationTimeline.revert === 'function') {
        this._animationTimeline.revert();
      }

      // Restore original HTML and attributes
      this._originalData.forEach(({ element, html, ariaLabel, ariaHidden }) => {
        element.innerHTML = html;
        
        if (ariaLabel) {
          element.setAttribute('aria-label', ariaLabel);
        } else {
          element.removeAttribute('aria-label');
        }
        
        if (ariaHidden) {
          element.setAttribute('aria-hidden', ariaHidden);
        } else {
          element.removeAttribute('aria-hidden');
        }
      });

      // Clear collections
      this.chars.length = 0;
      this.words.length = 0;
      this.lines.length = 0;
      this.masks.length = 0;

      this.isSplit = false;

      // Call onRevert callback
      if (typeof this.options.onRevert === 'function') {
        this.options.onRevert(this);
      }

    } catch (error) {
      console.error('CDGTextSplit: Error during revert', error);
    }

    return this;
  }

  // Utility Methods
  destroy() {
    this.revert();
    
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    
    clearTimeout(this._resizeTimeout);
    
    this._isDestroyed = true;
    this.elements = [];
    this._originalData = [];
  }

  // Static Methods
  static create(selector, options) {
    return new CDGTextSplit(selector, options);
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CDGTextSplit;
} else if (typeof define === 'function' && define.amd) {
  define([], () => CDGTextSplit);
} else if (typeof window !== 'undefined') {
  window.CDGTextSplit = CDGTextSplit;
}
