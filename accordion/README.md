# CDG Accordion
This accordion uses CSS only. Here's how to set it up.

1. Add the cdg-accordion.css to the <head> of the page.
2. Apply `[data-cdg-accordion="item"]` to the outer wrapper of each accordion item.
3. Add an absolute checkbox to the trigger area and give it `[data-cdg-accordion="checkbox"]`.
4. Add `[data-cdg-accordion="content"]` to the content wrapper, set to grid.
5. Add `[data-cdg-accordion="icon"]` to the icon.

**Optional:** Add a style of `--icon-rotation: Xdeg;` to the `[data-cdg-accordion="item"]` element to set a different rotation amount for the icon.
