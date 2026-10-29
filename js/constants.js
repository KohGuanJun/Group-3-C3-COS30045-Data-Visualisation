/**
 * constants.js
 * Shared constants, colourblind-safe palettes (Okabe-Ito & Paul Tol), and formatting helpers
 * for the State & National Trends visualisations (state_by_year.csv).
 *
 * GenAI Acknowledgement:
 * Portions of structure and Okabe-Ito colourblind-safe hex mappings were refined with AI assistance
 * (Prompts: configure accessible Okabe-Ito 8-state palette and shared formatting constants for D3 v7).
 */

// Modified Okabe-Ito & Paul Tol colourblind-safe categorical palette for 8 Australian jurisdictions.
// Tested for Deuteranopia, Protanopia, and Tritanopia contrast on white (#ffffff) backgrounds.
const STATE_PALETTE = {
    NSW: "#0072B2", // Strong Blue
    Vic: "#D55E00", // Vermilion / Burnt Orange
    Qld: "#009E73", // Bluish Green
    WA:  "#CC79A7", // Reddish Purple
    SA:  "#56B4E9", // Sky Blue
    Tas: "#E69F00", // Amber Gold
    NT:  "#332288", // Deep Indigo
    ACT: "#525252"  // High-contrast Charcoal Grey
};

// Secondary stroke dash patterns for multi-line mode (Dual Encoding: Colour + Line Style)
const STATE_DASH = {
    NSW: "none",
    Vic: "none",
    Qld: "none",
    WA:  "6,3",
    SA:  "none",
    Tas: "6,3",
    NT:  "3,3",
    ACT: "6,3,2,3"
};

// Metric display names
const metricLabels = {
    Hospitalised_Injuries: "Hospitalised Injuries",
    Bed_Days: "Total Bed Days",
    Average_Bed_Days: "Average Bed Days"
};

// Primary UI & benchmark colours (high contrast, avoiding red-green reliance)
const UI_COLORS = {
    primaryLine: "#0072B2",
    selectedFill: "#004D80",
    aboveAvgBar: "#0072B2",
    belowAvgBar: "#8C96A6",
    benchmarkLine: "#111827"
};
