/**
 * 1. Fungsi saat Jenjang diganti
 * Memanggil data MK dari Spreadsheet via GAS
 */
async function onJenjangMKChange() {
    const jenjang = document.getElementById("jenjangMKTS").value;
    const overlay = document.getElementById("loadingOverlay");
    const suggestionBox = document.getElementById('mkSuggestionsTS');
    const inputMK = document.getElementById('pilihMKTS');
    
    // Reset data sebelumnya
    mkListTS = [];
    inputMK.value = '';
    suggestionBox.innerHTML = '';
    suggestionBox.classList.add('d-none');

    if (!jenjang) return;

    const scriptUrl = "https://script.google.com/macros/s/AKfycbz4NcXFQz3K1_sYV1wXiy_trBgJlIEeBAWnzKVkpa_5PME_N8N8m0x5LjCBQNi701QQCQ/exec";

    try {
        if (overlay) overlay.style.display = "flex";
        
        const response = await fetch(`${scriptUrl}?jenjang=${jenjang.toUpperCase()}`);
        if (!response.ok) throw new Error("Gagal mengambil data dari server");

        const data = await response.json();
        mkListTS = data; // Simpan data ke variabel lokal modul ini
        
        console.log(`Daftar MK ${jenjang} berhasil dimuat untuk Time Series:`, mkListTS.length);
    } catch (err) {
        console.error(`Gagal memuat daftar MK:`, err);
        Swal.fire('Error', 'Gagal memuat daftar mata kuliah dari database.', 'error');
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

/**
 * 2. Filter Autocomplete Mata Kuliah
 * Menggunakan gaya Bootstrap list-group
 */
function filterMK_TS() {
    const input = document.getElementById('pilihMKTS').value.toLowerCase();
    const suggestionBox = document.getElementById('mkSuggestionsTS');
    
    if (!input || mkListTS.length === 0) {
        suggestionBox.innerHTML = '';
        suggestionBox.classList.add('d-none');
        return;
    }

    const matched = mkListTS.filter(mk => mk.toLowerCase().includes(input)).slice(0, 10);

    if (matched.length === 0) {
        suggestionBox.innerHTML = '';
        suggestionBox.classList.add('d-none');
        return;
    }

    suggestionBox.innerHTML = '';
    matched.forEach(mk => {
        const a = document.createElement('a');
        a.href = "javascript:void(0)";
        a.className = "list-group-item list-group-item-action py-2";
        a.style.cursor = "pointer";
        a.innerHTML = `<i class="bi bi-book me-2"></i>${mk}`;
        a.onclick = (e) => {
            e.preventDefault();
            document.getElementById('pilihMKTS').value = mk;
            suggestionBox.innerHTML = '';
            suggestionBox.classList.add('d-none');
        };
        suggestionBox.appendChild(a);
    });

    suggestionBox.classList.remove('d-none');
}

async function loadTimeMKPortfolio() {
  const jenjang = document.getElementById("jenjangMKTS").value;
  const mkInput = document.getElementById("pilihMKTS").value.trim();
  const tahunAwal = document.getElementById("tahunAwalMK").value;
  const tahunAkhir = document.getElementById("tahunAkhirMK").value;
  const container = document.getElementById("mkChartContainer");
  container.innerHTML = "";

  if (!jenjang || !mkInput || !tahunAwal || !tahunAkhir || tahunAwal > tahunAkhir) {
    alert("Mohon lengkapi semua input dengan benar (Jenjang, MK, Tahun).");
    return;
  }

  document.getElementById("loadingOverlay").style.display = "flex";

  try {
    const url = `https://script.google.com/macros/s/AKfycby7dUI5Gae0ypEQorj4e9PEzbODkH5EBwAdQLi0pHbfitSCpKVxjuHf4QH6UyugEYSh/exec?jenjang=${encodeURIComponent(jenjang)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Data kosong atau salah format");

    const allYears = [];
    for (let y = parseInt(tahunAwal); y <= parseInt(tahunAkhir); y++) {
      allYears.push(`${y}-1`, `${y}-2`);
    }

    const cplKeys = getCPLKeysForJenjang(jenjang);
    const datasets = [];

    allYears.forEach(yr => {
      const rows = data.filter(row =>
        String(row.Tahun || '').trim() === yr &&
        String(row["Nama Mata Kuliah"] || '').trim().toLowerCase() === mkInput.toLowerCase()
      );

      const sums = {}, counts = {};
      cplKeys.forEach(k => { sums[k] = 0; counts[k] = 0; });

      rows.forEach(row => {
        cplKeys.forEach(k => {
          const val = parseFloat(row[k]);
          if (!isNaN(val)) {
            sums[k] += val;
            counts[k]++;
          }
        });
      });

      const values = cplKeys.map(k => counts[k] ? (sums[k] / counts[k]) : 0);
      if (rows.length > 0) {
        datasets.push({ label: yr, data: values });
      }
    });

    if (datasets.length === 0) {
      alert("Data tidak ditemukan untuk kombinasi tersebut.");
      return;
    }

    drawTimeSeriesMhsBarChart(cplKeys.map(k => k), datasets, "mkChartContainer");

  } catch (err) {
    console.error("Gagal memuat data MK Time Series:", err);
    alert("Terjadi kesalahan saat memuat data.");
  } finally {
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

function drawTimeSeriesMhsBarChart(labels, datasets, canvasId) {
  const container = document.getElementById(canvasId);
  container.innerHTML = ""; // remove previous canvas
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // Clear previous chart (if any)
  if (canvas._chartInstance) {
    canvas._chartInstance.destroy();
  }

  const colors = [
    "rgba(255, 99, 132, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(75, 192, 192, 0.6)",
    "rgba(153, 102, 255, 0.6)",
    "rgba(255, 159, 64, 0.6)"
  ];

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: colors[i % colors.length],
      }))
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Time-Series CPL Mata Kuliah",
          font: {
            size: 20,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: { stacked: false },
        y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 }, stacked: false },
      }
    }
  });

  canvas._chartInstance = chart;
}