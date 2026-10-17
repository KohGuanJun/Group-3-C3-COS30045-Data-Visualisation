/**
 * main.js
 * Coordinates default "All" state, dynamic YoY KPI calculations, and interactive chart modes.
 */

const filterState = {
    year: "All",
    state: "All",
    metric: "Hospitalised_Injuries",
    trendMode: "single",   // "single" | "multi" | "indexed"
    barMode: "raw",        // "raw" | "share"
    sort: "value-desc"
};

let rawStateData = [];

const metricLabels = {
    Hospitalised_Injuries: "Hospitalised Injuries",
    Bed_Days: "Total Bed Days",
    Average_Bed_Days: "Average Bed Days"
};

function getStateSummaryForSelectedYear() {
    const yearRows =
        filterState.year === "All"
            ? rawStateData
            : rawStateData.filter((d) => String(d.Year) === String(filterState.year));

    const states = Array.from(new Set(rawStateData.map((d) => d.State)));

    return states.map((st) => {
        const rows = yearRows.filter((d) => d.State === st);
        const injuries = d3.sum(rows, (d) => d.Hospitalised_Injuries);
        const bedDays = d3.sum(rows, (d) => d.Bed_Days);
        const avgBed = injuries > 0 ? bedDays / injuries : 0;
        return {
            State: st,
            Hospitalised_Injuries: injuries,
            Bed_Days: bedDays,
            Average_Bed_Days: avgBed
        };
    });
}

function updateKPIs() {
    const kpiRows = rawStateData.filter((d) => {
        const matchYear = filterState.year === "All" || String(d.Year) === String(filterState.year);
        const matchState = filterState.state === "All" || d.State === filterState.state;
        return matchYear && matchState;
    });

    const totalInjuries = d3.sum(kpiRows, (d) => d.Hospitalised_Injuries);
    const totalBedDays = d3.sum(kpiRows, (d) => d.Bed_Days);
    const weightedAvgBedDays = totalInjuries > 0 ? totalBedDays / totalInjuries : 0;

    document.getElementById("kpi-total-injuries").textContent = d3.format(",")(totalInjuries);
    document.getElementById("kpi-total-beddays").textContent = d3.format(",")(totalBedDays);
    document.getElementById("kpi-avg-beddays").textContent = weightedAvgBedDays.toFixed(2);

    // Dynamic YoY or 10-year change subtitle
    const injSub = document.getElementById("kpi-injuries-sub");
    if (filterState.year === "All") {
        const rows2011 = rawStateData.filter(
            (d) => d.Year === 2011 && (filterState.state === "All" || d.State === filterState.state)
        );
        const rows2021 = rawStateData.filter(
            (d) => d.Year === 2021 && (filterState.state === "All" || d.State === filterState.state)
        );
        const sum2011 = d3.sum(rows2011, (d) => d.Hospitalised_Injuries);
        const sum2021 = d3.sum(rows2021, (d) => d.Hospitalised_Injuries);
        const pct10Yr = sum2011 > 0 ? (((sum2021 - sum2011) / sum2011) * 100).toFixed(1) : "0.0";
        const sign = pct10Yr >= 0 ? "+" : "";
        injSub.innerHTML = `2011–2021 total (<span class="${pct10Yr >= 0 ? "yoy-up" : "yoy-down"}">${sign}${pct10Yr}%</span> from 2011 to 2021)`;
    } else {
        const yrNum = Number(filterState.year);
        if (yrNum > 2011) {
            const prevRows = rawStateData.filter(
                (d) => d.Year === yrNum - 1 && (filterState.state === "All" || d.State === filterState.state)
            );
            const prevSum = d3.sum(prevRows, (d) => d.Hospitalised_Injuries);
            const yoy = prevSum > 0 ? (((totalInjuries - prevSum) / prevSum) * 100).toFixed(1) : "0.0";
            const sign = yoy >= 0 ? "+" : "";
            injSub.innerHTML = `<span class="${yoy >= 0 ? "yoy-up" : "yoy-down"}">${sign}${yoy}%</span> vs ${yrNum - 1} (${d3.format(",")(prevSum)})`;
        } else {
            injSub.textContent = "Baseline reporting year (2011)";
        }
    }
}

