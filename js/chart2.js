/**
 * chart2.js
 * Chart 3: Average Bed Days by State (Horizontal Bar Chart with National Average Reference Line)
 * Chart 4: State Share of Hospitalised Injuries (Pie / Donut Chart with Legend)
 */

function renderChart3BedDays(stateSummary, nationalAvgBedDays, filterState, onSelectState) {
    const container = d3.select("#chart-3");
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 560;
    const height = node.clientHeight || 290;
    const margin = { top: 18, right: 56, bottom: 32, left: 52 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const sorted = [...stateSummary].sort((a, b) =>
        d3.descending(a.Average_Bed_Days, b.Average_Bed_Days)
    );

    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
        .scaleBand()
        .domain(sorted.map((d) => d.State))
        .range([0, innerHeight])
        .padding(0.28);

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
        .style("fill", "#6b7280");

    // Y Axis
    g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .call((g) => g.select(".domain").remove())
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#374151");

    const tooltip = d3.select("#tooltip");

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
            d.Average_Bed_Days > nationalAvgBedDays ? "#0284c7" : "#64748b"
        )
        .attr("opacity", (d) =>
            filterState.state === "All" || filterState.state === d.State ? 1 : 0.35
        )
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
            tooltip
                .classed("hidden", false)
                .html(
                    `<strong>${d.State}</strong><br/>` +
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
        });

    // Value Labels
    g.selectAll(".bed-label")
        .data(sorted)
        .join("text")
        .attr("class", "bed-label")
        .attr("x", (d) => x(d.Average_Bed_Days) + 6)
        .attr("y", (d) => y(d.State) + y.bandwidth() / 2 + 4)
        .text((d) => `${d.Average_Bed_Days.toFixed(1)}d`)
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#374151");

    // National Average Reference Line
    if (nationalAvgBedDays > 0) {
        g.append("line")
            .attr("x1", x(nationalAvgBedDays))
            .attr("x2", x(nationalAvgBedDays))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#dc2626")
            .attr("stroke-width", 1.8)
            .attr("stroke-dasharray", "4,4");
    }
}

function renderChart4StateShareDonut(stateSummary, filterState, onSelectState) {
    const container = d3.select("#chart-4");
    container.selectAll("*").remove();

    const node = container.node();
    const width = node.clientWidth || 560;
    const height = node.clientHeight || 290;

    const sorted = [...stateSummary].sort((a, b) =>
        d3.descending(a.Hospitalised_Injuries, b.Hospitalised_Injuries)
    );

    const totalInjuries = d3.sum(sorted, (d) => d.Hospitalised_Injuries);

    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const radius = Math.min(width * 0.44, height) / 2 - 16;
    const centerX = width * 0.32;
    const centerY = height / 2;

    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    const color = d3
        .scaleOrdinal()
        .domain(["NSW", "Vic", "Qld", "WA", "SA", "Tas", "NT", "ACT"])
        .range([
            "#1d4ed8",
            "#2563eb",
            "#3b82f6",
            "#0284c7",
            "#0ea5e9",
            "#38bdf8",
            "#64748b",
            "#94a3b8"
        ]);

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
        .attr("fill", (d) => color(d.data.State))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("opacity", (d) =>
            filterState.state === "All" || filterState.state === d.data.State ? 1 : 0.35
        )
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
        });

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.2em")
        .style("font-size", "11px")
        .style("fill", "#6b7280")
        .text("Total");

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.1em")
        .style("font-size", "15px")
        .style("font-weight", "700")
        .style("fill", "#1f2937")
        .text(d3.format(",")(totalInjuries));

    const legend = svg.append("g").attr("transform", `translate(${width * 0.6}, 26)`);

    const rows = legend
        .selectAll(".legend-item")
        .data(sorted)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 28})`)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            if (onSelectState) {
                const nextState = filterState.state === d.State ? "All" : d.State;
                onSelectState(nextState);
            }
        });

    rows.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("y", -10)
        .attr("fill", (d) => color(d.State));

    rows.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text((d) => d.State);

    rows.append("text")
        .attr("x", 155)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "#4b5563")
        .text((d) => {
            const pct = ((d.Hospitalised_Injuries / totalInjuries) * 100).toFixed(1);
            return `${d3.format(",")(d.Hospitalised_Injuries)} (${pct}%)`;
        });
}
