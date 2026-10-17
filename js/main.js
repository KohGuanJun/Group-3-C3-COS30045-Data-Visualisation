/**
 * main.js
 * Handles tab navigation and filter selections.
 */

const filterState = {
    year: "2021",
    remoteness: "All",
    roadUser: "All",
    sex: "All",
    ageGroup: "All"
};

function updateFilterUI() {
    const label = filterState.year === "All" ? "2011–2021" : filterState.year;
    const badge = document.getElementById("active-year-label");
    if (badge) badge.textContent = label;
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

    // Filter listeners
    const yearSelect = document.getElementById("filter-year");
    const remotenessSelect = document.getElementById("filter-remoteness");
    const roadUserSelect = document.getElementById("filter-roaduser");
    const sexSelect = document.getElementById("filter-sex");
    const ageSelect = document.getElementById("filter-age");

    if (yearSelect) {
        yearSelect.addEventListener("change", (e) => {
            filterState.year = e.target.value;
            updateFilterUI();
        });
    }
    if (remotenessSelect) {
        remotenessSelect.addEventListener("change", (e) => {
            filterState.remoteness = e.target.value;
        });
    }
    if (roadUserSelect) {
        roadUserSelect.addEventListener("change", (e) => {
            filterState.roadUser = e.target.value;
        });
    }
    if (sexSelect) {
        sexSelect.addEventListener("change", (e) => {
            filterState.sex = e.target.value;
        });
    }
    if (ageSelect) {
        ageSelect.addEventListener("change", (e) => {
            filterState.ageGroup = e.target.value;
        });
    }

    // Reset button
    const resetBtn = document.getElementById("btn-reset-filters");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            filterState.year = "2021";
            filterState.remoteness = "All";
            filterState.roadUser = "All";
            filterState.sex = "All";
            filterState.ageGroup = "All";

            if (yearSelect) yearSelect.value = "2021";
            if (remotenessSelect) remotenessSelect.value = "All";
            if (roadUserSelect) roadUserSelect.value = "All";
            if (sexSelect) sexSelect.value = "All";
            if (ageSelect) ageSelect.value = "All";

            updateFilterUI();
        });
    }
});
