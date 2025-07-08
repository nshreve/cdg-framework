function duplicateMarqueeGroups() {
    $('[data-cdg-marquee="component"]').each(function() {
        const $component = $(this);
        const $originalGroup = $component.find('[data-cdg-marquee="group"]').first();
        
        if ($originalGroup.length === 0) return;
        
        $component.removeClass('ready');
        
        const componentWidth = $component.width();
        const groupWidth = $originalGroup.outerWidth(true);
        
        if (groupWidth === 0) return;
        
        const targetWidth = componentWidth + groupWidth;
        const groupsNeeded = Math.ceil(targetWidth / groupWidth);
        
        const currentGroups = $component.find('[data-cdg-marquee="group"]').length;
        
        if (currentGroups !== groupsNeeded) {
            $component.find('[data-cdg-marquee="group"]').not(':first').remove();
            
            for (let i = 1; i < groupsNeeded; i++) {
                $originalGroup.clone().insertAfter(
                    $component.find('[data-cdg-marquee="group"]').last()
                );
            }
        }
        
        setTimeout(() => {
            $component.addClass('ready');
        }, 50);
    });
}

$(document).ready(duplicateMarqueeGroups);

let resizeTimeout;
$(window).on('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(duplicateMarqueeGroups, 250);
});
