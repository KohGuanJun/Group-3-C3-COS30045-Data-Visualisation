/**
 * demographics.js
 * Renders Road User, Remoteness, Age Group, and Sex charts from KNIME cleaned CSV.
 */

let rawDemoData = [];

function getDemoMetricValue(rows, metric) {
    const injuries = d3.sum(rows, (d) => d["Sum(Hospitalisations)"] || d.Hospitalisations || 0);
    const bedDays = d3.sum(rows, (d) => d["Sum(Bed days)"] || d["Bed days"] || 0);
    if (metric === "Bed_Days") return bedDays;
    if (metric === "Average_Bed_Days") return injuries > 0 ? bedDays / injuries : 0;
    return injuries;
}

function updateDemographicsCharts() {
    if (!rawDemoData.length) return;

    const yearEl = document.getElementById("filter-year");
    const metricEl = document.getElementById("filter-metric");
    const yearVal = yearEl ? yearEl.value : "All";
    const metricVal = metricEl ? metricEl.value : "Hospitalised_Injuries";

    const periodText = yearVal === "All" ? "2011–2021" : yearVal;
    const metricText = (typeof metricLabels !== "undefined" && metricLabels[metricVal])
        ? metricLabels[metricVal]
        : "Hospitalised Injuries";

    // Dynamically update chart titles
    const t1 = document.getElementById("title-demo-1");
    const t2 = document.getElementById("title-demo-2");
    const t3 = document.getElementById("title-demo-3");
    const t4 = document.getElementById("title-demo-4");
    if (t1) t1.textContent = `${metricText} by Road User (${periodText})`;
    if (t2) t2.textContent = `Share by Remoteness Area (${periodText})`;
    if (t3) t3.textContent = `${metricText} by Age Group (${periodText})`;
    if (t4) t4.textContent = `${metricText} by Sex (${periodText})`;

    // Filter dataset by selected year
    const filtered = yearVal === "All"
        ? rawDemoData
        : rawDemoData.filter((d) => String(d["Calendar year"]) === String(yearVal));

    renderHorizontalBar("#chart-road-user", filtered, "Road user", metricVal, "#0072B2");
    renderRemotenessDonut("#chart-remoteness", filtered, metricVal);
    renderVerticalBar("#chart-age", filtered, "Age group", metricVal, "#009E73");
    renderVerticalBar("#chart-sex", filtered, "Sex", metricVal, "#D55E00");
}

function renderHorizontalBar(selector, data, groupCol, metric, barColor) {
    const container = d3.select(selector);
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 560;
    const height = node.clientHeight || 290;
    const margin = { top: 16, right: 65, bottom: 28, left: 155 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const groups = Array.from(new Set(data.map((d) => d[groupCol]))).filter(Boolean);
    const summary = groups.map((key) => {
        const rows = data.filter((d) => d[groupCol] === key);
        return { key, val: getDemoMetricValue(rows, metric) };
    }).sort((a, b) => d3.descending(a.val, b.val));

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
        .domain(summary.map((d) => d.key))
        .range([0, innerHeight])
        .padding(0.25);

    const x = d3.scaleLinear()
        .domain([0, (d3.max(summary, (d) => d.val) || 1) * 1.15])
        .nice()
        .range([0, innerWidth]);

    // X Axis gridlines and ticks
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-innerHeight))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#6b7280");

    // Y Axis category labels
    g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .call((g) => g.select(".domain").remove())
        .selectAll("text")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#374151");

    const tooltip = d3.select("#tooltip");
    const fmt = metric === "Average_Bed_Days" ? d3.format(".2f") : d3.format(",.0f");

    g.selectAll("rect")
        .data(summary)
        .join("rect")
        .attr("y", (d) => y(d.key))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.val))
        .attr("rx", 3)
        .attr("fill", barColor)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            tooltip.classed("hidden", false)
                .html(`<strong>${d.key}</strong><br/>Value: <strong>${fmt(d.val)}</strong>`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true));

    g.selectAll(".val-label")
        .data(summary)
        .join("text")
        .attr("class", "val-label")
        .attr("x", (d) => x(d.val) + 6)
        .attr("y", (d) => y(d.key) + y.bandwidth() / 2 + 4)
        .style("font-size", "10.5px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text((d) => fmt(d.val));
}

