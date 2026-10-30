(function () {
    if (typeof window.renderHorizontalBar !== "function" ||
        typeof window.renderVerticalBar !== "function" ||
        typeof window.renderRemotenessDonut !== "function") {
        console.warn("demographics-select.js: load it after demographics.js");
        return;
    }
 
    const COL_REMOTE = "ABS remoteness area";
    const LABELS = { "Road user": "Road user", [COL_REMOTE]: "Remoteness", "Age group": "Age group", "Sex": "Sex" };
    const sel = {};
    Object.keys(LABELS).forEach((c) => (sel[c] = null));
 
    const isOn = (selected, key) => selected === null || selected === key;
 
    function rowsFor(data, ownCol) {
        return data.filter((d) => Object.keys(sel).every((c) => c === ownCol || sel[c] === null || d[c] === sel[c]));
    }
 
    function sanitise(data, col) {
        if (sel[col] !== null && !rowsFor(data, col).some((d) => d[col] === sel[col])) sel[col] = null;
    }
 
    function toggle(col, key) {
        sel[col] = sel[col] === key ? null : key;
        window.updateDemographicsCharts();
    }
 
    function clearAll() {
        Object.keys(sel).forEach((c) => (sel[c] = null));
        window.updateDemographicsCharts();
    }
 
    function updateBar() {
        const view = document.getElementById("view-demographics");
        if (!view) return;
        let bar = document.getElementById("demo-selection-bar");
        if (!bar) {
            bar = document.createElement("div");
            bar.id = "demo-selection-bar";
            bar.className = "finding-bar";
            bar.setAttribute("role", "status");
            bar.setAttribute("aria-live", "polite");
            view.insertBefore(bar, view.firstChild);
        }
        const active = Object.keys(sel).filter((c) => sel[c] !== null);
        if (!active.length) {
            bar.innerHTML = "<strong>Tip:</strong> Click any bar or slice to focus on one group — the other charts update to match.";
        } else {
            bar.innerHTML = active.map((c) => `${LABELS[c]}: <strong>${sel[c]}</strong>`).join(" &nbsp;·&nbsp; ") +
                ' &nbsp; <button type="button" class="mini-btn" id="btn-clear-demo-sel">Clear selection</button>';
            document.getElementById("btn-clear-demo-sel").addEventListener("click", clearAll);
        }
    }
 
    function decorateBars(selector, col) {
        const selected = sel[col];
        const root = d3.select(selector);
        const rects = root.selectAll("rect");
        const keys = new Set(rects.data().map((d) => d.key));
 
        rects
            .attr("opacity", (d) => (isOn(selected, d.key) ? 1 : 0.25))
            .attr("stroke", (d) => (d.key === selected ? "#111827" : "none"))
            .attr("stroke-width", 2)
            .on("click", (event, d) => toggle(col, d.key));
 
        root.selectAll(".val-label, .bar-top-label")
            .attr("opacity", (d) => (isOn(selected, d.key) ? 1 : 0.35));
 
        // category labels on the axis are clickable too
        root.selectAll(".tick text")
            .filter((d) => keys.has(d))
            .style("cursor", "pointer")
            .style("fill", (d) => (isOn(selected, d) ? "#374151" : "#9ca3af"))
            .style("font-weight", (d) => (d === selected ? "700" : "600"))
            .on("click", (event, d) => toggle(col, d));
    }
 
    function decorateDonut(selector) {
        const selected = sel[COL_REMOTE];
        const root = d3.select(selector);
 
        root.selectAll("path")
            .filter((d) => d && d.data)
            .attr("opacity", (d) => (isOn(selected, d.data.key) ? 1 : 0.25))
            .attr("stroke", (d) => (d.data.key === selected ? "#111827" : "#ffffff"))
            .attr("stroke-width", (d) => (d.data.key === selected ? 3 : 2))
            .on("click", (event, d) => toggle(COL_REMOTE, d.data.key));
 
        root.selectAll(".leg")
            .attr("opacity", (d) => (isOn(selected, d.key) ? 1 : 0.35))
            .style("cursor", "pointer")
            .on("click", (event, d) => toggle(COL_REMOTE, d.key));
    }
 
    const origH = window.renderHorizontalBar;
    const origV = window.renderVerticalBar;
    const origD = window.renderRemotenessDonut;
 
    window.renderHorizontalBar = function (selector, data, groupCol, metric, color) {
        sanitise(data, groupCol);
        origH(selector, rowsFor(data, groupCol), groupCol, metric, color);
        decorateBars(selector, groupCol);
        updateBar();
    };
 
    window.renderVerticalBar = function (selector, data, groupCol, metric, color) {
        sanitise(data, groupCol);
        origV(selector, rowsFor(data, groupCol), groupCol, metric, color);
        decorateBars(selector, groupCol);
        updateBar();
    };
 
    window.renderRemotenessDonut = function (selector, data, metric) {
        sanitise(data, COL_REMOTE);
        origD(selector, rowsFor(data, COL_REMOTE), metric);
        decorateDonut(selector);
        updateBar();
    };
 
    const resetBtn = document.getElementById("btn-reset-filters");
    if (resetBtn) resetBtn.addEventListener("click", () => Object.keys(sel).forEach((c) => (sel[c] = null)));
})();
 