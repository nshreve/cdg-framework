$(document).ready(function() {

  // Text Split Animation with GSAP SplitText
$('[data-cdg-text-split]').each(function() {
  let element = $(this);

  // Get the split type (chars, lines, or words)
  let attributeValue = element.attr('data-cdg-text-split');
  let splitType = 'words, chars'; // default

  if (attributeValue && attributeValue.trim() !== '') {
    splitType = attributeValue.trim();
  }

  // Find the animation class that starts with "anim-"
  const classList = this.className.split(' ');
  const animClass = classList.find(className => className.startsWith('anim-'));

  if (animClass) {
    // Remove the animation class from the original element
    element.removeClass(animClass);

    // Create GSAP SplitText instance
    const splitText = new SplitText(this, {
      type: splitType
    });

    // Add the animation class to the split elements
    if (splitType.includes('chars')) {
      // If 'chars' is included, only apply animation to chars
      $(splitText.chars).addClass(animClass);
    } else if (splitType.includes('words')) {
      // If no 'chars' but has 'words', apply to words
      $(splitText.words).addClass(animClass);
    } else if (splitType.includes('lines')) {
      // If neither 'chars' nor 'words', but has 'lines', apply to lines
      $(splitText.lines).addClass(animClass);
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
      staggerDelay = parseFloat(staggerValue);
    }

    element.children().each(function(index) {
      const delay = index * staggerDelay;
      this.style.setProperty('animation-delay', `${delay}s`, 'important');
    });
  });


  //Scroll into view
  $('[data-cdg-anim-inview]').each(function() {
    let element = $(this);
  
    // Get the attribute value or use defaults
    let attributeValue = element.attr('data-cdg-anim-inview');
    let offset = '75%';
  
    // If there's a specific value in the attribute, use it offset
    if (attributeValue && attributeValue.trim() !== '') {
      offset = attributeValue.trim();
    }
  
    ScrollTrigger.create({
      trigger: element,
      start: `top ${offset}`,
      onEnter: function() {
        $(element).removeAttr('data-cdg-anim-inview');
      },
      once: true
    });
  });
  
});
