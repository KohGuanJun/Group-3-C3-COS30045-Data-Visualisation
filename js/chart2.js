/**
 * chart2.js
 * Renders Chart 3 (Average Bed Days Horizontal Bar Chart with National Benchmark)
 * and Chart 4 (State Share Donut Chart with Accessible Okabe-Ito Palette).
 *
 * Accessibility & Design Features:
 * - High-contrast dark charcoal benchmark line (replaces red dashed line for CVD safety).
 * - Distinct Okabe-Ito 8-colour palette + white slice borders on Donut chart so every state
 *   is clearly distinguishable for colourblind and low-vision users.
 *
 * GenAI Acknowledgement:
 * D3 v7 horizontal bar benchmark layout and responsive donut legend positioning were refined
 * with AI assistance (Prompts: accessible benchmark bar chart and Okabe-Ito donut chart in D3 v7).
 */

function renderChart3BedDays(stateSummary, nationalAvgBedDays, filterState, onSelectState) {
    const container = d3.select("#chart-3");
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 205;
    const margin = { top: 20, right: 56, bottom: 26, left: 48 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const sorted = [...stateSummary].sort((a, b) =>
        d3.descending(a.Average_Bed_Days, b.Average_Bed_Days)
    );

    const svg = container
        .append("svg")
        .attr("role", "img")
        .attr("aria-labelledby", "chart3-svg-title chart3-svg-desc")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");
    svg.append("title").attr("id", "chart3-svg-title").text("Average Bed Days by State");
    svg.append("desc").attr("id", "chart3-svg-desc").text("Horizontal bar chart comparing average hospital bed days per road crash injury across Australian states, with a dashed vertical benchmark line showing the national average. Click a bar to filter to that state.");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
        .scaleBand()
        .domain(sorted.map((d) => d.State))
        .range([0, innerHeight])
        .padding(0.26);

    const x = d3
        .scaleLinear()
        .domain([0, (d3.max(sorted, (d) => d.Average_Bed_Days) || 1) * 1.15])
        .nice()
        .range([0, innerWidth]);

    // X Axis
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-innerHeight))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#4b5563");

    // Y Axis
    g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .call((g) => g.select(".domain").remove())
        .selectAll("text")
        .style("font-size", "11.5px")
        .style("font-weight", "700")
        .style("fill", "#1f2937");

    const tooltip = d3.select("#tooltip");

    // Bars: High-contrast Strong Blue (#0072B2) for above national avg, muted slate (#8C96A6) for below
    g.selectAll(".bed-bar")
        .data(sorted)
        .join("rect")
        .attr("class", "bed-bar")
        .attr("y", (d) => y(d.State))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.Average_Bed_Days))
        .attr("rx", 3)
        .attr("fill", (d) =>
            d.Average_Bed_Days >= nationalAvgBedDays ? UI_COLORS.aboveAvgBar : UI_COLORS.belowAvgBar
        )
        .attr("stroke", (d) => (filterState.state === d.State ? "#111827" : "none"))
        .attr("stroke-width", 2)
        .attr("opacity", (d) =>
            filterState.state === "All" || filterState.state === d.State ? 1 : 0.28
        )
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", (d) => {
            const status = d.Average_Bed_Days >= nationalAvgBedDays ? "above" : "below";
            return `${d.State}: ${d.Average_Bed_Days.toFixed(2)} average bed days, ${status} national average of ${nationalAvgBedDays.toFixed(2)}. Click to filter to ${d.State}.`;
        })
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            const statusText =
                d.Average_Bed_Days >= nationalAvgBedDays ? "Above national avg" : "Below national avg";
            tooltip
                .classed("hidden", false)
                .html(
                    `<strong>${d.State}</strong> (${statusText})<br/>` +
                    `Avg Bed Days: <strong>${d.Average_Bed_Days.toFixed(2)} days</strong><br/>` +
                    `National Avg: <strong>${nationalAvgBedDays.toFixed(2)} days</strong>`
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
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (onSelectState) {
                    const nextState = filterState.state === d.State ? "All" : d.State;
                    onSelectState(nextState);
                }
            }
        });

    // Direct Value Labels
    g.selectAll(".bed-label")
        .data(sorted)
        .join("text")
        .attr("class", "bed-label")
        .attr("x", (d) => x(d.Average_Bed_Days) + 6)
        .attr("y", (d) => y(d.State) + y.bandwidth() / 2 + 4)
        .text((d) => `${d.Average_Bed_Days.toFixed(1)}d`)
        .style("font-size", "11px")
        .style("font-weight", "700")
        .style("fill", "#1f2937");

    // High-contrast Dark Charcoal Benchmark Line + Direct Label (Colourblind-safe)
    if (nationalAvgBedDays > 0) {
        g.append("line")
            .attr("x1", x(nationalAvgBedDays))
            .attr("x2", x(nationalAvgBedDays))
            .attr("y1", -4)
            .attr("y2", innerHeight)
            .attr("stroke", UI_COLORS.benchmarkLine)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,3");

        g.append("text")
            .attr("x", x(nationalAvgBedDays))
            .attr("y", -7)
            .attr("text-anchor", "middle")
            .style("font-size", "10.5px")
            .style("font-weight", "700")
            .style("fill", "#111827")
            .text(`Avg: ${nationalAvgBedDays.toFixed(1)}d`);
    }
}

