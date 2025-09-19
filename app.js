const canvas = document.getElementById('forecastCanvas');
const ctx = canvas.getContext('2d');
const legend = document.getElementById('legend');
const alertsList = document.getElementById('alertsList');
const mapCanvas = document.getElementById('mapCanvas');

const colors = {
    baseline: '#7aa2ff',
    forecast: '#22d3ee',
    risk: '#f59e0b'
};

function generateSeries(points, base = 50, noise = 10, trend = 0.2) {
    const series = [];
    for (let i = 0; i < points; i++) {
        const value = base + Math.sin(i / 2) * noise + i * trend + (Math.random() - 0.5) * noise * 0.6;
        series.push(Math.max(0, Math.round(value)));
    }
    return series;
}

function drawChart(metric = 'speed') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width - 60;
    const height = canvas.height - 60;
    const originX = 40;
    const originY = canvas.height - 30;

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = originY - (height / 5) * i;
        ctx.beginPath(); ctx.moveTo(originX, y); ctx.lineTo(originX + width, y); ctx.stroke();
    }

    const baseline = generateSeries(24, 48, 8, -0.1);
    const forecast = generateSeries(12, baseline[baseline.length - 1], 10, metric === 'risk' ? -0.3 : 0.3);

    const maxVal = Math.max(...baseline, ...forecast) * 1.2;
    const xStep = width / (baseline.length + forecast.length);

    function line(points, color, offset = 0) {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        points.forEach((v, i) => {
            const x = originX + (i + offset) * xStep;
            const y = originY - (v / maxVal) * height;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    line(baseline, colors.baseline, 0);
    line(forecast, colors.forecast, baseline.length);

    // split marker
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath();
    const splitX = originX + baseline.length * xStep;
    ctx.moveTo(splitX, originY - height);
    ctx.lineTo(splitX, originY);
    ctx.stroke();
    ctx.setLineDash([]);

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
        { area: 'Central - A12', severity: 'High', type: 'Congestion', eta: '18 min', badge: 'risk-high' },
        { area: 'North - Ring Rd', severity: 'Medium', type: 'Slowdown', eta: '9 min', badge: 'risk-med' },
        { area: 'East - Bridge', severity: 'Info', type: 'Roadwork', eta: 'Today', badge: 'info' }
    ];
    alertsList.innerHTML = '';
    data.forEach(a => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${a.type} • ${a.area}</span><span class="badge ${a.badge}">${a.severity} • ${a.eta}</span>`;
        alertsList.appendChild(li);
    });
}

function seedPins() {
    mapCanvas.innerHTML = '';
    const w = mapCanvas.clientWidth; const h = mapCanvas.clientHeight;
    const pins = [
        { x: 0.62, y: 0.42, level: 'high' },
        { x: 0.35, y: 0.55, level: 'medium' },
        { x: 0.18, y: 0.30, level: 'low' }
    ];
    pins.forEach(p => {
        const d = document.createElement('div');
        d.className = `pin ${p.level}`;
        d.style.left = `${Math.floor(p.x * w)}px`;
        d.style.top = `${Math.floor(p.y * h)}px`;
        mapCanvas.appendChild(d);
    });
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