function updateDashboard() {
    if (!rawStateData.length) return;

    const periodText = filterState.year === "All" ? "2011–2021" : filterState.year;
    const stateText = filterState.state === "All" ? "All Australia" : filterState.state;
    const metricText = metricLabels[filterState.metric];

    // Header badge
    document.getElementById("active-year-label").textContent =
        filterState.state === "All" ? periodText : `${filterState.state} (${periodText})`;

    // Chart titles
    if (filterState.trendMode === "indexed") {
        document.getElementById("title-chart-1").textContent =
            `% Change in ${metricText} Since 2011`;
    } else if (filterState.trendMode === "multi") {
        document.getElementById("title-chart-1").textContent =
            `State-by-State ${metricText}, 2011–2021`;
    } else {
        document.getElementById("title-chart-1").textContent =
            `Annual ${metricText}, 2011–2021 (${stateText})`;
    }

    document.getElementById("title-chart-2").textContent =
        `${metricText} by State (${periodText})`;
    document.getElementById("title-chart-3").textContent =
        `Average Bed Days by State (${periodText})`;
    document.getElementById("title-chart-4").textContent =
        `State Share of Hospitalised Injuries (${periodText})`;

    updateKPIs();

    const stateSummary = getStateSummaryForSelectedYear();
    const natTotalInjuries = d3.sum(stateSummary, (d) => d.Hospitalised_Injuries);
    const natTotalBedDays = d3.sum(stateSummary, (d) => d.Bed_Days);
    const nationalAvgBedDays = natTotalInjuries > 0 ? natTotalBedDays / natTotalInjuries : 0;

    renderChart1Trend(
        rawStateData,
        filterState,
        (clickedYear) => {
            filterState.year = clickedYear;
            document.getElementById("filter-year").value = clickedYear;
            updateDashboard();
        },
        (clickedState) => {
            filterState.state = clickedState;
            document.getElementById("filter-state").value = clickedState;
            updateDashboard();
        }
    );

    renderChart2StateBars(stateSummary, filterState, (clickedState) => {
        filterState.state = clickedState;
        document.getElementById("filter-state").value = clickedState;
        updateDashboard();
    });

    renderChart3BedDays(stateSummary, nationalAvgBedDays, filterState, (clickedState) => {
        filterState.state = clickedState;
        document.getElementById("filter-state").value = clickedState;
        updateDashboard();
    });

    renderChart4StateShareDonut(stateSummary, filterState, (clickedState) => {
        filterState.state = clickedState;
        document.getElementById("filter-state").value = clickedState;
        updateDashboard();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((tab) => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
            document.querySelectorAll(".view-section").forEach((s) => s.classList.remove("active"));

            tab.classList.add("active");
            const target = document.getElementById(`view-${tab.dataset.view}`);
            if (target) target.classList.add("active");
        });
    });

    // Dropdown listeners
    document.getElementById("filter-year").addEventListener("change", (e) => {
        filterState.year = e.target.value;
        updateDashboard();
    });

    document.getElementById("filter-state").addEventListener("change", (e) => {
        filterState.state = e.target.value;
        updateDashboard();
    });

    document.getElementById("filter-metric").addEventListener("change", (e) => {
        filterState.metric = e.target.value;
        updateDashboard();
    });

    document.getElementById("filter-trend-mode").addEventListener("change", (e) => {
        filterState.trendMode = e.target.value;
        updateDashboard();
    });

    document.getElementById("filter-sort").addEventListener("change", (e) => {
        filterState.sort = e.target.value;
        updateDashboard();
    });

    // Inline toggle for Chart 2 (Raw Count vs % Share)
    document.querySelectorAll("#toggle-bar-mode .mini-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#toggle-bar-mode .mini-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            filterState.barMode = btn.dataset.barmode;
            updateDashboard();
        });
    });

    // Reset button (resets to All)
    document.getElementById("btn-reset-filters").addEventListener("click", () => {
        filterState.year = "All";
        filterState.state = "All";
        filterState.metric = "Hospitalised_Injuries";
        filterState.trendMode = "single";
        filterState.barMode = "raw";
        filterState.sort = "value-desc";

        document.getElementById("filter-year").value = "All";
        document.getElementById("filter-state").value = "All";
        document.getElementById("filter-metric").value = "Hospitalised_Injuries";
        document.getElementById("filter-trend-mode").value = "single";
        document.getElementById("filter-sort").value = "value-desc";

        document.querySelectorAll("#toggle-bar-mode .mini-btn").forEach((b) => {
            b.classList.toggle("active", b.dataset.barmode === "raw");
        });

        updateDashboard();
    });

    // Load CSV
    d3.csv("data/state_by_year.csv", d3.autoType)
        .then((data) => {
            rawStateData = data;
            updateDashboard();
        })
        .catch((err) => {
            console.warn("Could not fetch data/state_by_year.csv via file://. Open with Live Server or HTTP server.", err);
        });

    window.addEventListener("resize", () => updateDashboard());
});