function renderChart4StateShareDonut(stateSummary, filterState, onSelectState) {
    const container = d3.select("#chart-4");
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 540;
    const height = node.clientHeight || 205;

    const sorted = [...stateSummary].sort((a, b) =>
        d3.descending(a.Hospitalised_Injuries, b.Hospitalised_Injuries)
    );

    const totalInjuries = d3.sum(sorted, (d) => d.Hospitalised_Injuries);

    const svg = container
        .append("svg")
        .attr("role", "img")
        .attr("aria-labelledby", "chart4-svg-title chart4-svg-desc")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");
    svg.append("title").attr("id", "chart4-svg-title").text("State Share of Hospitalised Injuries");
    svg.append("desc").attr("id", "chart4-svg-desc").text("Donut chart showing each Australian state and territory's proportional share of total hospitalised road crash injuries. Click a slice or legend item to filter all charts to that state.");

    const radius = Math.min(width * 0.42, height) / 2 - 12;
    const centerX = width * 0.28;
    const centerY = height / 2;

    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    const pie = d3
        .pie()
        .value((d) => d.Hospitalised_Injuries)
        .sort(null);

    const arc = d3
        .arc()
        .innerRadius(radius * 0.54)
        .outerRadius(radius);

    const tooltip = d3.select("#tooltip");

    g.selectAll("path")
        .data(pie(sorted))
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => STATE_PALETTE[d.data.State] || UI_COLORS.primaryLine)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2.2)
        .attr("opacity", (d) =>
            filterState.state === "All" || filterState.state === d.data.State ? 1 : 0.25
        )
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", (d) => {
            const pct = ((d.data.Hospitalised_Injuries / totalInjuries) * 100).toFixed(1);
            return `${d.data.State}: ${d3.format(",")(d.data.Hospitalised_Injuries)} injuries (${pct}%). Click to filter to ${d.data.State}.`;
        })
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            const pct = ((d.data.Hospitalised_Injuries / totalInjuries) * 100).toFixed(1);
            tooltip
                .classed("hidden", false)
                .html(
                    `<strong>${d.data.State}</strong><br/>` +
                    `Injuries: <strong>${d3.format(",")(d.data.Hospitalised_Injuries)}</strong> (${pct}%)`
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
                const nextState = filterState.state === d.data.State ? "All" : d.data.State;
                onSelectState(nextState);
            }
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (onSelectState) {
                    const nextState = filterState.state === d.data.State ? "All" : d.data.State;
                    onSelectState(nextState);
                }
            }
        });

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.2em")
        .style("font-size", "11px")
        .style("fill", "#4b5563")
        .text("Total");

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.1em")
        .style("font-size", "14.5px")
        .style("font-weight", "700")
        .style("fill", "#111827")
        .text(d3.format(",")(totalInjuries));

    // Accessible Right Legend with distinct swatches + aligned numbers & percentages
    const rowSpacing = Math.min(22, (height - 20) / Math.max(sorted.length, 1));
    const startY = (height - (sorted.length - 1) * rowSpacing) / 2;
    const legend = svg.append("g").attr("transform", `translate(${width * 0.54}, ${startY})`);

    const rows = legend
        .selectAll(".legend-item")
        .data(sorted)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * rowSpacing})`)
        .attr("opacity", (d) =>
            filterState.state === "All" || filterState.state === d.State ? 1 : 0.35
        )
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", (d) => {
            const pct = ((d.Hospitalised_Injuries / totalInjuries) * 100).toFixed(1);
            return `${d.State}: ${d3.format(",")(d.Hospitalised_Injuries)} (${pct}%). Click to filter to ${d.State}.`;
        })
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            if (onSelectState) {
                const nextState = filterState.state === d.State ? "All" : d.State;
                onSelectState(nextState);
            }
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (onSelectState) {
                    const nextState = filterState.state === d.State ? "All" : d.State;
                    onSelectState(nextState);
                }
            }
        });

    rows.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("y", -10)
        .attr("fill", (d) => STATE_PALETTE[d.State] || UI_COLORS.primaryLine);

    rows.append("text")
        .attr("x", 18)
        .attr("y", 0)
        .style("font-size", "12px")
        .style("font-weight", "700")
        .style("fill", "#1f2937")
        .text((d) => d.State);

    rows.append("text")
        .attr("x", 185)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .style("font-size", "11.5px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text((d) => {
            const pct = ((d.Hospitalised_Injuries / totalInjuries) * 100).toFixed(1);
            return `${d3.format(",")(d.Hospitalised_Injuries)} (${pct}%)`;
        });
}
