/**
 * chart1.js
 * Chart 1: Annual Trend Line Chart (2011–2021)
 *   - Supports 3 modes:
 *     1) "single": Aggregate trend line
 *     2) "multi": Multi-state comparison (all 8 states on one chart)
 *     3) "indexed": % Change since 2011
 * Chart 2: State Comparison Vertical Bar Chart
 *   - Supports "raw" (Raw Count) vs "share" (% Share of National Total)
 */

const STATE_COLORS = {
    Vic: "#1d4ed8",
    Qld: "#0284c7",
    NSW: "#2563eb",
    WA: "#0d9488",
    SA: "#4f46e5",
    Tas: "#ea580c",
    NT: "#d97706",
    ACT: "#64748b"
};

function renderChart1Trend(data, filterState, onSelectYear, onSelectState) {
    const container = d3.select("#chart-1");
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 210;
    const margin = { top: 20, right: 48, bottom: 36, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const years = Array.from(new Set(data.map((d) => d.Year))).sort(d3.ascending);
    const states = Array.from(new Set(data.map((d) => d.State)));
    const metric = filterState.metric;
    const mode = filterState.trendMode; // "single" | "multi" | "indexed"

    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
        .scalePoint()
        .domain(years)
        .range([0, innerWidth])
        .padding(0.25);

    const tooltip = d3.select("#tooltip");

    if (mode === "single") {
        const filteredByState =
            filterState.state === "All"
                ? data
                : data.filter((d) => d.State === filterState.state);

        const trendSeries = years.map((yr) => {
            const rows = filteredByState.filter((d) => d.Year === yr);
            const totalInjuries = d3.sum(rows, (d) => d.Hospitalised_Injuries);
            const totalBedDays = d3.sum(rows, (d) => d.Bed_Days);
            const avgBedDays = totalInjuries > 0 ? totalBedDays / totalInjuries : 0;
            return {
                Year: yr,
                Hospitalised_Injuries: totalInjuries,
                Bed_Days: totalBedDays,
                Average_Bed_Days: avgBedDays
            };
        });

        const maxVal = d3.max(trendSeries, (d) => d[metric]) || 1;
        const minVal = d3.min(trendSeries, (d) => d[metric]) || 0;

        const y = d3
            .scaleLinear()
            .domain([Math.max(0, minVal * 0.88), maxVal * 1.08])
            .nice()
            .range([innerHeight, 0]);

        // Gridlines
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
            .style("font-weight", (d) => (String(d) === String(filterState.year) ? "700" : "400"))
            .style("fill", (d) => (String(d) === String(filterState.year) ? "#2563eb" : "#4b5563"));

        // Y Axis
        const yFormat = metric === "Average_Bed_Days" ? d3.format(".1f") : d3.format(",");
        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(yFormat))
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll("line").remove())
            .selectAll("text")
            .style("font-size", "11px")
            .style("fill", "#6b7280");

        const line = d3
            .line()
            .x((d) => x(d.Year))
            .y((d) => y(d[metric]));

        g.append("path")
            .datum(trendSeries)
            .attr("fill", "none")
            .attr("stroke", "#2563eb")
            .attr("stroke-width", 2.5)
            .attr("d", line);

        g.selectAll(".year-dot")
            .data(trendSeries)
            .join("circle")
            .attr("class", "year-dot")
            .attr("cx", (d) => x(d.Year))
            .attr("cy", (d) => y(d[metric]))
            .attr("r", (d) => (String(d.Year) === String(filterState.year) ? 6.5 : 4.5))
            .attr("fill", (d) => (String(d.Year) === String(filterState.year) ? "#1d4ed8" : "#2563eb"))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mouseenter", (event, d) => {
                const idx = trendSeries.findIndex((item) => item.Year === d.Year);
                let yoyHtml = "";
                if (idx > 0) {
                    const prev = trendSeries[idx - 1][metric];
                    const diffPct = prev > 0 ? (((d[metric] - prev) / prev) * 100).toFixed(1) : "0.0";
                    const sign = diffPct >= 0 ? "+" : "";
                    yoyHtml = `<br/>YoY Change: <strong>${sign}${diffPct}%</strong> vs ${d.Year - 1}`;
                }
                const scopeName = filterState.state === "All" ? "All Australia" : filterState.state;
                tooltip
                    .classed("hidden", false)
                    .html(
                        `<strong>${scopeName} (${d.Year})</strong><br/>` +
                        `Injuries: <strong>${d3.format(",")(d.Hospitalised_Injuries)}</strong><br/>` +
                        `Bed Days: <strong>${d3.format(",")(d.Bed_Days)}</strong><br/>` +
                        `Avg Bed Days: <strong>${d.Average_Bed_Days.toFixed(2)}</strong>` +
                        yoyHtml
                    );
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseleave", () => tooltip.classed("hidden", true))
            .on("click", (event, d) => {
                if (onSelectYear) {
                    const nextYear = String(filterState.year) === String(d.Year) ? "All" : String(d.Year);
                    onSelectYear(nextYear);
                }
            });
    } else {
        // Mode "multi" (all 8 states raw metric) OR "indexed" (% change since 2011)
        const stateSeries = states.map((st) => {
            const rows = data
                .filter((d) => d.State === st)
                .sort((a, b) => d3.ascending(a.Year, b.Year));
            const base2011 = rows[0] ? rows[0][metric] : 1;
            return {
                State: st,
                values: rows.map((r) => ({
                    Year: r.Year,
                    State: st,
                    rawVal: r[metric],
                    plotVal: mode === "indexed" ? ((r[metric] - base2011) / base2011) * 100 : r[metric]
                }))
            };
        });

        const allVals = stateSeries.flatMap((s) => s.values.map((v) => v.plotVal));
        const yMin = d3.min(allVals) || 0;
        const yMax = d3.max(allVals) || 1;

        const y = d3
            .scaleLinear()
            .domain([mode === "indexed" ? Math.min(-25, yMin * 1.1) : 0, yMax * 1.1])
            .nice()
            .range([innerHeight, 0]);

        // Gridlines
        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(""))
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"));

        if (mode === "indexed") {
            g.append("line")
                .attr("x1", 0)
                .attr("x2", innerWidth)
                .attr("y1", y(0))
                .attr("y2", y(0))
                .attr("stroke", "#9ca3af")
                .attr("stroke-width", 1.5);
        }

        // X Axis
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call((g) => g.select(".domain").attr("stroke", "#cbd5e1"))
            .selectAll("text")
            .style("font-size", "11.5px")
            .style("fill", "#4b5563");

        // Y Axis
        const yFormat =
            mode === "indexed"
                ? (v) => `${v > 0 ? "+" : ""}${Math.round(v)}%`
                : metric === "Average_Bed_Days"
                ? d3.format(".1f")
                : d3.format(",");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(yFormat))
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll("line").remove())
            .selectAll("text")
            .style("font-size", "11px")
            .style("fill", "#6b7280");

        const line = d3
            .line()
            .x((d) => x(d.Year))
            .y((d) => y(d.plotVal));

        const stateGroups = g
            .selectAll(".state-series")
            .data(stateSeries)
            .join("g")
            .attr("class", "state-series");

        stateGroups
            .append("path")
            .attr("fill", "none")
            .attr("stroke", (d) => STATE_COLORS[d.State] || "#2563eb")
            .attr("stroke-width", (d) =>
                filterState.state === d.State ? 3.2 : filterState.state === "All" ? 2 : 1.2
            )
            .attr("opacity", (d) =>
                filterState.state === "All" || filterState.state === d.State ? 0.95 : 0.2
            )
            .attr("d", (d) => line(d.values))
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                if (onSelectState) {
                    const nextSt = filterState.state === d.State ? "All" : d.State;
                    onSelectState(nextSt);
                }
            });

        stateGroups
            .append("text")
            .datum((d) => ({ State: d.State, last: d.values[d.values.length - 1] }))
            .attr("x", (d) => x(d.last.Year) + 6)
            .attr("y", (d) => y(d.last.plotVal) + 4)
            .style("font-size", "10.5px")
            .style("font-weight", "700")
            .style("fill", (d) => STATE_COLORS[d.State] || "#374151")
            .attr("opacity", (d) =>
                filterState.state === "All" || filterState.state === d.State ? 1 : 0.25
            )
            .text((d) => d.State);

        stateGroups
            .selectAll("circle")
            .data((d) => d.values)
            .join("circle")
            .attr("cx", (d) => x(d.Year))
            .attr("cy", (d) => y(d.plotVal))
            .attr("r", 3.5)
            .attr("fill", (d) => STATE_COLORS[d.State] || "#2563eb")
            .attr("opacity", (d) =>
                filterState.state === "All" || filterState.state === d.State ? 0.95 : 0.15
            )
            .style("cursor", "pointer")
            .on("mouseenter", (event, d) => {
                const rawFormatted =
                    metric === "Average_Bed_Days" ? d.rawVal.toFixed(2) : d3.format(",")(d.rawVal);
                const pctStr = `${d.plotVal >= 0 ? "+" : ""}${d.plotVal.toFixed(1)}% vs 2011`;
                tooltip
                    .classed("hidden", false)
                    .html(
                        `<strong>${d.State} (${d.Year})</strong><br/>` +
                        `Value: <strong>${rawFormatted}</strong><br/>` +
                        `Growth since 2011: <strong>${pctStr}</strong>`
                    );
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseleave", () => tooltip.classed("hidden", true))
            .on("click", (event, d) => {
                if (onSelectState) {
                    const nextSt = filterState.state === d.State ? "All" : d.State;
                    onSelectState(nextSt);
                }
            });
    }
}

