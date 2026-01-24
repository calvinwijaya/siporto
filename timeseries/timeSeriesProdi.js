/**
 * KONFIGURASI MAPPING CPL & PI
 */
const jenjangCPLData = {
    'S1': {
        cplList: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        piMap: {
            'a': ['a1', 'a2', 'a3'], 'b': ['b1', 'b2', 'b3', 'b4'], 'c': ['c1', 'c2', 'c3', 'c4', 'c5'],
            'd': ['d1', 'd2', 'd3'], 'e': ['e1', 'e2', 'e3', 'e4'], 'f': ['f1', 'f2'],
            'g': ['g1', 'g2', 'g3', 'g4', 'g5'], 'h': ['h1', 'h2'], 'i': ['i1', 'i2'],
            'j': ['j1', 'j2'], 'k': ['k1', 'k2', 'k3', 'k4']
        }
    },
    'S2': {
        cplList: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        piMap: {
            'a': ['a1', 'a2', 'a3'], 'b': ['b1', 'b2', 'b3', 'b4'], 'c': ['c1', 'c2', 'c3'],
            'd': ['d1', 'd2', 'd3', 'd4', 'd5'], 'e': ['e1', 'e2'], 'f': ['f1', 'f2', 'f3', 'f4'],
            'g': ['g1', 'g2', 'g3', 'g4', 'g5'], 'h': ['h1', 'h2', 'h3', 'h4']
        }
    },
    'S3': {
        cplList: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        piMap: {
            'a': ['a1', 'a2'], 'b': ['b1', 'b2'], 'c': ['c1', 'c2', 'c3'],
            'd': ['d1', 'd2', 'd3', 'd4'], 'e': ['e1', 'e2', 'e3', 'e4'], 'f': ['f1', 'f2', 'f3'],
            'g': ['g1', 'g2', 'g3'], 'h': ['h1', 'h2', 'h3', 'h4']
        }
    }
};

// --- Helpers ---
function getCPLKeysForJenjang(jenjang) {
    const config = jenjangCPLData[jenjang] || jenjangCPLData['S1'];
    return [...config.cplList];
}

function getPIKeysForJenjang(jenjang) {
    const config = jenjangCPLData[jenjang] || jenjangCPLData['S1'];
    const keys = [];
    config.cplList.forEach(cpl => {
        (config.piMap[cpl] || []).forEach(pi => {
            if (!keys.includes(pi)) keys.push(pi);
        });
    });
    return keys;
}

function getRowValueCaseInsensitive(row, key) {
    if (!row) return "";
    const searchKey = String(key).trim().toLowerCase();
    for (const k of Object.keys(row)) {
        if (String(k).trim().toLowerCase() === searchKey) return row[k];
    }
    return "";
}

// Load and visualize time series CPL Prodi
async function loadTimeProdiPortfolio() {
    const tahunAwal = document.getElementById("tahunAwalProdi").value;
    const tahunAkhir = document.getElementById("tahunAkhirProdi").value;
    const jenjang = document.getElementById("filterJenjangTimeSeries").value;
    const container = document.getElementById("prodiChartContainer");
    const overlay = document.getElementById("loadingOverlay");

    // Validasi input tahun
    if (!tahunAwal || !tahunAkhir || parseInt(tahunAwal) > parseInt(tahunAkhir)) {
        return Swal.fire('Rentang Tahun Salah', 'Pastikan tahun awal tidak lebih besar dari tahun akhir.', 'warning');
    }

    if (overlay) overlay.style.display = "flex";
    container.innerHTML = ""; // Bersihkan container

    try {
        // Menggunakan URL GAS yang sama dengan rekapPorto
        const url = `https://script.google.com/macros/s/AKfycby7dUI5Gae0ypEQorj4e9PEzbODkH5EBwAdQLi0pHbfitSCpKVxjuHf4QH6UyugEYSh/exec?jenjang=${encodeURIComponent(jenjang)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Data dari server kosong atau tidak sesuai format.");
        }

        // Ambil kunci CPL berdasarkan jenjang dari konfigurasi global
        const cplKeys = getCPLKeysForJenjang(jenjang);
        
        // Kelompokkan data berdasarkan Tahun
        const yearGroups = {};
        data.forEach(row => {
            const tahunFull = String(row.Tahun || '').trim();
            const yearPrefix = tahunFull.split('-')[0]; // Ambil tahun utama (2024 dari 2024-1)

            if (parseInt(yearPrefix) >= parseInt(tahunAwal) && parseInt(yearPrefix) <= parseInt(tahunAkhir)) {
                if (!yearGroups[yearPrefix]) yearGroups[yearPrefix] = [];
                yearGroups[yearPrefix].push(row);
            }
        });

        const sortedYears = Object.keys(yearGroups).sort();
        if (sortedYears.length === 0) {
            throw new Error(`Tidak ditemukan data rekap untuk rentang tahun ${tahunAwal} - ${tahunAkhir}`);
        }

        const datasets = [];
        const colors = [
            'rgba(13, 110, 253, 0.7)', // Blue
            'rgba(25, 135, 84, 0.7)',  // Green
            'rgba(220, 53, 69, 0.7)',  // Red
            'rgba(255, 193, 7, 0.7)',  // Yellow
            'rgba(13, 202, 240, 0.7)'  // Cyan
        ];

        sortedYears.forEach((year, index) => {
            const rows = yearGroups[year];
            const sums = {}, counts = {};
            cplKeys.forEach(k => { sums[k] = 0; counts[k] = 0; });

            rows.forEach(row => {
                cplKeys.forEach(k => {
                    // Gunakan fungsi helper case-insensitive yang sudah ada
                    const val = parseFloat(getRowValueCaseInsensitive(row, k));
                    if (!isNaN(val)) {
                        sums[k] += val;
                        counts[k]++;
                    }
                });
            });

            const avgValues = cplKeys.map(k => counts[k] ? (sums[k] / counts[k]).toFixed(2) : 0);
            
            datasets.push({
                label: `Tahun ${year}`,
                data: avgValues,
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.7', '1'),
                borderWidth: 1
            });
        });

        drawTimeSeriesBarChart(cplKeys.map(k => `CPL ${k.toUpperCase()}`), datasets, "prodiChartContainer");

    } catch (err) {
        console.error("Gagal memuat data time series:", err);
        Swal.fire('Gagal Memuat Tren', err.message, 'error');
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

// Draw multi-series bar chart dengan Chart.js
function drawTimeSeriesBarChart(labels, datasets, containerId) {
    const container = document.getElementById(containerId);
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Standar (70)',
                    data: labels.map(() => 70),
                    type: 'line',
                    borderColor: '#ffc107',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    order: -1 // Agar garis standar selalu di depan
                },
                ...datasets
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100, 
                    title: { display: true, text: 'Rata-rata Capaian (%)' } 
                }
            }
        }
    });
}