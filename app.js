const canvas = document.getElementById('forecastCanvas');
const legend = document.getElementById('legend');
const alertsList = document.getElementById('alertsList');
const mapCanvas = document.getElementById('mapCanvas');
const routeForm = document.getElementById('routeForm');
const routeResult = document.getElementById('routeResult');

const colors = { baseline: '#7aa2ff', forecast: '#22d3ee', risk: '#f59e0b' };
let chart;

function generateSeries(points, base = 50, noise = 10, trend = 0.2) {
    const series = [];
    for (let i = 0; i < points; i++) {
        const value = base + Math.sin(i / 2) * noise + i * trend + (Math.random() - 0.5) * noise * 0.6;
        series.push(Math.max(0, Math.round(value)));
    }
    return series;
}

function drawChart(metric = 'speed') {
    const observed = generateSeries(24, 48, 8, -0.1);
    const forecast = generateSeries(12, observed[observed.length - 1], 10, metric === 'risk' ? -0.3 : 0.3);
    const labels = [...Array(observed.length).keys()].map(i => `T-${observed.length - i}`)
        .concat([...Array(forecast.length).keys()].map(i => `+${i + 1}m`));
    const data = observed.concat(forecast);

    if (chart) chart.destroy();
    chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Observed', data: observed.concat(Array(forecast.length).fill(null)), borderColor: colors.baseline, tension: 0.35 },
                { label: 'Forecast', data: Array(observed.length).fill(null).concat(forecast), borderColor: colors.forecast, borderDash: [6,4], tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#9aa4af' }, grid: { color: 'rgba(255,255,255,.06)' } },
                y: { ticks: { color: '#9aa4af' }, grid: { color: 'rgba(255,255,255,.06)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    legend.innerHTML = '';
    addLegend('Observed', colors.baseline);
    addLegend('Forecast', colors.forecast);
}

function addLegend(label, color) {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `<span class="dot" style="background:${color}"></span>${label}`;
    legend.appendChild(item);
}

function seedAlerts() {
    const data = [
        { area: 'Central - A12', severity: 'High', level: 'high', type: 'Congestion', eta: '18 min', badge: 'risk-high' },
        { area: 'North - Ring Rd', severity: 'Medium', level: 'medium', type: 'Slowdown', eta: '9 min', badge: 'risk-med' },
        { area: 'East - Bridge', severity: 'Info', level: 'low', type: 'Roadwork', eta: 'Today', badge: 'info' }
    ];
    alertsList.innerHTML = '';
    const showHigh = document.getElementById('filterHigh')?.checked ?? true;
    const showMed = document.getElementById('filterMed')?.checked ?? true;
    const showLow = document.getElementById('filterLow')?.checked ?? true;
    data.filter(a => (a.level === 'high' && showHigh) || (a.level === 'medium' && showMed) || (a.level === 'low' && showLow))
        .forEach(a => {
        const li = document.createElement('li');
        li.innerHTML = `<button class="link alert-open" data-area="${a.area}" data-type="${a.type}" data-sev="${a.severity}" data-eta="${a.eta}">${a.type} • ${a.area}</button><span class="badge ${a.badge}">${a.severity} • ${a.eta}</span>`;
        alertsList.appendChild(li);
    });
}

function seedPins() {
    // Initialize Leaflet map with dark tiles
    if (!window.leafletMap) {
        const center = [28.6139, 77.2090];
        window.leafletMap = L.map('mapCanvas', { zoomControl: true, attributionControl: false }).setView(center, 11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(window.leafletMap);
    }

    // Markers with levels
    const markers = [
        { lat: 28.635, lng: 77.22, level: 'high', text: 'Congestion • Central - A12' },
        { lat: 28.70, lng: 77.10, level: 'medium', text: 'Slowdown • Ring Rd' },
        { lat: 28.58, lng: 77.30, level: 'low', text: 'Roadwork • East Bridge' }
    ];
    // Clear old
    if (window.markerLayer) window.leafletMap.removeLayer(window.markerLayer);
    const showHigh = document.getElementById('filterHigh')?.checked ?? true;
    const showMed = document.getElementById('filterMed')?.checked ?? true;
    const showLow = document.getElementById('filterLow')?.checked ?? true;
    window.markerLayer = L.layerGroup(
        markers.filter(m => (m.level === 'high' && showHigh) || (m.level === 'medium' && showMed) || (m.level === 'low' && showLow))
            .map(m => L.circleMarker([m.lat, m.lng], {
                radius: 8,
                color: m.level === 'high' ? '#f87171' : m.level === 'medium' ? '#f59e0b' : '#2dd4bf',
                fillOpacity: 0.8
            }).bindPopup(m.text))
    ).addTo(window.leafletMap);
}

// KPI shimmer / demo updates
function updateKpis() {
    const speed = 40 + Math.floor(Math.random() * 20);
    const delta = ((Math.random() - 0.5) * 6).toFixed(1);
    document.getElementById('kpiSpeed').textContent = `${speed} km/h`;
    const d = document.getElementById('kpiSpeedDelta');
    d.textContent = `${delta > 0 ? '+' : ''}${delta}%`;
    d.className = `kpi-delta ${delta > 0 ? 'positive' : 'warning'}`;
}

document.getElementById('refreshBtn').addEventListener('click', () => {
    drawChart(document.getElementById('metricSelect').value);
    seedAlerts();
    seedPins();
    updateKpis();
});

document.getElementById('metricSelect').addEventListener('change', (e) => drawChart(e.target.value));
document.getElementById('horizonSelect').addEventListener('change', () => drawChart(document.getElementById('metricSelect').value));

window.addEventListener('resize', seedPins);

drawChart();
seedAlerts();
seedPins();
updateKpis();

// Filters and interactions
['filterHigh','filterMed','filterLow'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', seedAlerts);
});

if (routeForm) {
    routeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const from = document.getElementById('fromInput').value.trim();
        const to = document.getElementById('toInput').value.trim();
        const time = document.getElementById('timeInput').value;
        const minutes = 15 + Math.floor(Math.random() * 25);
        const risk = ['Low','Medium','High'][Math.floor(Math.random()*3)];
        routeResult.textContent = `Best route • ${minutes} min • Risk: ${risk}${time ? ` • Depart ${time}` : ''}`;
    });
}

// Basic modal for alert details (inline, non-blocking)
alertsList?.addEventListener('click', (e) => {
    const btn = e.target.closest('.alert-open');
    if (!btn) return;
    const { area, type, sev, eta } = btn.dataset;
    alert(`${type} at ${area}\nSeverity: ${sev}\nETA clear: ${eta}`);
});


