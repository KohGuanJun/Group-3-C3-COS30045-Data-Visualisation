# Group 3 (C3) - COS30045 Data Visualisation Project (2026)

## Hospitalised Injuries from Road Crashes in Australia (2011–2021)

### Project Overview
This interactive web visualisation project critically analyses and communicates trends related to hospitalised injuries from road traffic accidents in Australia between 2011 and 2021, based on open-access datasets from the **Bureau of Infrastructure and Transport Research Economics (BITRE)**.

---

### Repository Structure
```text
Group-3-C3-COS30045-Data-Visualisation/
├── index.html                  # Main interactive D3 dashboard & data story webpage
├── css/
│   └── style.css               # Dashboard layout, KPI cards, filter ribbon, and chart styling
├── js/
│   ├── main.js                 # State controller, filters, and data loader
│   ├── chart1.js               # D3 Annual Trend Line Chart (2011–2021) & Age Group Bar Chart
│   ├── chart2.js               # D3 Remoteness Horizontal Bar Chart & Road User Donut Chart
│   └── chart3.js               # D3 Jurisdictional & First Nations visualisations
├── data/                       # Cleaned dataset files (.csv / .json)
├── assets/
│   └── images/                 # Icons and static visual assets
└── docs/
    ├── knime/                  # KNIME workflows and data processing documentation
    └── usability_testing/      # Design process and usability evaluation documentation
```

---

### Local Development
Open `index.html` directly in your browser to preview the interactive D3 charts, or run a local web server when loading CSV files from `data/`:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.
