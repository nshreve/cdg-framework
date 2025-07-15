$(document).ready(function() {

  // Text Split Animation with CDG Text Split
$('[data-cdg-text-split]').each(function() {
  let element = $(this);

  // Get the split type (chars, lines, or words)
  let attributeValue = element.attr('data-cdg-text-split');
  let splitType = 'chars'; // default

  if (attributeValue && attributeValue.trim() !== '') {
    splitType = attributeValue.trim();
  }

  // Find the animation class that starts with "anim-"
  const classList = this.className.split(' ');
  const animClass = classList.find(className => className.startsWith('anim-'));

  if (animClass) {
    // Remove the animation class from the original element
    element.removeClass(animClass);

    // Create CDG Text Split instance
    const textSplit = new CDGTextSplit(this, {
      type: splitType,
      charsClass: "char",
      wordsClass: "word", 
      linesClass: "line",
      smartWrap: true
    });

    // Split the text
    textSplit.split();

    // Add the animation class to the split elements
    if (splitType.includes('chars')) {
      // If 'chars' is included, only apply animation to chars
      $(textSplit.chars).addClass(animClass);
    } else if (splitType.includes('words')) {
      // If no 'chars' but has 'words', apply to words
      $(textSplit.words).addClass(animClass);
    } else if (splitType.includes('lines')) {
      // If neither 'chars' nor 'words', but has 'lines', apply to lines
      $(textSplit.lines).addClass(animClass);
    }
  }
});



  //Stagger Animations
$('[data-cdg-anim-stagger]').each(function() {
  let element = $(this);
  let staggerDelay;
  
  // Check if data-cdg-anim-stagger has a value
  let attributeValue = element.attr('data-cdg-anim-stagger');

  if (attributeValue && attributeValue.trim() !== '') {
    // Use the attribute value as stagger amount
    staggerDelay = parseFloat(attributeValue.trim());
  } else {
    const staggerValue = getComputedStyle(this).getPropertyValue('--_animations---stagger').trim();
    // Use 0.2s as default if CSS property doesn't exist or is empty
    staggerDelay = staggerValue && staggerValue !== '' ? parseFloat(staggerValue) : 0.2;
  }

  let delayIndex = 0;

  element.children().each(function() {
    if (this.tagName.toLowerCase() === 'span') {
      // For spans, find all divs inside and apply delays to those
      $(this).find('div').each(function() {
        const delay = delayIndex * staggerDelay;
        this.style.setProperty('animation-delay', `${delay}s`, 'important');
        delayIndex++;
      });
    } else {
      // For non-span children, apply delay directly
      const delay = delayIndex * staggerDelay;
      this.style.setProperty('animation-delay', `${delay}s`, 'important');
      delayIndex++;
    }
  });
});




// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Complete CDG Scroll Animations with Grouped Observers
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, falling back to scroll event');
    return initScrollAnimationsFallback();
  }

  try {
    // Track observers and elements for cleanup and recalculation
    const observerGroups = new Map(); // offset -> observer
    const elementGroups = new Map();  // offset -> [elements]
    let layoutObserver = null;
    let imageObserver = null;
    const debouncedRecalculate = debounce(recalculateAnimations, 150);

    // Animation trigger function with performance tracking
    function triggerAnimation(element) {
      const startTime = performance.now();
      
      element.removeAttribute('data-cdg-anim-inview');
      element.dispatchEvent(new CustomEvent('cdg-anim-triggered'));
      
      // Performance tracking
      console.debug(`Animation triggered in ${performance.now() - startTime}ms`);
      
      // Remove from tracking efficiently
      removeElementFromTracking(element);
    }

    // Improved element removal from tracking
    function removeElementFromTracking(element) {
      for (const [offset, elements] of elementGroups.entries()) {
        const index = elements.indexOf(element);
        if (index > -1) {
          elements.splice(index, 1);
          
          // Clean up empty groups
          if (elements.length === 0) {
            const observer = observerGroups.get(offset);
            if (observer) {
              observer.disconnect();
              observerGroups.delete(offset);
            }
            elementGroups.delete(offset);
          }
          break; // Element can only be in one group
        }
      }
    }

    // Create observer for specific offset with performance tracking
    function createObserverForOffset(offset) {
      const creationStart = performance.now();
      const rootMargin = calculateRootMargin(offset);
      
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            triggerAnimation(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: rootMargin,
        threshold: 0
      });
      
      console.debug(`Observer created for offset ${offset} in ${performance.now() - creationStart}ms`);
      return observer;
    }

    // Setup individual element with better error handling
    function setupAnimationElement(element) {
      try {
        let attributeValue = element.getAttribute('data-cdg-anim-inview');
        let offset = '75%';

        if (attributeValue && attributeValue.trim() !== '') {
          offset = attributeValue.trim();
        }

        // Check if element should already be triggered
        if (shouldTriggerImmediately(element, offset)) {
          triggerAnimation(element);
          return;
        }

        // Group elements by offset
        if (!observerGroups.has(offset)) {
          const observer = createObserverForOffset(offset);
          observerGroups.set(offset, observer);
          elementGroups.set(offset, []);
        }

        // Add element to its group
        const observer = observerGroups.get(offset);
        const elements = elementGroups.get(offset);
        
        observer.observe(element);
        elements.push(element);

      } catch (error) {
        console.error('CDG Scroll Animations: Error setting up element', element, error);
        // Continue with other elements rather than failing completely
      }
    }

    // Layout change detection and recalculation
    function recalculateAnimations() {
      try {
        // Check all remaining elements for immediate trigger
        const elementsToTrigger = [];
        
        elementGroups.forEach((elements, offset) => {
          elements.forEach(element => {
            if (shouldTriggerImmediately(element, offset)) {
              elementsToTrigger.push(element);
            }
          });
        });
        
        // Batch trigger all elements that should fire
        elementsToTrigger.forEach(triggerAnimation);
        
      } catch (error) {
        console.error('CDG Scroll Animations: Error during recalculation', error);
      }
    }

    // Improved layout change detection
    function setupLayoutDetection() {
      try {
        // Watch for layout changes using ResizeObserver
        if ('ResizeObserver' in window) {
          layoutObserver = new ResizeObserver(entries => {
            debouncedRecalculate();
          });
          
          // Observe both body and document element for comprehensive coverage
          layoutObserver.observe(document.body);
          layoutObserver.observe(document.documentElement);
        }

        // Better image load detection with MutationObserver
        imageObserver = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
                images.forEach(img => {
                  if (!img.complete) {
                    img.addEventListener('load', debouncedRecalculate, { once: true });
                    img.addEventListener('error', debouncedRecalculate, { once: true });
                  }
                });
              }
            });
          });
        });
        
        imageObserver.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Also listen for existing images that might still be loading
        document.querySelectorAll('img').forEach(img => {
          if (!img.complete) {
            img.addEventListener('load', debouncedRecalculate, { once: true });
            img.addEventListener('error', debouncedRecalculate, { once: true });
          }
        });

        // Throttled resize events as fallback
        const debouncedResize = debounce(recalculateAnimations, 100);
        window.addEventListener('resize', debouncedResize, { passive: true });

        // Return cleanup function for these listeners
        return function cleanupLayoutDetection() {
          if (layoutObserver) {
            layoutObserver.disconnect();
            layoutObserver = null;
          }
          if (imageObserver) {
            imageObserver.disconnect();
            imageObserver = null;
          }
          window.removeEventListener('resize', debouncedResize);
        };
      } catch (error) {
        console.error('CDG Scroll Animations: Error setting up layout detection', error);
        // Return empty cleanup function if setup fails
        return function() {};
      }
    }

    // Setup all elements initially
    function initializeElements() {
      try {
        const elements = document.querySelectorAll('[data-cdg-anim-inview]');
        
        if (elements.length === 0) {
          console.warn('CDG Scroll Animations: No elements found with data-cdg-anim-inview attribute');
          return;
        }

        elements.forEach(setupAnimationElement);
        
        console.log(`CDG Scroll Animations: Initialized ${elements.length} elements in ${observerGroups.size} groups`);
      } catch (error) {
        console.error('CDG Scroll Animations: Error initializing elements', error);
      }
    }

    // Initialize everything
    const cleanupLayoutDetection = setupLayoutDetection();
    initializeElements();

    // Return cleanup function
    return function cleanup() {
      console.log('CDG Scroll Animations: Cleaning up...');
      
      try {
        // Disconnect all observers
        observerGroups.forEach(observer => observer.disconnect());
        observerGroups.clear();
        elementGroups.clear();
        
        // Cleanup layout detection
        cleanupLayoutDetection();
        
      } catch (error) {
        console.error('CDG Scroll Animations: Error during cleanup', error);
      }
    };

  } catch (error) {
    console.error('CDG Scroll Animations: Failed to initialize, falling back to scroll event implementation', error);
    return initScrollAnimationsFallback();
  }
}

