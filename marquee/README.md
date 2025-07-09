# CDG Marquee
This marquee uses CSS and JS. Here's how to set it up.

1. Add the `cdg-marquee.css` to the `<head>` of the page.
2. Add the `cdg-marquee.js` to before the `</body>` of the page.
3. Apply `[data-cdg-marquee="component"]` to the outer wrapper of the marquee.
4. Add one child group of elements in a div. Apply spacing by adding margin-right to the children.
5. Add `.anim-marquee` to the child group and configure timing, direction, etc.
6. Apply `[data-cdg-marquee="group"]` to the child group.

## CDN Links
#### CSS (In `<head>`)
```
<!-- CDG MARQUEE CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/nshreve/cdg-framework@v1.0.0/marquee/cdg-marquee.min.css">
```
#### JS (Before `</body>`)
```
<!-- CDG MARQUEE JS -->
<script src="https://cdn.jsdelivr.net/gh/nshreve/cdg-framework@v1.0.0/marquee/cdg-marquee.min.js"></script>
```
