/**
 * first_nations.js
 * Renders 4 interactive D3 v7 charts for First Nations Insights:
 * 1. Trend Line Chart (First Nations vs Non-Indigenous)
 * 2. Remoteness Donut Chart (with interactive cross-filtering)
 * 3. Age Group Column Chart (with interactive cross-filtering)
 * 4. Road User Horizontal Bar Chart (with wide left margin & cross-filtering)
 */

let rawFnData = [];
const fnSelection = {
    category: null, // "Remoteness" | "Age" | "Road User"
    value: null     // clicked sub-category value
};

function initFirstNationsCharts() {
    if (!rawFnData.length) return;

    const yearEl = document.getElementById("filter-year");
    const yearVal = yearEl ? yearEl.value : "All";

    const filtered = yearVal === "All"
        ? rawFnData
        : rawFnData.filter(d => String(d["Calendar year"]) === String(yearVal));

    updateFnKeyFinding(filtered, yearVal);
    renderFnTrendChart(filtered, yearVal);
    renderFnRemotenessChart(filtered);
    renderFnAgeChart(filtered);
    renderFnRoadUserChart(filtered);
}

function updateFnKeyFinding(data, yearVal) {
    const findingBar = document.getElementById("fn-key-finding");
    if (!findingBar) return;

    const periodText = yearVal === "All" ? "2011–2021" : yearVal;
    
    if (fnSelection.value) {
        findingBar.innerHTML = `<strong>First Nations Filter (${fnSelection.category}):</strong> Showing data filtered for <strong>${fnSelection.value}</strong> (${periodText}).` +
            ` &nbsp; <button type="button" class="mini-btn" id="btn-clear-fn-sel">Clear selection</button>`;
        const clearBtn = document.getElementById("btn-clear-fn-sel");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                fnSelection.category = null;
                fnSelection.value = null;
                initFirstNationsCharts();
            });
        }
        return;
    }

    const fnRows = data.filter(d => d["First Nations status"] === "First Nations people");
    const fnTotal = d3.sum(fnRows, d => d["Sum(Hospitalisations)"] || 0);

    findingBar.innerHTML = `<strong>First Nations Insights (${periodText}):</strong> Recorded <strong>${d3.format(",")(fnTotal)}</strong> First Nations hospitalisations. ` +
        `<em>Tip: Click any bar or slice to highlight and filter across charts.</em>`;
}

// 1. Trend Line Chart
function renderFnTrendChart(data, yearVal) {
    const container = d3.select("#fn-chart-trend");
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 205;
    const margin = { top: 18, right: 30, bottom: 28, left: 58 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Always use full dataset for the trend line context
    let activeData = rawFnData.filter(d => d.Category === "Age");
    if (fnSelection.value) {
        activeData = rawFnData.filter(d => d.Category === fnSelection.category && d.Sub_Category === fnSelection.value);
    }

    const years = Array.from(new Set(activeData.map(d => d["Calendar year"]))).sort(d3.ascending);
    const statuses = ["First Nations people", "Non-Indigenous"];

    const series = statuses.map(st => {
        const rows = activeData.filter(d => d["First Nations status"] === st);
        const yrMap = d3.rollup(rows, v => d3.sum(v, d => d["Sum(Hospitalisations)"]), d => d["Calendar year"]);
        return {
            status: st,
            values: years.map(yr => ({ year: yr, val: yrMap.get(yr) || 0 }))
        };
    });

    const maxVal = d3.max(series, s => d3.max(s.values, d => d.val)) || 1;

    const svg = container.append("svg")
        .attr("role", "img")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(years).range([0, innerWidth]).padding(0.25);
    const y = d3.scaleLinear().domain([0, maxVal * 1.15]).nice().range([innerHeight, 0]);

    // Gridlines & Axes
    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"));

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#4b5563")
        .style("font-weight", d => String(d) === String(yearVal) ? "700" : "400"); // Bold the selected year on x-axis!

    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").remove())
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#4b5563");

    const colorScale = {
        "First Nations people": "#D55E00",
        "Non-Indigenous": "#0072B2"
    };

    const line = d3.line().x(d => x(d.year)).y(d => y(d.val));
    const tooltip = d3.select("#tooltip");

    series.forEach(s => {
        // Draw the background trend line
        g.append("path")
            .datum(s.values)
            .attr("fill", "none")
            .attr("stroke", colorScale[s.status])
            .attr("stroke-width", 2.6)
            .attr("opacity", 0.85)
            .attr("d", line);

        // Draw data points, making the selected year's dot much larger and prominent!
        g.selectAll(`.dot-${s.status.replace(/\s+/g, '')}`)
            .data(s.values)
            .join("circle")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.val))
            .attr("r", d => String(d.year) === String(yearVal) ? 7 : 4.5) // Larger radius if it matches the selected year!
            .attr("fill", colorScale[s.status])
            .attr("stroke", d => String(d.year) === String(yearVal) ? "#111827" : "#ffffff") // Dark border for selected year
            .attr("stroke-width", d => String(d.year) === String(yearVal) ? 2.5 : 2)
            .style("cursor", "pointer")
            .on("mouseenter", (event, d) => {
                tooltip.classed("hidden", false)
                    .html(`<strong>${s.status} (${d.year})</strong><br/>Hospitalisations: <strong>${d3.format(",")(d.val)}</strong>`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
            })
            .on("mouseleave", () => tooltip.classed("hidden", true));
    });
}