// Helper function: Check if element should trigger immediately
function shouldTriggerImmediately(element, offset) {
  try {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    let triggerPoint = windowHeight * 0.75; // default 75%
    
    if (offset.includes('%')) {
      const percentage = parseFloat(offset);
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        triggerPoint = windowHeight * (percentage / 100);
      }
    } else if (offset.includes('px')) {
      const pixels = parseFloat(offset);
      if (!isNaN(pixels) && pixels >= 0) {
        triggerPoint = pixels;
      }
    } else if (offset.includes('vh')) {
      const vh = parseFloat(offset);
      if (!isNaN(vh) && vh >= 0 && vh <= 100) {
        triggerPoint = windowHeight * (vh / 100);
      }
    }
    
    return rect.top <= triggerPoint;
  } catch (error) {
    console.error('CDG Scroll Animations: Error in shouldTriggerImmediately', error);
    return false;
  }
}

// Helper function: Calculate rootMargin for Intersection Observer
function calculateRootMargin(offset) {
  try {
    if (offset.includes('%')) {
      const percentage = parseFloat(offset);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        console.warn(`Invalid percentage offset: ${offset}, using default 75%`);
        return '0px 0px -25% 0px';
      }
      const bottomMargin = Math.max(0, 100 - percentage);
      return `0px 0px -${bottomMargin}% 0px`;
    } else if (offset.includes('px')) {
      const pixels = parseFloat(offset);
      if (isNaN(pixels) || pixels < 0) {
        console.warn(`Invalid pixel offset: ${offset}, using default`);
        return '0px 0px -25% 0px';
      }
      const windowHeight = window.innerHeight;
      const bottomMargin = Math.max(0, windowHeight - pixels);
      return `0px 0px -${bottomMargin}px 0px`;
    } else if (offset.includes('vh')) {
      const vh = parseFloat(offset);
      if (isNaN(vh) || vh < 0 || vh > 100) {
        console.warn(`Invalid vh offset: ${offset}, using default 75%`);
        return '0px 0px -25% 0px';
      }
      const bottomMargin = Math.max(0, 100 - vh);
      return `0px 0px -${bottomMargin}vh 0px`;
    }
    
    console.warn(`Unrecognized offset format: ${offset}, using default 75%`);
    return '0px 0px -25% 0px';
  } catch (error) {
    console.error('CDG Scroll Animations: Error calculating rootMargin', error);
    return '0px 0px -25% 0px';
  }
}