function renderChart2StateBars(stateSummary, filterState, onSelectState) {
    const container = d3.select("#chart-2");
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 210;
    const margin = { top: 18, right: 20, bottom: 28, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const metric = filterState.metric;
    const totalAcrossStates = d3.sum(stateSummary, (d) => d[metric]) || 1;
    const isShare = filterState.barMode === "share";

    const enriched = stateSummary.map((d) => ({
        ...d,
        plotVal: isShare ? (d[metric] / totalAcrossStates) * 100 : d[metric]
    }));

    if (filterState.sort === "value-desc") {
        enriched.sort((a, b) => d3.descending(a.plotVal, b.plotVal));
    } else if (filterState.sort === "value-asc") {
        enriched.sort((a, b) => d3.ascending(a.plotVal, b.plotVal));
    } else {
        enriched.sort((a, b) => d3.ascending(a.State, b.State));
    }

    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
        .scaleBand()
        .domain(enriched.map((d) => d.State))
        .range([0, innerWidth])
        .padding(0.28);

    const y = d3
        .scaleLinear()
        .domain([0, (d3.max(enriched, (d) => d.plotVal) || 1) * 1.14])
        .nice()
        .range([innerHeight, 0]);

    // Gridlines
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
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#374151");

    // Y Axis
    const yFormat = isShare
        ? (v) => `${v.toFixed(0)}%`
        : metric === "Average_Bed_Days"
        ? d3.format(".1f")
        : d3.format(",");

    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(yFormat))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll("line").remove())
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#6b7280");

    const tooltip = d3.select("#tooltip");

    g.selectAll(".state-bar")
        .data(enriched)
        .join("rect")
        .attr("class", "state-bar")
        .attr("x", (d) => x(d.State))
        .attr("y", (d) => y(d.plotVal))
        .attr("width", x.bandwidth())
        .attr("height", (d) => innerHeight - y(d.plotVal))
        .attr("rx", 3)
        .attr("fill", (d) => (filterState.state === d.State ? "#1d4ed8" : "#3b82f6"))
        .attr("opacity", (d) =>
            filterState.state === "All" || filterState.state === d.State ? 1 : 0.35
        )
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            const sharePct = ((d[metric] / totalAcrossStates) * 100).toFixed(1);
            tooltip
                .classed("hidden", false)
                .html(
                    `<strong>State: ${d.State}</strong><br/>` +
                    `Injuries: <strong>${d3.format(",")(d.Hospitalised_Injuries)}</strong><br/>` +
                    `Bed Days: <strong>${d3.format(",")(d.Bed_Days)}</strong><br/>` +
                    `Avg Bed Days: <strong>${d.Average_Bed_Days.toFixed(2)}</strong><br/>` +
                    `Share of Selected Metric: <strong>${sharePct}%</strong>`
                );
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", `${event.pageX + 12}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip.classed("hidden", true))
        .on("click", (event, d) => {
            if (onSelectState) {
                const nextState = filterState.state === d.State ? "All" : d.State;
                onSelectState(nextState);
            }
        });

    // Value labels on top of bars
    g.selectAll(".bar-top-label")
        .data(enriched)
        .join("text")
        .attr("class", "bar-top-label")
        .attr("x", (d) => x(d.State) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.plotVal) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10.5px")
        .style("font-weight", "600")
        .style("fill", "#4b5563")
        .text((d) =>
            isShare
                ? `${d.plotVal.toFixed(1)}%`
                : metric === "Average_Bed_Days"
                ? d.plotVal.toFixed(1)
                : d3.format(",.0f")(d.plotVal)
        );
}
