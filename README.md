Background & purpose
----------
I created this bullet chart when our design called for a custom bullet chart component which was not available in off-the-shelf solutions.

We needed a bullet chart component which could accept multiple target values, multiple “primary” performance values, a “range” value, and multiple “secondary” performance values.  Furthermore, the component needed to accept any numerical value as input, whether positive or negative.  This meant that the entire bullet chart should adjusts its “internal scale” (since its outer size does not change) as it encounters new maximum or minimum values from any of its inputs.  Additionally, if there were multiple “primary” or “secondary” values, their respective graphical bars would retain their proper “stacking order” even as their values varied between positive and negative. 

This component solves all of those problems.