function renderVerticalBar(selector, data, groupCol, metric, barColor) {
    const container = d3.select(selector);
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 560;
    const height = node.clientHeight || 290;
    const margin = { top: 22, right: 20, bottom: 38, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const groups = Array.from(new Set(data.map((d) => d[groupCol]))).filter(Boolean);
    const summary = groups.map((key) => {
        const rows = data.filter((d) => d[groupCol] === key);
        return { key, val: getDemoMetricValue(rows, metric) };
    });

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(summary.map((d) => d.key))
        .range([0, innerWidth])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, (d3.max(summary, (d) => d.val) || 1) * 1.15])
        .nice()
        .range([innerHeight, 0]);

    const fmt = metric === "Average_Bed_Days" ? d3.format(".1f") : d3.format(",.0f");

    // Horizontal gridlines
    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(""))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"));

    // X Axis
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call((g) => g.select(".domain").attr("stroke", "#cbd5e1"))
        .selectAll("text")
        .style("font-size", "11.5px")
        .style("font-weight", "600")
        .style("fill", "#374151");

    // Y Axis
    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(fmt))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll("line").remove())
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#6b7280");

    const tooltip = d3.select("#tooltip");

    g.selectAll("rect")
        .data(summary)
        .join("rect")
        .attr("x", (d) => x(d.key))
        .attr("y", (d) => y(d.val))
        .attr("width", x.bandwidth())
        .attr("height", (d) => innerHeight - y(d.val))
        .attr("rx", 3)
        .attr("fill", barColor)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            tooltip.classed("hidden", false)
                .html(`<strong>${d.key}</strong><br/>Value: <strong>${fmt(d.val)}</strong>`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true));

    // Value labels on top of bars
    g.selectAll(".bar-top-label")
        .data(summary)
        .join("text")
        .attr("class", "bar-top-label")
        .attr("x", (d) => x(d.key) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.val) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10.5px")
        .style("font-weight", "600")
        .style("fill", "#4b5563")
        .text((d) => fmt(d.val));
}

function renderRemotenessDonut(selector, data, metric) {
    const container = d3.select(selector);
    if (container.empty()) return;
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 560;
    const height = node.clientHeight || 290;

    const groups = Array.from(new Set(data.map((d) => d["ABS remoteness area"]))).filter(Boolean);
    const useMetric = metric === "Average_Bed_Days" ? "Hospitalised_Injuries" : metric;
    const summary = groups.map((key) => {
        const rows = data.filter((d) => d["ABS remoteness area"] === key);
        return { key, val: getDemoMetricValue(rows, useMetric) };
    }).sort((a, b) => d3.descending(a.val, b.val));

    const total = d3.sum(summary, (d) => d.val) || 1;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const radius = Math.min(width * 0.44, height) / 2 - 16;
    const centerX = width * 0.3;
    const centerY = height / 2;

    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    const color = d3.scaleOrdinal()
        .domain(summary.map((d) => d.key))
        .range(["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#525252"]);

    const pie = d3.pie().value((d) => d.val).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.54).outerRadius(radius);
    const tooltip = d3.select("#tooltip");

    g.selectAll("path")
        .data(pie(summary))
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.key))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            const pct = ((d.data.val / total) * 100).toFixed(1);
            tooltip.classed("hidden", false)
                .html(`<strong>${d.data.key}</strong><br/>Total: <strong>${d3.format(",")(d.data.val)}</strong> (${pct}%)`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true));

    // Donut center total text
    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.2em")
        .style("font-size", "11px")
        .style("fill", "#6b7280")
        .text("Total");

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.1em")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#1f2937")
        .text(d3.format(",")(total));

    // Right legend
    const legend = svg.append("g").attr("transform", `translate(${width * 0.56}, 45)`);
    const rows = legend.selectAll(".leg").data(summary).join("g")
        .attr("class", "leg")
        .attr("transform", (d, i) => `translate(0, ${i * 28})`);

    rows.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("y", -10)
        .attr("fill", (d) => color(d.key));

    rows.append("text")
        .attr("x", 18)
        .attr("y", 0)
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text((d) => d.key);

    rows.append("text")
        .attr("x", 210)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .style("font-size", "11.5px")
        .style("fill", "#4b5563")
        .text((d) => {
            const pct = ((d.val / total) * 100).toFixed(1);
            return `${pct}%`;
        });
}

document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data/demographics.csv", d3.autoType)
        .then((data) => {
            rawDemoData = data;
            updateDemographicsCharts();
        })
        .catch((err) => {
            console.warn("Could not load data/demographics.csv. Make sure the file is in the data/ folder and open with Live Server.", err);
        });

    // Listen to tab switching, year/metric filters, and reset button
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => setTimeout(updateDemographicsCharts, 50));
    });

    const yearSelect = document.getElementById("filter-year");
    const metricSelect = document.getElementById("filter-metric");
    const resetBtn = document.getElementById("btn-reset-filters");

    if (yearSelect) yearSelect.addEventListener("change", updateDemographicsCharts);
    if (metricSelect) metricSelect.addEventListener("change", updateDemographicsCharts);
    if (resetBtn) resetBtn.addEventListener("click", () => setTimeout(updateDemographicsCharts, 50));

    window.addEventListener("resize", updateDemographicsCharts);
});