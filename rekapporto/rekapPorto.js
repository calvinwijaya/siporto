async function filterRekapByJenjangYear() {
    const selectedJenjang = document.getElementById("filterJenjangRekap").value;
    const selectedYear = document.getElementById("filterYear").value;
    const overlay = document.getElementById("loadingOverlay");

    if (overlay) overlay.style.display = "flex";

    try {
        const resp = await fetch(
            `https://script.google.com/macros/s/AKfycby7dUI5Gae0ypEQorj4e9PEzbODkH5EBwAdQLi0pHbfitSCpKVxjuHf4QH6UyugEYSh/exec?jenjang=${encodeURIComponent(selectedJenjang)}`
        );
        const data = await resp.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Data tidak ditemukan atau format salah.");
        }

        // Filter Tahun (GAS biasanya mengirim data mentah, kita filter di client)
        const filteredRows = data.filter(row => String(row.Tahun || '').startsWith(selectedYear));

        if (filteredRows.length === 0) {
            Swal.fire('Data Kosong', `Tidak ditemukan data untuk jenjang ${selectedJenjang} tahun ${selectedYear}`, 'info');
            document.getElementById("rekapContent").style.display = "none";
            return;
        }

        processAndDisplayRekap(filteredRows, selectedJenjang);
        document.getElementById("rekapContent").style.display = "block";

    } catch (err) {
        console.error(err);
        Swal.fire('Gagal Memuat Data', err.message, 'error');
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

function processAndDisplayRekap(rows, jenjang) {
    const cplKeys = getCPLKeysForJenjang(jenjang);
    const piKeys = getPIKeysForJenjang(jenjang);

    const cplSums = {}, cplCounts = {}, piSums = {}, piCounts = {};
    
    cplKeys.forEach(k => { cplSums[k] = 0; cplCounts[k] = 0; });
    piKeys.forEach(k => { piSums[k] = 0; piCounts[k] = 0; });

    rows.forEach(row => {
        cplKeys.forEach(k => {
            const val = parseFloat(getRowValueCaseInsensitive(row, k));
            if (!isNaN(val)) { cplSums[k] += val; cplCounts[k]++; }
        });
        piKeys.forEach(k => {
            const val = parseFloat(getRowValueCaseInsensitive(row, k));
            if (!isNaN(val)) { piSums[k] += val; piCounts[k]++; }
        });
    });

    const avgCPL = cplKeys.map(k => ({ label: k.toLowerCase(), value: cplCounts[k] ? cplSums[k] / cplCounts[k] : 0 }));
    const avgPI = piKeys.map(k => ({ label: k.toLowerCase(), value: piCounts[k] ? piSums[k] / piCounts[k] : 0 }));

    drawCPLRadarChart(avgCPL);
    drawPIBarChart(avgPI);

    renderTable(rows, 'cplTableContainer', 'Capaian CPL', ['No.', 'Nama Mata Kuliah', 'Kelas', ...cplKeys], avgCPL, 'bg-success');
    renderTable(rows, 'piTableContainer', 'Capaian PI', ['No.', 'Nama Mata Kuliah', 'Kelas', ...piKeys], avgPI, 'bg-primary');
}

// --- Visualizations ---
function drawCPLRadarChart(data) {
    const ctx = document.getElementById('soRadarChart').getContext('2d');
    if (window.soRadarChart instanceof Chart) window.soRadarChart.destroy();

    window.soRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: data.map(d => `CPL ${d.label}`),
            datasets: [
                {
                    label: 'Standar (70)',
                    data: data.map(() => 70),
                    borderColor: '#ffc107',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Rata-rata Capaian',
                    data: data.map(d => d.value.toFixed(2)),
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: '#0d6efd',
                    pointBackgroundColor: '#0d6efd'
                }
            ]
        },
        options: {
            scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } }
        }
    });
}

function drawPIBarChart(data) {
    const ctx = document.getElementById('rekapPiChart').getContext('2d');
    if (window.rekapPiChart instanceof Chart) window.rekapPiChart.destroy();

    window.rekapPiChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Standar (70)',
                    data: data.map(() => 70),
                    type: 'line',
                    borderColor: '#ffc107',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Rata-rata Capaian PI',
                    data: data.map(d => d.value.toFixed(2)),
                    backgroundColor: '#198754'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

// --- Unified Table Renderer ---
function renderTable(rows, containerId, title, headers, averages, headerClass) {
    let sortAsc = true;
    let dataRows = [...rows];

    const doRender = () => {
        let html = `
            <div class="card border-0 shadow-sm mt-3">
                <div class="card-header ${headerClass} text-white d-flex justify-content-between align-items-center">
                    <span class="fw-bold">${title}</span>
                    <button class="btn btn-light btn-sm fw-bold" onclick="window.sortRekapTable('${containerId}')">
                        <i class="bi bi-sort-alpha-down"></i> Urutkan MK
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                        <thead class="table-light">
                            <tr>${headers.map(h => `<th class="text-nowrap text-center">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${dataRows.map((row, idx) => `
                                <tr>
                                    <td class="text-center">${idx + 1}</td>
                                    <td class="text-nowrap">${getRowValueCaseInsensitive(row, 'Nama Mata Kuliah')}</td>
                                    <td class="text-center">${getRowValueCaseInsensitive(row, 'Kelas')}</td>
                                    ${headers.slice(3).map(h => {
                                        const v = parseFloat(getRowValueCaseInsensitive(row, h));
                                        return `<td class="text-center ${v < 70 ? 'text-danger fw-bold' : ''}">${!isNaN(v) ? v.toFixed(2) : '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="table-warning fw-bold">
                            <tr>
                                <td colspan="3" class="text-end">Rerata Capaian:</td>
                                ${averages.map(a => `<td class="text-center">${a.value.toFixed(2)}</td>`).join('')}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
        document.getElementById(containerId).innerHTML = html;
    };

    // Global sort function for this instance
    window.sortRekapTable = (id) => {
        if (id !== containerId) return;
        sortAsc = !sortAsc;
        dataRows.sort((a, b) => {
            const nameA = getRowValueCaseInsensitive(a, 'Nama Mata Kuliah').toLowerCase();
            const nameB = getRowValueCaseInsensitive(b, 'Nama Mata Kuliah').toLowerCase();
            return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
        doRender();
    };

    doRender();
}