// 2. Remoteness Donut Chart
function renderFnRemotenessChart(data) {
    const container = d3.select("#fn-chart-remoteness");
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 205;

    const remData = data.filter(d => d.Category === "Remoteness" && d["First Nations status"] === "First Nations people");
    const summaryMap = d3.rollup(remData, v => d3.sum(v, d => d["Sum(Hospitalisations)"] || 0), d => d.Sub_Category);
    const summary = Array.from(summaryMap, ([key, val]) => ({ key, val }))
        .sort((a, b) => d3.descending(a.val, b.val));

    const total = d3.sum(summary, d => d.val) || 1;

    const svg = container.append("svg")
        .attr("role", "img")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const radius = Math.min(width * 0.42, height) / 2 - 12;
    const centerX = width * 0.28;
    const centerY = height / 2;

    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    const color = d3.scaleOrdinal()
        .domain(summary.map(d => d.key))
        .range(["#D55E00", "#0072B2", "#009E73"]);

    const pie = d3.pie().value(d => d.val).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.54).outerRadius(radius);
    const tooltip = d3.select("#tooltip");

    g.selectAll("path")
        .data(pie(summary))
        .join("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.key))
        .attr("stroke", d => fnSelection.value === d.data.key ? "#111827" : "#ffffff")
        .attr("stroke-width", d => fnSelection.value === d.data.key ? 3 : 2.2)
        .attr("opacity", d => (!fnSelection.value || fnSelection.value === d.data.key) ? 1 : 0.25)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            const pct = ((d.data.val / total) * 100).toFixed(1);
            tooltip.classed("hidden", false)
                .html(`<strong>${d.data.key} (First Nations)</strong><br/>Injuries: <strong>${d3.format(",")(d.data.val)}</strong> (${pct}%)`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true))
        .on("click", (event, d) => {
            fnSelection.category = "Remoteness";
            fnSelection.value = fnSelection.value === d.data.key ? null : d.data.key;
            initFirstNationsCharts();
        });

    g.append("text").attr("text-anchor", "middle").attr("dy", "-0.2em").style("font-size", "11px").style("fill", "#4b5563").text("Total");
    g.append("text").attr("text-anchor", "middle").attr("dy", "1.1em").style("font-size", "14.5px").style("font-weight", "700").style("fill", "#111827").text(d3.format(",")(total));

    const rowSpacing = Math.min(22, (height - 20) / Math.max(summary.length, 1));
    const startY = (height - (summary.length - 1) * rowSpacing) / 2;
    const legend = svg.append("g").attr("transform", `translate(${width * 0.54}, ${startY})`);

    const rows = legend.selectAll(".legend-item")
        .data(summary)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * rowSpacing})`)
        .attr("opacity", d => (!fnSelection.value || fnSelection.value === d.key) ? 1 : 0.35)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            fnSelection.category = "Remoteness";
            fnSelection.value = fnSelection.value === d.key ? null : d.key;
            initFirstNationsCharts();
        });

    rows.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2).attr("y", -10).attr("fill", d => color(d.key));
    rows.append("text").attr("x", 18).attr("y", 0).style("font-size", "12px").style("font-weight", "700").style("fill", "#1f2937").text(d => d.key);
    rows.append("text").attr("x", 185).attr("y", 0).attr("text-anchor", "end").style("font-size", "11.5px").style("font-weight", "600").style("fill", "#374151").text(d => `${d3.format(",")(d.val)} (${((d.val / total) * 100).toFixed(1)}%)`);
}

// 3. Age Group Column Chart
function renderFnAgeChart(data) {
    const container = d3.select("#fn-chart-age");
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 205;
    const margin = { top: 22, right: 20, bottom: 28, left: 58 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const ageData = data.filter(d => d.Category === "Age");
    const ageGroups = ["0-7", "8-16", "17-25", "26-39", "40-64", "65+"];
    const statuses = ["First Nations people", "Non-Indigenous"];

    const summary = ageGroups.map(grp => {
        const rowFn = ageData.find(d => d.Sub_Category === grp && d["First Nations status"] === "First Nations people");
        const rowNon = ageData.find(d => d.Sub_Category === grp && d["First Nations status"] === "Non-Indigenous");
        return {
            age: grp,
            "First Nations people": rowFn ? rowFn["Sum(Hospitalisations)"] : 0,
            "Non-Indigenous": rowNon ? rowNon["Sum(Hospitalisations)"] : 0
        };
    });

    const svg = container.append("svg")
        .attr("role", "img")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand().domain(ageGroups).range([0, innerWidth]).padding(0.2);
    const x1 = d3.scaleBand().domain(statuses).range([0, x0.bandwidth()]).padding(0.05);

    const maxVal = d3.max(summary, d => Math.max(d["First Nations people"], d["Non-Indigenous"])) || 1;
    const y = d3.scaleLinear().domain([0, maxVal * 1.15]).nice().range([innerHeight, 0]);

    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"));

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x0).tickSizeOuter(0))
        .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
        .selectAll("text")
        .style("font-size", "10.5px")
        .style("font-weight", "600")
        .style("fill", "#1f2937");

    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").remove())
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#4b5563");

    const colorScale = {
        "First Nations people": "#D55E00",
        "Non-Indigenous": "#0072B2"
    };

    const tooltip = d3.select("#tooltip");

    const ageGroupsEl = g.selectAll(".age-group")
        .data(summary)
        .join("g")
        .attr("transform", d => `translate(${x0(d.age)},0)`);

    ageGroupsEl.selectAll("rect")
        .data(d => statuses.map(st => ({ status: st, val: d[st], age: d.age })))
        .join("rect")
        .attr("x", d => x1(d.status))
        .attr("y", d => y(d.val))
        .attr("width", x1.bandwidth())
        .attr("height", d => innerHeight - y(d.val))
        .attr("rx", 2)
        .attr("fill", d => colorScale[d.status])
        .attr("stroke", d => (fnSelection.category === "Age" && fnSelection.value === d.age) ? "#111827" : "none")
        .attr("stroke-width", 2)
        .attr("opacity", d => (!fnSelection.value || (fnSelection.category === "Age" && fnSelection.value === d.age)) ? 1 : 0.25)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            tooltip.classed("hidden", false)
                .html(`<strong>Age ${d.age} — ${d.status}</strong><br/>Hospitalisations: <strong>${d3.format(",")(d.val)}</strong>`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true))
        .on("click", (event, d) => {
            fnSelection.category = "Age";
            fnSelection.value = fnSelection.value === d.age ? null : d.age;
            initFirstNationsCharts();
        });
}

// 4. Road User Horizontal Bar Chart
function renderFnRoadUserChart(data) {
    const container = d3.select("#fn-chart-roaduser");
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 205;
    const margin = { top: 18, right: 30, bottom: 28, left: 230 }; // Wide margin for long labels
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const ruData = data.filter(d => d.Category === "Road User");
    const roadUsers = Array.from(new Set(ruData.map(d => d.Sub_Category)));

    const summary = roadUsers.map(ru => {
        const rowFn = ruData.find(d => d.Sub_Category === ru && d["First Nations status"] === "First Nations people");
        return {
            roadUser: ru,
            val: rowFn ? rowFn["Sum(Hospitalisations)"] : 0
        };
    }).sort((a, b) => d3.descending(a.val, b.val));

    const svg = container.append("svg")
        .attr("role", "img")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(summary.map(d => d.roadUser)).range([0, innerHeight]).padding(0.25);
    const x = d3.scaleLinear().domain([0, (d3.max(summary, d => d.val) || 1) * 1.15]).nice().range([0, innerWidth]);

    g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", "#1f2937");

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(4).tickSize(-innerHeight))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"))
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#4b5563");

    const tooltip = d3.select("#tooltip");

    g.selectAll(".fn-ru-bar")
        .data(summary)
        .join("rect")
        .attr("class", "fn-ru-bar")
        .attr("y", d => y(d.roadUser))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.val))
        .attr("rx", 3)
        .attr("fill", "#009E73")
        .attr("stroke", d => (fnSelection.category === "Road User" && fnSelection.value === d.roadUser) ? "#111827" : "none")
        .attr("stroke-width", 2)
        .attr("opacity", d => (!fnSelection.value || (fnSelection.category === "Road User" && fnSelection.value === d.roadUser)) ? 1 : 0.25)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            tooltip.classed("hidden", false)
                .html(`<strong>${d.roadUser}</strong><br/>First Nations Hospitalisations: <strong>${d3.format(",")(d.val)}</strong>`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true))
        .on("click", (event, d) => {
            fnSelection.category = "Road User";
            fnSelection.value = fnSelection.value === d.roadUser ? null : d.roadUser;
            initFirstNationsCharts();
        });
}

document.addEventListener("DOMContentLoaded", () => {
    d3.csv("first_nations_combined.csv", d3.autoType)
        .then(data => {
            rawFnData = data;
            initFirstNationsCharts();
        })
        .catch(err => {
            d3.csv("data/first_nations_combined.csv", d3.autoType)
                .then(data => {
                    rawFnData = data;
                    initFirstNationsCharts();
                })
                .catch(err2 => {
                    console.warn("Could not load first_nations_combined.csv", err2);
                });
        });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => setTimeout(initFirstNationsCharts, 50));
    });

    const yearSelect = document.getElementById("filter-year");
    const resetBtn = document.getElementById("btn-reset-filters");

    if (yearSelect) yearSelect.addEventListener("change", initFirstNationsCharts);
    if (resetBtn) resetBtn.addEventListener("click", () => {
        fnSelection.category = null;
        fnSelection.value = null;
        setTimeout(initFirstNationsCharts, 50);
    });

    window.addEventListener("resize", initFirstNationsCharts);
});