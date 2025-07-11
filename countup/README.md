# CDG Countup
CDG Countup is a customized version of [CountUp.js](https://inorganik.github.io/countUp.js/). Here's how to set it up.

1. Add the `cdg-countup.js` to before the `</body>` of the page.
2. Apply `[data-cdg-countup]` to the element you want to count up. It will start at 0, and end at the current value.

### Optional Paramaters
- `[data-cdg-countup-start]` sets the starting value.
- `[data-cdg-countup-duration]` sets the animation duration.
- `[data-cdg-countup-decimals]` sets the number of decimal places.
- `[data-cdg-countup-prefix]` sets a prefix.
- `[data-cdg-countup-suffix]` sets a suffix.
- `[data-cdg-countup-separator]` sets what to use as a thousand's separator.
- `[data-cdg-countup-decimal]` sets what to use as a decimal separator.
- `[data-cdg-countup-easing]` uses true/false to enable easing.
- `[data-cdg-countup-grouping]` uses true/false to add separators.
- `[data-cdg-countup-inview]` waits for the element to be inview to count up. Set the value to any custom amount to change the trigger point (ex. 50%).

## CDN Links
#### JS (Before `</body>`)
```
<!-- CDG MARQUEE JS -->
<script src="https://cdn.jsdelivr.net/gh/nshreve/cdg-framework@v1.1.0/countup/cdg-countup.min.js"></script>
```
