$(document).ready(function() {
	function isNotChromium() {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isOpera = /OPR/.test(navigator.userAgent);
    return !(isChrome || isEdge || isOpera);
  }

  if (isNotChromium()) {
    $('[data-cdg-anim-stagger]').each(function() {
      let element = $(this);
    
      // Get the actual computed value of the CSS custom property
      const staggerValue = getComputedStyle(this).getPropertyValue('--_animations---stagger').trim();
      const staggerDelay = parseFloat(staggerValue) || 0.2; // fallback to 0.2 if not found
    
      element.children().each(function(index) {
        // Do the math in JavaScript and set the final computed value
        const delay = index * staggerDelay;
        $(this).css('animation-delay', `${delay}s`);
      });
    });
  }

  $('[data-cdg-anim="in-view"]').each(function() {
    let element = $(this);
    ScrollTrigger.create({
      trigger: element,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: function() {
        $(element).removeAttr('data-cdg-anim');
      },
      once: true
    });
  });
});