// Improved fallback for browsers without IntersectionObserver
function initScrollAnimationsFallback() {
  console.warn('CDG Scroll Animations: Using fallback implementation');
  
  try {
    let elements = Array.from(document.querySelectorAll('[data-cdg-anim-inview]'));
    
    function checkVisibility() {
      try {
        elements = elements.filter(element => {
          try {
            let attributeValue = element.getAttribute('data-cdg-anim-inview');
            let offset = attributeValue && attributeValue.trim() !== '' ? attributeValue.trim() : '75%';
            
            if (shouldTriggerImmediately(element, offset)) {
              element.removeAttribute('data-cdg-anim-inview');
              element.dispatchEvent(new CustomEvent('cdg-anim-triggered'));
              return false; // Remove from array
            }
            
            return true; // Keep in array
          } catch (error) {
            console.error('CDG Scroll Animations: Error checking element in fallback', error);
            return false; // Remove problematic element
          }
        });
        
        // Remove listeners when no more elements
        if (elements.length === 0) {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleScroll);
          document.removeEventListener('load', handleScroll, true);
          console.log('CDG Scroll Animations: All elements processed, cleanup complete');
        }
      } catch (error) {
        console.error('CDG Scroll Animations: Error in fallback checkVisibility', error);
      }
    }
    
    // Throttle scroll events with requestAnimationFrame
    let ticking = false;
    function handleScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkVisibility();
          ticking = false;
        });
        ticking = true;
      }
    }
    
    // Debounced resize handler
    const debouncedHandleScroll = debounce(checkVisibility, 100);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', debouncedHandleScroll, { passive: true });
    document.addEventListener('load', debouncedHandleScroll, true);
    
    // Check initially
    checkVisibility();
    
    console.log(`CDG Scroll Animations: Fallback initialized with ${elements.length} elements`);
    
    return function cleanup() {
      try {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', debouncedHandleScroll);
        document.removeEventListener('load', debouncedHandleScroll, true);
        console.log('CDG Scroll Animations: Fallback cleanup complete');
      } catch (error) {
        console.error('CDG Scroll Animations: Error during fallback cleanup', error);
      }
    };
  } catch (error) {
    console.error('CDG Scroll Animations: Failed to initialize fallback', error);
    return function() {}; // Return empty cleanup function
  }
}

// Initialize when ready (call this in your document ready function)
let cleanupScrollAnimations;

try {
  cleanupScrollAnimations = initScrollAnimations();
} catch (error) {
  console.error('CDG Scroll Animations: Critical initialization error', error);
  cleanupScrollAnimations = function() {}; // Provide empty cleanup
}

// Optional: Export cleanup function for single-page apps
// window.cleanupScrollAnimations = cleanupScrollAnimations;


  
});
