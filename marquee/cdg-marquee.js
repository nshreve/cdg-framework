function duplicateMarqueeGroups() {
    $('[data-cdg-marquee="component"]').each(function() {
        const $component = $(this);
        const $originalGroup = $component.find('[data-cdg-marquee="group"]').first();
        
        if ($originalGroup.length === 0) return;
        
        // Get dimensions
        const componentWidth = $component.width();
        const groupWidth = $originalGroup.outerWidth(true);
        
        if (groupWidth === 0) return; // Skip if group has no width
        
        // Calculate groups needed for component width + at least one group overflow
        const targetWidth = componentWidth + groupWidth;
        const groupsNeeded = Math.ceil(targetWidth / groupWidth);
        
        // Get current group count
        const currentGroups = $component.find('[data-cdg-marquee="group"]').length;
        
        // Only modify if count has changed
        if (currentGroups !== groupsNeeded) {
            // Remove all except original
            $component.find('[data-cdg-marquee="group"]').not(':first').remove();
            
            // Add required duplicates
            for (let i = 1; i < groupsNeeded; i++) {
                $originalGroup.clone().insertAfter(
                    $component.find('[data-cdg-marquee="group"]').last()
                );
            }
        }
    });
}

// Initialize
$(document).ready(duplicateMarqueeGroups);

// Debounced resize handler
let resizeTimeout;
$(window).on('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(duplicateMarqueeGroups, 250);
});
