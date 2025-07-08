function duplicateMarqueeGroups() {
    $('[data-cdg-marquee="component"]').each(function() {
        const component = $(this);
        const group = component.find('[data-cdg-marquee="group"]').first();
        
        if (group.length === 0) return;
        
        const componentWidth = component.width();
        const groupWidth = group.outerWidth(true); // includes margins
        
        const targetWidth = componentWidth * 2;
        const groupsNeeded = Math.ceil(targetWidth / groupWidth);
        
        component.find('[data-cdg-marquee="group"]').not(':first').remove();
        
        for (let i = 1; i < groupsNeeded; i++) {
            group.clone().insertAfter(component.find('[data-cdg-marquee="group"]').last());
        }
    });
}

$(document).ready(function() {
    duplicateMarqueeGroups();
});

$(window).on('resize', function() {
    duplicateMarqueeGroups();
});

let resizeTimeout;
$(window).on('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(duplicateMarqueeGroups, 250);
});
