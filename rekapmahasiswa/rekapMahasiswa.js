// 1. Load daftar mahasiswa dari GAS berdasarkan jenjang
async function loadMahasiswaList() {
    const jenjang = document.getElementById("jenjangSelect").value;
    const overlay = document.getElementById("loadingOverlay");
    const scriptUrl = "https://script.google.com/macros/s/AKfycbznbxAvRmIGFrNqoKAjPVKfPRIRVAY4n22k9_Fb8N5H2BPucTB9cMCBYBAxCj7mntcM/exec";
    
    mahasiswaList = []; // reset
    document.getElementById('searchNIM').value = ''; // clear input

    if (!jenjang) return;

    if (overlay) overlay.style.display = "flex";

    try {
        const response = await fetch(`${scriptUrl}?jenjang=${encodeURIComponent(jenjang)}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        mahasiswaList = data;
        console.log(`Berhasil memuat ${mahasiswaList.length} mahasiswa jenjang ${jenjang}`);
    } catch (err) {
        console.error("Gagal memuat daftar mahasiswa:", err);
        Swal.fire('Error', 'Gagal memuat daftar mahasiswa dari database.', 'error');
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

// 2. Filter suggestion dengan data Objek {Nama, NIM}
function filterMahasiswa() {
    const input = document.getElementById('searchNIM').value.toLowerCase();
    const suggestionBox = document.getElementById('nimSuggestions');
    suggestionBox.innerHTML = '';

    if (!input || mahasiswaList.length === 0) {
        suggestionBox.classList.add('d-none');
        return;
    }

    // Cari berdasarkan NIM atau Nama
    const matched = mahasiswaList.filter(m => 
        String(m.NIM).toLowerCase().includes(input) || 
        String(m.Nama).toLowerCase().includes(input)
    ).slice(0, 10);

    if (matched.length === 0) {
        suggestionBox.classList.add('d-none');
        return;
    }

    matched.forEach(m => {
        const a = document.createElement('a');
        a.href = "javascript:void(0)";
        a.className = "list-group-item list-group-item-action py-2";
        // Tampilkan NIM dan Nama di suggestion
        a.innerHTML = `
            <div class="fw-bold" style="font-size: 0.9rem;">${m.NIM}</div>
            <div class="text-muted" style="font-size: 0.8rem;">${m.Nama}</div>
        `;
        
        a.onclick = () => {
            document.getElementById('searchNIM').value = m.NIM;
            suggestionBox.innerHTML = '';
            suggestionBox.classList.add('d-none');
        };
        suggestionBox.appendChild(a);
    });

    suggestionBox.classList.remove('d-none');
}

// Tambahkan listener untuk menutup suggestion saat klik di luar
document.addEventListener('click', function(e) {
    const box = document.getElementById('nimSuggestions');
    const input = document.getElementById('searchNIM');
    if (box && input) {  
      if (e.target !== box && e.target !== input) {
          box.classList.add('d-none');
      }
    }
});

// Function to load student portofolio
async function loadStudentPortfolio() {
  const nimInput = document.getElementById("searchNIM").value.trim();
  const jenjang = document.getElementById("jenjangSelect").value;
  if (!nimInput) return;

  try {
    document.getElementById("loadingOverlay").style.display = "flex";
    document.getElementById("portfolioResult").style.display = "block";

    // Fetch from GAS with jenjang & nim
    let studentRows = [];
    try {
      const url = `https://script.google.com/macros/s/AKfycbyHjzC1MI1fWdWDv1BzPdaRNnvT1VfhP_Dj24PT5af66X6xcu91j8564jNHTUTHvI4_ew/exec?jenjang=${encodeURIComponent(jenjang)}&nim=${encodeURIComponent(nimInput)}`;
      const response = await fetch(url);
      const allData = await response.json();
      studentRows = allData;
    } catch (error) {
      console.error("Gagal memuat data mahasiswa:", error);
      document.getElementById("studentCourses").innerHTML = `<p style="color:red;">Gagal memuat data mahasiswa.</p>`;
      return;
    }

    if (studentRows.length === 0) {
        document.getElementById("studentCourses").innerHTML = `<p>Tidak ditemukan data untuk NIM: ${nimInput}</p>`;
        document.getElementById("portfolioResult").style.display = "none"; // Sembunyikan jika data zonk
        return;
    }

    const studentName = studentRows[0]["Nama"] || "-";

    // 1. Display Nama and NIM
    let html = `<h3>Informasi Mahasiswa</h3>
                <p><strong>Nama:</strong> ${studentName}</p>
                <p><strong>NIM:</strong> ${nimInput}</p>`;

    // 2. Display Daftar Mata Kuliah
    let sortAscMK = true;

    function renderMKTable(rows) {
      let tableHtml = `
        <div class="card mb-3 shadow-sm">
          <div class="card-header bg-secondary text-white fw-semibold d-flex justify-content-between align-items-center">
            <span>Daftar Mata Kuliah</span>
            <button class="btn btn-light btn-sm" id="sortMKBtn">
              Sort Nama Mata Kuliah ${sortAscMK ? "▲" : "▼"}
            </button>
          </div>
          <div class="table-responsive">
            <table class="table table-striped table-hover table-sm mb-0">
              <thead class="table-light">
                <tr>
                  <th>Nama Mata Kuliah</th>
                  <th>Kelas</th>
                </tr>
              </thead>
              <tbody>
      `;

      rows.forEach(row => {
        tableHtml += `
          <tr>
            <td>${row["Nama Mata Kuliah"]}</td>
            <td>${row.Kelas}</td>
          </tr>
        `;
      });

      tableHtml += `
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById("studentCourses").innerHTML = tableHtml;

      // Add click event for sorting
      document.getElementById("sortMKBtn").addEventListener("click", () => {
        sortAscMK = !sortAscMK;
        const sortedRows = [...rows].sort((a, b) =>
          sortAscMK
            ? a["Nama Mata Kuliah"].localeCompare(b["Nama Mata Kuliah"])
            : b["Nama Mata Kuliah"].localeCompare(a["Nama Mata Kuliah"])
        );
        renderMKTable(sortedRows);
      });
    }

    // Initial render
    renderMKTable(studentRows);

    // 3. Use jenjang-specific PI keys
    const piKeys = getPIKeysForJenjang(jenjang);

    const avgPI = {};
    const countPI = {};
    piKeys.forEach(key => {
      studentRows.forEach(row => {
        const val = parseFloat(row[key]);
        if (!isNaN(val)) {
          avgPI[key] = (avgPI[key] || 0) + val;
          countPI[key] = (countPI[key] || 0) + 1;
        }
      });
    });

    const avgData = piKeys.map(key => ({
      label: key,
      value: avgPI[key] ? (avgPI[key] / countPI[key]) : 0
    }));

    drawStudentPIChart(avgData);

    // Render PI table below PI chart
    const piTableRows = studentRows.map(row => {
      const piData = {};
      piKeys.forEach(key => {
        const raw = row[key];
        const val = parseFloat(raw);
        piData[key] = (!isNaN(val) && raw !== '') ? val.toFixed(2) : '';
      });

      return {
        "Nama Mata Kuliah": row["Nama Mata Kuliah"],
        "Kelas": row.Kelas,
        ...piData
      };
    });

    // Append average row at the end
    const piAvgRow = {
      "Nama Mata Kuliah": "Rata-rata",
      "Kelas": "-"
    };
    avgData.forEach(item => {
      piAvgRow[item.label] = !isNaN(item.value) ? item.value.toFixed(2) : '';
    });
    piTableRows.push(piAvgRow);

    // === Render PI Table ===
    renderPIMHSTable(piTableRows, "studentPiTable", piKeys);

    // 4. Use jenjang-specific CPL
    const cplRows = studentRows.map(row => {
      const cplValues = calculateCPLFromPI([row], jenjang); // per MK
      const rowData = { "Nama Mata Kuliah": row["Nama Mata Kuliah"], "Kelas": row["Kelas"] };
      cplValues.forEach(cpl => {
        rowData[cpl.label] = cpl.value.toFixed(2);
      });
      return rowData;
    });

    // Add average row at the end (optional)
    const avgCPLRow = { "Nama Mata Kuliah": "Rata-rata", "Kelas": "-" };
    calculateCPLFromPI(studentRows, jenjang).forEach(cpl => {
      avgCPLRow[cpl.label] = cpl.value.toFixed(2);
    });
    cplRows.push(avgCPLRow);

    // Draw CPL radar chart (average)
    drawStudentCPLRadarChart(calculateCPLFromPI(studentRows, jenjang));

    // Render CPL table
    const cplKeys = getCPLKeysForJenjang(jenjang);
    renderCPLMHSTable(cplRows, "studentCPLTable", cplKeys);

  } catch (error) {
    console.error("Gagal memuat data mahasiswa:", error);
    document.getElementById("studentCourses").innerHTML = `<p style="color:red;">Gagal memuat data mahasiswa.</p>`;
  } finally {
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

function drawStudentCPLRadarChart(avgData) {
  const soLabels = avgData.map(d => `CPL ${d.label}`);
  const soValues = avgData.map(d => d.value.toFixed(2));
  const thresholdSO = Array(avgData.length).fill(70);

  const ctx = document.getElementById('studentCPLChart').getContext('2d');
  if (window.studentCPLChart instanceof Chart) {
    window.studentCPLChart.destroy();
  }

  window.studentCPLChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: soLabels,
      datasets: [
        {
          label: 'Standar (70)',
          data: thresholdSO,
          borderColor: 'rgba(255, 193, 7, 1)',
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Nilai CPL',
          data: soValues,
          backgroundColor: 'rgba(21, 101, 192, 0.2)',
          borderColor: '#1565c0',
          pointBackgroundColor: '#1565c0',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 10 },
          grid: { circular: true },
          pointLabels: { font: { size: 12 } }
        }
      }
    }
  });
}

function drawStudentPIChart(avgData) {
  const labels = avgData.map(d => d.label);
  const values = avgData.map(d => d.value.toFixed(2));
  const threshold = Array(labels.length).fill(70);

  const ctx = document.getElementById('studentPiChart').getContext('2d');
  if (window.studentPiChart instanceof Chart) {
    window.studentPiChart.destroy();
  }

  window.studentPiChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Standar (70)',
          data: threshold,
          type: 'line',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Nilai PI',
          data: values,
          backgroundColor: '#3f51b5'
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 10 },
          grid: { drawOnChartArea: true }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function calculateCPLFromPI(studentRows, jenjang) {
  const piToCplMap = jenjangCPLData[jenjang]?.piMap;
  if (!piToCplMap) return [];

  const cplSums = {}, cplCounts = {};
  Object.keys(piToCplMap).forEach(cpl => {
    cplSums[cpl] = 0;
    cplCounts[cpl] = 0;
  });

  studentRows.forEach(row => {
    Object.entries(piToCplMap).forEach(([cpl, pis]) => {
      pis.forEach(pi => {
        // Gunakan pencarian case-insensitive agar lebih aman
        const val = parseFloat(getRowValueCaseInsensitive(row, pi));
        if (!isNaN(val)) {
          cplSums[cpl] += val;
          cplCounts[cpl]++;
        }
      });
    });
  });

  return Object.keys(piToCplMap).map(cpl => ({
    label: cpl,
    value: cplCounts[cpl] > 0 ? cplSums[cpl] / cplCounts[cpl] : 0
  }));
}

function renderCPLMHSTable(rows, containerId, cplKeys) {
  if (!rows || rows.length === 0) {
    document.getElementById(containerId).innerHTML = "<p>Tidak ada data CPL.</p>";
    return;
  }

  let sortAsc = true; // toggle state
  const renderTable = () => {
    // Separate rata-rata row from others
    const mainRows = rows.slice(0, rows.length - 1);
    const avgRow = rows[rows.length - 1];

    let html = `
      <div class="card mb-4">
        <div class="card-header bg-success text-white fw-semibold d-flex justify-content-between align-items-center">
          <span>Capaian Profil Lulusan (CPL)</span>
          <button class="btn btn-light btn-sm" id="${containerId}-sortBtn">
            Sort Nama Mata Kuliah ${sortAsc ? "▲" : "▼"}
          </button>
        </div>
        <div class="card-body p-2">
          <div class="table-responsive">
            <table class="table table-bordered table-striped table-sm text-center align-middle">
              <thead>
                <tr>
                  <th class="text-nowrap">Nama Mata Kuliah</th>
                  <th class="text-nowrap">Kelas</th>`;

    cplKeys.forEach(key => {
      html += `<th>${key}</th>`;
    });

    html += `
                </tr>
              </thead>
              <tbody>`;

    // Render main rows
    mainRows.forEach(row => {
      html += `<tr><td class="text-start">${row["Nama Mata Kuliah"]}</td><td>${row["Kelas"]}</td>`;
      cplKeys.forEach(key => {
        const val = row[key];
        html += `<td>${(val > 0) ? Number(val).toFixed(2) : ''}</td>`;
      });
      html += `</tr>`;
    });

    // Render average row last
    html += `<tr class="table-secondary fw-bold"><td>${avgRow["Nama Mata Kuliah"]}</td><td>${avgRow["Kelas"]}</td>`;
    cplKeys.forEach(key => {
      const val = avgRow[key];
      html += `<td>${(val !== undefined && val !== null && val !== '' && !isNaN(val)) ? Number(val).toFixed(2) : ''}</td>`;
    });
    html += `</tr>`;

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    document.getElementById(containerId).innerHTML = html;

    // Attach click event to sort button
    document.getElementById(`${containerId}-sortBtn`).addEventListener("click", () => {
      sortAsc = !sortAsc;
      mainRows.sort((a, b) => {
        const nameA = a["Nama Mata Kuliah"].toLowerCase();
        const nameB = b["Nama Mata Kuliah"].toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
      rows = [...mainRows, avgRow]; // keep avgRow last
      renderTable(); // re-render after sort
    });
  };

  renderTable();
}

function renderPIMHSTable(rows, containerId, piKeys) {
  if (!rows || rows.length === 0) {
    document.getElementById(containerId).innerHTML = "<p>Tidak ada data PI.</p>";
    return;
  }

  let sortAsc = true; // toggle state
  const renderTable = () => {
    // Separate rata-rata row from others
    const mainRows = rows.slice(0, rows.length - 1);
    const avgRow = rows[rows.length - 1];

    let html = `
      <div class="card mb-4">
        <div class="card-header bg-primary text-white fw-semibold d-flex justify-content-between align-items-center">
          <span>Performance Indicator (PI)</span>
          <button class="btn btn-light btn-sm" id="${containerId}-sortBtn">
            Sort Nama Mata Kuliah ${sortAsc ? "▲" : "▼"}
          </button>
        </div>
        <div class="card-body p-2">
          <div class="table-responsive">
            <table class="table table-bordered table-striped table-sm text-center align-middle">
              <thead>
                <tr>
                  <th class="text-nowrap">Nama Mata Kuliah</th>
                  <th class="text-nowrap">Kelas</th>`;

    piKeys.forEach(key => {
      html += `<th>${key}</th>`;
    });

    html += `
                </tr>
              </thead>
              <tbody>`;

    // Render main rows
    mainRows.forEach(row => {
      html += `<tr><td>${row["Nama Mata Kuliah"]}</td><td>${row["Kelas"]}</td>`;
      piKeys.forEach(key => {
        const val = row[key];
        html += `<td>${(val !== undefined && val !== null && val !== '' && !isNaN(val)) ? Number(val).toFixed(2) : ''}</td>`;
      });
      html += `</tr>`;
    });

    // Render average row last
    html += `<tr class="table-secondary fw-bold"><td>${avgRow["Nama Mata Kuliah"]}</td><td>${avgRow["Kelas"]}</td>`;
    piKeys.forEach(key => {
      const val = avgRow[key];
      html += `<td>${(val !== undefined && val !== null && val !== '' && !isNaN(val)) ? Number(val).toFixed(2) : ''}</td>`;
    });
    html += `</tr>`;

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    document.getElementById(containerId).innerHTML = html;

    // Attach click event to sort button
    document.getElementById(`${containerId}-sortBtn`).addEventListener("click", () => {
      sortAsc = !sortAsc;
      mainRows.sort((a, b) => {
        const nameA = a["Nama Mata Kuliah"].toLowerCase();
        const nameB = b["Nama Mata Kuliah"].toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
      rows = [...mainRows, avgRow]; // keep avgRow last
      renderTable(); // re-render after sort
    });
  };

  renderTable();
}