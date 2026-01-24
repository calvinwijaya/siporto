// =============================================================================================================
// Mapping CPL dan PI berdasarkan jenjang
const jenjangCPLData = {
    S1: {
        cplList: ["a","b","c","d","e","f","g","h","i","j","k"],
        piMap: {
            a: ["a1", "a2", "a3"],
            b: ["b1", "b2", "b3", "b4"],
            c: ["c1", "c2", "c3", "c4", "c5"],
            d: ["d1", "d2", "d3"],
            e: ["e1", "e2", "e3", "e4"],
            f: ["f1", "f2"],
            g: ["g1", "g2", "g3", "g4", "g5"],
            h: ["h1", "h2"],
            i: ["i1", "i2"],
            j: ["j1", "j2"],
            k: ["k1", "k2", "k3", "k4"]
        }
    },
    S2: {
        cplList: ["a","b","c","d","e","f","g","h"],
        piMap: {
            a: ["a1", "a2", "a3"],
            b: ["b1", "b2", "b3", "b4"],
            c: ["c1", "c2", "c3"],
            d: ["d1", "d2", "d3", "d4", "d5"],
            e: ["e1", "e2"],
            f: ["f1", "f2", "f3", "f4"],
            g: ["g1", "g2", "g3", "g4", "g5"],
            h: ["h1", "h2", "h3", "h4"]
        }
    },
    S3: {
        cplList: ["a","b","c","d","e","f","g","h"],
        piMap: {
            a: ["a1", "a2"],
            b: ["b1", "b2"],
            c: ["c1", "c2", "c3"],
            d: ["d1", "d2", "d3", "d4"],
            e: ["e1", "e2", "e3", "e4"],
            f: ["f1", "f2", "f3"],
            g: ["g1", "g2", "g3"],
            h: ["h1", "h2", "h3", "h4"]
        }
    }
};

// =============================================================================================================
// Global State
let mkList = [];
let selectedJenjang = null;
const selectedCPL = new Set();
let assessmentCount = 0;

// =============================================================================================================
// Fungsi cardbody
// 1. Inisialisasi Tombol Jenjang saat Script Dimuat
function initJenjangButtons() {
    const jenjangContainer = document.getElementById("jenjangButtons");
    if (!jenjangContainer) return;

    jenjangContainer.innerHTML = ""; // Bersihkan container
    jenjangContainer.className = "row g-2 w-100 m-0";
    const jenjangList = ["S1", "S2", "S3"];

    jenjangList.forEach(jenjang => {
        const col = document.createElement("div");
        col.className = "col";        

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = jenjang;
        // Menggunakan class Bootstrap agar seragam
        btn.className = "btn btn-outline-primary flex-fill fw-bold w-100"; 
        
        btn.onclick = () => {
            // Reset active state
            document.querySelectorAll("#jenjangButtons .btn").forEach(b => {
                b.classList.remove("btn-primary", "text-white");
                b.classList.add("btn-outline-primary");
            });

            // Set active state
            btn.classList.remove("btn-outline-primary");
            btn.classList.add("btn-primary", "text-white");
            
            selectedJenjang = jenjang;
            loadMKList(selectedJenjang);
            generateCPLButtons(selectedJenjang);
        };

        col.appendChild(btn);
        jenjangContainer.appendChild(col);
    });
}

// 2. Load Daftar MK
async function loadMKList(jenjang) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbz4NcXFQz3K1_sYV1wXiy_trBgJlIEeBAWnzKVkpa_5PME_N8N8m0x5LjCBQNi701QQCQ/exec";
    const overlay = document.getElementById("loadingOverlay");

    try {
        if (overlay) overlay.style.display = "flex";
        const response = await fetch(`${scriptUrl}?jenjang=${jenjang.toUpperCase()}`);
        if (!response.ok) throw new Error("Gagal mengambil data dari server");

        const data = await response.json();
        
        // Simpan ke variabel lokal (yang sudah dideklarasikan di atas) dan window
        mkList = data; 
        window.mkList = data; 
        
        console.log(`Daftar MK ${jenjang} berhasil dimuat:`, mkList.length, "MK");

    } catch (err) {
        mkList = [];
        console.error(`Gagal memuat daftar MK:`, err);
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

// 3. Filter Search
function filterMK() {
    const input = document.getElementById('searchMK').value.toLowerCase();
    const suggestionBox = document.getElementById('mkSuggestions');
    
    // Pastikan menggunakan mkList dari scope yang benar
    const listData = window.mkList || mkList || [];

    if (!input || listData.length === 0) {
        suggestionBox.innerHTML = '';
        suggestionBox.classList.add('d-none');
        return;
    }

    const matched = listData.filter(mk => mk.toLowerCase().includes(input)).slice(0, 10);

    if (matched.length === 0) {
        suggestionBox.innerHTML = '';
        suggestionBox.classList.add('d-none');
        return;
    }

    suggestionBox.innerHTML = '';
    matched.forEach(mk => {
        const a = document.createElement('a');
        a.href = "#";
        a.className = "list-group-item list-group-item-action py-2";
        a.style.cursor = "pointer";
        a.innerHTML = `<i class="bi bi-book me-2"></i>${mk}`;
        a.onclick = (e) => {
            e.preventDefault();
            document.getElementById('searchMK').value = mk;
            suggestionBox.innerHTML = '';
            suggestionBox.classList.add('d-none');
        };
        suggestionBox.appendChild(a);
    });

    suggestionBox.classList.remove('d-none');
}

// 4. Generate Tombol CPL (a-k untuk S1, a-h untuk S2/S3)
function generateCPLButtons(jenjang) {
    const cplContainer = document.getElementById("cplButtons");
    if (!cplContainer) return;

    cplContainer.innerHTML = "";
    selectedCPL.clear();

    const data = jenjangCPLData[jenjang];
    if (!data) return;

    data.cplList.forEach(char => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = char;
        btn.className = "btn btn-sm btn-outline-dark px-3 fw-bold";
        
        btn.onclick = () => {
            if (selectedCPL.has(char)) {
                selectedCPL.delete(char);
                btn.classList.remove("btn-primary", "text-white");
                btn.classList.add("btn-outline-dark");
            } else {
                selectedCPL.add(char);
                btn.classList.remove("btn-outline-dark");
                btn.classList.add("btn-primary", "text-white");
            }
            // Panggil fungsi update tabel asesmen jika ada
            if (typeof updateAssessmentTable === "function") updateAssessmentTable();
        };
        cplContainer.appendChild(btn);
    });
}

// Jalankan fungsi inisialisasi
initJenjangButtons();

// =============================================================================================================
// Fungsi untuk tabel asesmen
// Assessment Table State
function addAssessmentRow() {
    const jumlahCPMK = parseInt(document.getElementById("jumlahCPMK").value);
    if (!jumlahCPMK || jumlahCPMK < 1) {
        return alert("Mohon tentukan jumlah CPMK terlebih dahulu!");
    }

    const table = document.getElementById("assessmentRows");
    const row = document.createElement("div");
    row.className = "assessment-row p-2 mb-2 border-bottom"; // Lebih simpel karena header sudah ada
    row.dataset.index = assessmentCount;

    // Template row tanpa label (karena sudah ada header)
    row.innerHTML = `
        <div class="row g-2 align-items-center px-2">
            <div class="col-md-2">
                <select class="form-select form-select-sm cpmk-select"></select>
            </div>
            <div class="col-md-2">
                <select class="form-select form-select-sm tipe-select">
                    <option value="TUGAS">TUGAS</option>
                    <option value="KUIS">KUIS</option>
                    <option value="LAPORAN">LAPORAN</option>
                    <option value="UTS">UTS</option>
                    <option value="UAS">UAS</option>
                    <option value="PROJECT">PROJECT</option>
                </select>
            </div>
            <div class="col-md-2">
                <input type="text" class="form-control form-control-sm" maxlength="15" placeholder="...">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control form-control-sm persentase-input" step="0.01" min="0" placeholder="0">
            </div>
            <div class="col-md-1">
                <input type="number" class="form-control form-control-sm" min="1" value="100">
            </div>
            <div class="col-md-1">
                <select class="form-select form-select-sm cpl-select"></select>
            </div>
            <div class="col-md-2">
                <select class="form-select form-select-sm pi-select"></select>
            </div>
        </div>
    `;

    table.appendChild(row);

    // 1. Isi Dropdown CPMK
    const cpmkSelect = row.querySelector(".cpmk-select");
    for (let i = 1; i <= jumlahCPMK; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `CPMK ${i}`;
        cpmkSelect.appendChild(opt);
    }

    // 2. Isi Dropdown CPL
    const cplSelect = row.querySelector(".cpl-select");
    // Gunakan array dari Set selectedCPL
    const sortedCPL = Array.from(selectedCPL).sort();
    
    if (sortedCPL.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "?";
        cplSelect.appendChild(opt);
    } else {
        sortedCPL.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            cplSelect.appendChild(opt);
        });
    }

    // 3. Event Listeners
    cplSelect.onchange = () => updatePIDropdown(row, cplSelect.value);
    
    const persentaseInput = row.querySelector(".persentase-input");
    persentaseInput.oninput = validateTotalPercentage;

    // Inisialisasi PI pertama kali berdasarkan nilai CPL pertama
    updatePIDropdown(row, cplSelect.value);
    
    assessmentCount++;
    validateTotalPercentage();
}

function removeAssessmentRow() {
    const table = document.getElementById("assessmentRows");
    if (table.lastChild) {
        table.removeChild(table.lastChild);
        validateTotalPercentage();
    }
}

// Update daftar CPL di semua baris yang sudah ada tanpa menghapusnya
function updateAssessmentTable() {
    const rows = document.querySelectorAll(".assessment-row");
    rows.forEach(row => {
        const cplSelect = row.querySelector(".cpl-select");
        const currentVal = cplSelect.value;
        
        cplSelect.innerHTML = "";
        selectedCPL.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c.toUpperCase();
            if (c === currentVal) opt.selected = true;
            cplSelect.appendChild(opt);
        });
        
        updatePIDropdown(row, cplSelect.value);
    });
}

function updatePIDropdown(row, cpl) {
    // Cari elemen select PI di dalam baris tersebut
    const piSelect = row.querySelector(".pi-select");
    if (!piSelect) return;

    piSelect.innerHTML = ""; // Bersihkan pilihan lama

    // Validasi apakah jenjang dan CPL tersedia
    if (!selectedJenjang || !jenjangCPLData[selectedJenjang]) {
        console.error("Jenjang belum dipilih!");
        return;
    }

    const dataPI = jenjangCPLData[selectedJenjang].piMap[cpl] || [];

    if (dataPI.length === 0) {
        const opt = document.createElement("option");
        opt.textContent = "-";
        piSelect.appendChild(opt);
    } else {
        dataPI.forEach(pi => {
            const opt = document.createElement("option");
            opt.value = pi;
            opt.textContent = pi; // Agar tampilan rapi (misal: A1)
            piSelect.appendChild(opt);
        });
    }
}

function validateTotalPercentage() {
    const warning = document.getElementById("persentaseWarning");
    const inputs = document.querySelectorAll(".persentase-input");
    let total = 0;

    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) total += val;
    });

    const roundedTotal = Math.round(total * 100) / 100;

    if (Math.abs(roundedTotal - 100) < 0.01) {
        warning.className = "form-text text-success fw-bold";
        warning.innerHTML = `<i class="bi bi-check-circle"></i> Total persentase sudah 100%`;
    } else {
        warning.className = "form-text text-danger fw-bold";
        warning.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Total: ${roundedTotal}% (Harus 100%)`;
    }
}

// =============================================================================================================
// Fungsi Save Template
function saveTemplate() {
    const namaMK = document.getElementById("searchMK").value.trim() || "TanpaNama";
    const jumlahCPMK = document.getElementById("jumlahCPMK").value;
    if (!selectedJenjang) return alert("Pilih Jenjang terlebih dahulu!");

    const rows = [
        ["JENJANG", selectedJenjang],
        ["MATA_KULIAH", namaMK],
        ["JUMLAH_CPMK", jumlahCPMK],
        ["CPL", ...Array.from(selectedCPL)],
        ["CPMK", "TIPE", "DESKRIPSI", "BOBOT", "MAKSIMAL", "CPL", "PI"]
    ];

    const assessmentRows = document.querySelectorAll(".assessment-row");
    assessmentRows.forEach(row => {
        // Mengambil data berdasarkan class agar lebih aman daripada urutan index
        const cpmk = row.querySelector(".cpmk-select").value;
        const tipe = row.querySelector(".tipe-select").value;
        const inputs = row.querySelectorAll("input"); // [0]: Deskripsi, [1]: Persentase, [2]: Maksimal
        const cpl = row.querySelector(".cpl-select").value;
        const pi = row.querySelector(".pi-select").value;

        rows.push([
            cpmk,
            tipe,
            inputs[0].value,
            inputs[1].value,
            inputs[2].value,
            cpl,
            pi
        ]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const fileName = `template_${namaMK.replace(/\s+/g, '_')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

// =============================================================================================================
// Fungsi Load Template
function loadTemplate(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const lines = e.target.result.split("\n").map(line => line.trim().split(","));

        // 1. Parse Jenjang (Baris 0)
        let jenjangFromFile = lines[0][1]?.trim();
        if (jenjangFromFile) {
            selectedJenjang = jenjangFromFile;
            initJenjangButtons(); 
            const btnJenjang = Array.from(document.querySelectorAll("#jenjangButtons button"))
                                    .find(b => b.textContent === selectedJenjang);
            if (btnJenjang) btnJenjang.click();
        }

        // 2. Parse Nama Mata Kuliah (Baris 1)
        if (lines[1][0] === "MATA_KULIAH") {
            document.getElementById("searchMK").value = lines[1][1] || "";
        }

        // 3. Parse Jumlah CPMK (Baris 2)
        document.getElementById("jumlahCPMK").value = lines[2][1];

        setTimeout(() => {
            // 4. Parse CPL (Baris 3)
            const savedCPLs = lines[3].slice(1); 
            selectedCPL.clear();
            
            document.querySelectorAll("#cplButtons button").forEach(btn => {
                const char = btn.textContent.trim();
                if (savedCPLs.includes(char)) {
                    selectedCPL.add(char);
                    btn.classList.remove("btn-outline-dark");
                    btn.classList.add("btn-primary", "text-white");
                }
            });

            // 5. Fill Assessment Rows (Mulai dari Baris 5 karena Baris 4 adalah Header Tabel)
            const table = document.getElementById("assessmentRows");
            table.innerHTML = ""; 
            assessmentCount = 0;

            for (let i = 5; i < lines.length; i++) {
                const data = lines[i];
                if (!data[0] || data[0] === "") continue; 

                addAssessmentRow();
                const row = document.querySelectorAll(".assessment-row")[assessmentCount - 1];
                
                row.querySelector(".cpmk-select").value = data[0];
                row.querySelector(".tipe-select").value = data[1];
                const inputs = row.querySelectorAll("input");
                inputs[0].value = data[2]; 
                inputs[1].value = data[3]; 
                inputs[2].value = data[4]; 
                
                const cplSelect = row.querySelector(".cpl-select");
                cplSelect.value = data[5];
                updatePIDropdown(row, data[5]);
                
                const piSelect = row.querySelector(".pi-select");
                piSelect.value = data[6];
            }
            validateTotalPercentage();
        }, 150); 
    };

    reader.readAsText(file);
    event.target.value = ""; 
}

// =============================================================================================================
// Fungsi Generate form penilaian CSV
function generateCSVTemplate() {
    const jumlahMhs = parseInt(document.getElementById("jumlahMahasiswa").value);
    const namaMK = document.getElementById("searchMK").value.trim() || "MataKuliah";
    const assessments = document.querySelectorAll(".assessment-row");

    if (!jumlahMhs || jumlahMhs < 1) {
        return alert("Masukkan jumlah mahasiswa terlebih dahulu!");
    }
    if (assessments.length === 0) {
        return alert("Buat rencana asesmen terlebih dahulu agar kolom nilai tersedia!");
    }

    // Membangun Header: No, NIM, Nama, lalu Kolom Penilaian (Deskripsi/PI)
    const header = ["No", "NIM", "Nama"];
    assessments.forEach(row => {
        const deskripsi = row.querySelector("input[placeholder='...']").value.trim() || "Item";
        const pi = row.querySelector(".pi-select").value || "pi";
        header.push(`${deskripsi}/${pi}`);
    });

    const rows = [header];

    // Membuat baris kosong untuk diisi dosen
    for (let i = 1; i <= jumlahMhs; i++) {
        // Mengisi kolom No dengan angka, sisanya kosong sesuai jumlah kolom header
        const emptyCols = new Array(header.length - 1).fill("");
        rows.push([i, ...emptyCols]);
    }

    // Konversi ke CSV
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    // Nama file dinamis: form_nilai_NamaMK.csv
    const fileName = `form_nilai_${namaMK.replace(/\s+/g, '_')}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

document.getElementById('csvUpload').addEventListener('change', function () {
    const file = this.files[0];
    const statusDiv = document.getElementById('uploadStatus'); 
    
    if (!file || !statusDiv) return; 

    if (file.name.endsWith('.csv')) {
        statusDiv.innerHTML = `
            <div class="alert alert-success d-flex align-items-center py-2" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i>
                <div>File <strong>${file.name}</strong> berhasil diunggah!</div>
            </div>`;
    } else {
        statusDiv.innerHTML = `
            <div class="alert alert-danger d-flex align-items-center py-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>Format file salah! Gunakan file .csv</div>
            </div>`;
        this.value = ""; 
    }
});

// =============================================================================================================
// Fungsi Generate CPMK Portfolio
function generateCPMKPortfolio() {
    const fileInput = document.getElementById('csvUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Silakan upload file CSV terlebih dahulu.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(Boolean).map(line => line.split(','));
        
        // Ambil header dan bersihkan spasi
        const headers = lines[0].map(h => h.trim());
        // Data nilai (skip baris header, skip kolom No, NIM, Nama)
        const scores = lines.slice(1).map(row => row.map(cell => cell.trim()));

        // --- STEP 1: Bangun Map CPMK dari UI Tabel Asesmen ---
        const assessmentRows = document.querySelectorAll('.assessment-row');
        const cpmkMap = {};

        assessmentRows.forEach(row => {
            const cpmk = row.querySelector('.cpmk-select').value;
            const deskripsi = row.querySelector('input[placeholder="..."]').value.trim();
            const pi = row.querySelector('.pi-select').value.trim();
            
            // Format label harus SAMA dengan header CSV (Deskripsi/PI)
            const label = `${deskripsi}/${pi}`;
            const maxScore = parseFloat(row.querySelectorAll('input')[2].value) || 100;
            const persentase = parseFloat(row.querySelector('.persentase-input').value) || 0;

            if (!cpmkMap[cpmk]) cpmkMap[cpmk] = [];
            cpmkMap[cpmk].push({ label, max: maxScore, persentase });
        });

        const cpmkList = Object.keys(cpmkMap).sort();
        const resultRows = [];
        const performanceData = [];

        // --- STEP 2: Hitung Rata-rata per CPMK ---
        cpmkList.forEach(cpmk => {
            const items = cpmkMap[cpmk];
            let totalWeightedAvg = 0;
            let studentCount = scores.length;

            items.forEach(item => {
                const colIndex = headers.findIndex(h => h === item.label);
                if (colIndex === -1) {
                    console.warn(`Kolom "${item.label}" tidak ditemukan di CSV.`);
                    return;
                }

                let sumScoreItem = 0;
                let validInItem = 0;

                scores.forEach(row => {
                    const val = parseFloat(row[colIndex]);
                    if (!isNaN(val)) {
                        sumScoreItem += (val / item.max) * 100;
                        validInItem++;
                    }
                });

                // Rata-rata item ini untuk seluruh mahasiswa
                const avgItem = validInItem > 0 ? sumScoreItem / validInItem : 0;
                totalWeightedAvg += avgItem; 
            });

            // Rata-rata CPMK (Rerata dari item-item pembentuknya)
            const finalAvg = items.length > 0 ? totalWeightedAvg / items.length : 0;
            const totalPersen = items.reduce((s, i) => s + i.persentase, 0);
            
            // Klasifikasi Evaluasi
            let evaluasi = 'Sangat Baik';
            if (finalAvg < 60) evaluasi = 'Kurang';
            else if (finalAvg < 70) evaluasi = 'Cukup';
            else if (finalAvg < 80) evaluasi = 'Baik';

            resultRows.push({
                cpmk: `CPMK ${cpmk}`,
                persentase: totalPersen.toFixed(1),
                standar: 70,
                capaian: finalAvg.toFixed(2),
                evaluasi: evaluasi
            });
        });

        window.cpmkData = resultRows; // Simpan untuk keperluan download PDF nantinya

        // --- STEP 3: Render Tabel Hasil (Gunakan Bootstrap) ---
        // Contoh untuk bagian CPMK di buatPorto.js
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-bordered table-sm align-middle" style="font-size: 0.85rem;">
                    <thead class="table-light">
                        <tr>
                            <th>CPMK</th>
                            <th>Capaian</th>
                            <th>Eval</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultRows.map(r => `
                            <tr>
                                <td>${r.cpmk}</td>
                                <td>${r.capaian}</td>
                                <td><span class="badge ${r.capaian < 70 ? 'bg-danger' : 'bg-success'}">${r.evaluasi}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        document.getElementById('cpmkPerformance').innerHTML = tableHtml;

        // --- STEP 4: Render Chart (Gunakan Chart.js) ---
        document.getElementById('sectionCPMK').classList.remove('d-none');
        renderCPMKChart(resultRows);

        // --- STEP 5: Generate CPL Portfolio ---
        const cplMap = {};

        assessmentRows.forEach(row => {
            const deskripsi = row.querySelector('input[placeholder="..."]').value.trim();
            const pi = row.querySelector('.pi-select').value.trim();
            const label = `${deskripsi}/${pi}`;
            const max = parseFloat(row.querySelectorAll('input')[2].value) || 100;
            const cpl = row.querySelector('.cpl-select').value;

            if (cpl) {
                if (!cplMap[cpl]) cplMap[cpl] = [];
                cplMap[cpl].push({ label, max });
            }
        });

        const usedCPLChartData = {};

        Object.entries(cplMap).forEach(([cpl, items]) => {
            let totalWeightedAvg = 0;

            items.forEach(item => {
                const colIndex = headers.findIndex(h => h === item.label);
                if (colIndex === -1) return;

                let sumScoreItem = 0;
                let validCount = 0;

                scores.forEach(row => {
                    const val = parseFloat(row[colIndex]);
                    if (!isNaN(val)) {
                        sumScoreItem += (val / item.max) * 100;
                        validCount++;
                    }
                });

                const avgItem = validCount > 0 ? sumScoreItem / validCount : 0;
                totalWeightedAvg += avgItem;
            });

            const finalCplAvg = items.length > 0 ? totalWeightedAvg / items.length : 0;
            usedCPLChartData[cpl] = finalCplAvg.toFixed(2);

            let evaluasiCpl = 'Sangat Baik';
            if (finalCplAvg < 60) evaluasiCpl = 'Kurang';
            else if (finalCplAvg < 70) evaluasiCpl = 'Cukup';
            else if (finalCplAvg < 80) evaluasiCpl = 'Baik';
            
            usedCPLChartData[cpl] = { 
                capaian: finalCplAvg.toFixed(2), 
                evaluasi: evaluasiCpl 
            };
        });

        // --- STEP 6: Render Tabel CPL (Gaya Bootstrap) ---
        const cplResultRows = Object.entries(usedCPLChartData).map(([cpl, data]) => ({ 
            cpl, 
            capaian: data.capaian, 
            evaluasi: data.evaluasi 
        }));
        window.cplData = cplResultRows; // Simpan untuk keperluan export/PDF

        let cplTableHtml = `
            <div class="table-responsive mt-4">
                <table class="table table-bordered table-sm align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>CPL</th><th>Performance</th><th>Evaluasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cplResultRows.map(r => `
                            <tr>
                                <td class="fw-bold">CPL ${r.cpl}</td>
                                <td>${r.capaian}</td>
                                <td><span class="badge ${r.capaian < 70 ? 'bg-danger' : 'bg-success'}">${r.evaluasi}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        document.getElementById('cplPerformance').innerHTML = cplTableHtml;

        // --- STEP 7: Render CPL Chart ---
        document.getElementById('sectionCPL').classList.remove('d-none');
        renderCPLChart(usedCPLChartData);

        // --- STEP 8: Generate PI Portfolio ---
        const PI_MAP_LIST = {
            S1: ["a1", "a2", "a3", "b1", "b2", "b3", "b4", "c1", "c2", "c3", "c4", "c5", "d1", "d2", "d3", "e1", "e2", "e3", "e4", "f1", "f2", "g1", "g2", "g3", "g4", "g5", "h1", "h2", "i1", "i2", "j1", "j2", "k1", "k2", "k3", "k4"],
            S2: ["a1", "a2", "a3", "b1", "b2", "b3", "b4", "c1", "c2", "c3", "d1", "d2", "d3", "d4", "d5", "e1", "e2", "f1", "f2", "f3", "f4", "g1", "g2", "g3", "g4", "g5", "h1", "h2", "h3", "h4"],
            S3: ["a1", "a2", "b1", "b2", "c1", "c2", "c3", "d1", "d2", "d3", "d4", "e1", "e2", "e3", "e4", "f1", "f2", "f3", "g1", "g2", "g3", "h1", "h2", "h3", "h4"]
        };

        const currentPiMap = {};
        assessmentRows.forEach(row => {
            const deskripsi = row.querySelector('input[placeholder="..."]').value.trim();
            const pi = row.querySelector('.pi-select').value.trim();
            const label = `${deskripsi}/${pi}`;
            const max = parseFloat(row.querySelectorAll('input')[2].value) || 100;

            if (pi && pi !== "-") {
                if (!currentPiMap[pi]) currentPiMap[pi] = [];
                currentPiMap[pi].push({ label, max });
            }
        });

        const usedPIChartData = {};

        Object.entries(currentPiMap).forEach(([pi, items]) => {
            let totalWeightedAvg = 0;
            items.forEach(item => {
                const colIndex = headers.findIndex(h => h === item.label);
                if (colIndex === -1) return;

                let sumScore = 0;
                let validMhs = 0;
                scores.forEach(row => {
                    const val = parseFloat(row[colIndex]);
                    if (!isNaN(val)) {
                        sumScore += (val / item.max) * 100;
                        validMhs++;
                    }
                });
                totalWeightedAvg += (validMhs > 0 ? sumScore / validMhs : 0);
            });
            const finalPiAvg = (totalWeightedAvg / items.length);
                
            let evaluasiPi = 'Sangat Baik';
            if (finalPiAvg < 60) evaluasiPi = 'Kurang';
            else if (finalPiAvg < 70) evaluasiPi = 'Cukup';
            else if (finalPiAvg < 80) evaluasiPi = 'Baik';

            usedPIChartData[pi] = {
                capaian: finalPiAvg.toFixed(2),
                evaluasi: evaluasiPi
            };
        });

        // Simpan data untuk keperluan export/PDF
        window.piMap = currentPiMap;
        window.piData = Object.entries(usedPIChartData).map(([pi, data]) => ({ 
            pi, 
            capaian: data.capaian, 
            evaluasi: data.evaluasi
        }));

        // --- STEP 9: Render Tabel PI ---
        let piTableHtml = `
            <div class="table-responsive mt-4">
                <table class="table table-bordered table-sm align-middle">
                    <thead class="table-light">
                        <tr><th>PI</th><th>Performance</th><th>Evaluasi</th></tr>
                    </thead>
                    <tbody>
                        ${window.piData.length > 0 ? window.piData.map(r => `
                            <tr><td>${r.pi}</td><td class="${r.capaian < 70 ? 'text-danger fw-bold' : ''}">${r.capaian}</td>
                            <td><span class="badge ${r.capaian < 70 ? 'bg-danger' : 'bg-success'}">${r.evaluasi}</span></td>
                            </tr>
                        `).join('') : '<tr><td colspan="2" class="text-center text-muted">Tidak ada data PI</td></tr>'}
                    </tbody>
                </table>
            </div>`;
        document.getElementById('piPerformance').innerHTML = piTableHtml;

        // --- STEP 10: Render PI Chart ---
        document.getElementById('sectionPI').classList.remove('d-none');
        renderPIChart(PI_MAP_LIST[selectedJenjang] || [], usedPIChartData);
    };
    reader.readAsText(file);
}

function renderCPMKChart(data) {
    const ctx = document.getElementById('cpmkChart').getContext('2d');
    if (window.cpmkChart instanceof Chart) window.cpmkChart.destroy();

    window.cpmkChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.cpmk),
            datasets: [
                {
                    label: 'Standar Minimal',
                    data: data.map(() => 70),
                    type: 'line',
                    borderColor: '#ffc107',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    order: 1
                },
                {
                    label: 'Capaian Mahasiswa',
                    data: data.map(d => d.capaian),
                    backgroundColor: 'rgba(13, 110, 253, 0.6)',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 100, title: { display: true, text: 'Nilai (0-100)' } }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderCPLChart(usedData) {
    const CPL_MAP = {
        S1: ['a','b','c','d','e','f','g','h','i','j','k'],
        S2: ['a','b','c','d','e','f','g','h'],
        S3: ['a','b','c','d','e','f','g','h']
    };

    const allCPLs = CPL_MAP[selectedJenjang] || [];
    const labels = allCPLs.map(cpl => `CPL ${cpl}`);
    const dataValues = allCPLs.map(cpl => {
        const item = usedData[cpl];
        return item ? parseFloat(item.capaian) : 0; 
    });

    const ctx = document.getElementById('cplChart').getContext('2d');
    if (window.cplChart instanceof Chart) window.cplChart.destroy();

    window.cplChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Standar (70)',
                    data: labels.map(() => 70),
                    type: 'line',
                    borderColor: '#ffc107',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Capaian CPL',
                    data: dataValues,
                    backgroundColor: 'rgba(0, 204, 204, 0.6)', // Warna Toska agar beda dengan CPMK
                    borderColor: '#00cccc',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 100 }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderPIChart(allPIs, usedData) {
    const ctx = document.getElementById('piChart').getContext('2d');
    if (window.piChart instanceof Chart) window.piChart.destroy();

    const labels = allPIs;
    const dataValues = allPIs.map(pi => {
        const item = usedData[pi];
        return item ? parseFloat(item.capaian) : 0;
    });

    window.piChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Standar (70)',
                    data: labels.map(() => 70),
                    type: 'line',
                    borderColor: '#ffc107',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Capaian PI',
                    data: dataValues,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Memungkinkan chart menyesuaikan tinggi
            scales: {
                y: { beginAtZero: true, max: 100 },
                x: { 
                    ticks: { 
                        font: { size: 9 }, // Memperkecil font label PI (a1, a2, dll)
                        autoSkip: false 
                    } 
                }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// =============================================================================================================
// Fungsi untuk mengirim data nilai ke GAS
async function sendToSheet() {
    const mkName = document.getElementById('searchMK').value.trim();
    const kelas = document.getElementById('kelas').value.trim();
    const tahun = document.getElementById('tahun').value.trim();
    const fileInput = document.getElementById('csvUpload');
    const file = fileInput.files[0];
    const overlay = document.getElementById("loadingOverlay");

    // Validasi Awal
    if (!mkName || !kelas) {
        return Swal.fire('Data Belum Lengkap', 'Pilih Mata Kuliah dan Kelas terlebih dahulu.', 'warning');
    }
    if (!window.piData || !window.piMap) {
        return Swal.fire('Portofolio Belum Siap', 'Silakan klik "Kalkulasi Portofolio" terlebih dahulu.', 'warning');
    }
    if (!file) {
        return Swal.fire('File CSV Kosong', 'Upload file CSV nilai terlebih dahulu.', 'warning');
    }

    // Konfirmasi pengiriman
    const confirm = await Swal.fire({
        title: 'Kirim Data ke Cloud?',
        text: "Sistem akan mengirim rekap MK dan nilai detail mahasiswa.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Kirim Sekarang',
        cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    if (overlay) overlay.style.display = "flex";

    try {
        // --- PROSES 1: Kirim Rekap Nilai MK ---
        // Kita olah data CPL & PI Chart ke dalam satu payload flat
        const cplFlat = {};
        window.cplData.forEach(d => cplFlat[d.cpl] = d.capaian);
        
        const piFlat = {};
        window.piData.forEach(d => piFlat[d.pi] = d.capaian);

        const payloadMK = {
            "jenjang": selectedJenjang,
            "Nama Mata Kuliah": mkName,
            "Kelas": kelas,
            "Tahun": tahun,
            ...cplFlat,
            ...piFlat
        };

        const fdMK = new FormData();
        fdMK.append("data", JSON.stringify(payloadMK));

        const resMK = await fetch("https://script.google.com/macros/s/AKfycbyspyd3xsVS_gAcYx1nOCydU2zy3FLTsVR2CxTf2TBGQ_h0j99mRdWr5lANB5DB2EAXrQ/exec", {
            method: "POST",
            body: fdMK
        });
        const resultMK = await resMK.json();

        if (resultMK.result !== "success") throw new Error("Gagal kirim rekap MK: " + resultMK.message);

        // --- PROSES 2: Olah & Kirim Nilai Mahasiswa (Batch Processing) ---
        const csvText = await file.text();
        const lines = csvText.split('\n').filter(Boolean).map(l => l.split(',').map(c => c.trim()));
        const headers = lines[0];
        const dataRows = lines.slice(1);
        const piHeaders = headers.slice(3); // Kolom Nilai dimulai dari indeks 3

        // Siapkan Array untuk dikirim satu per satu (atau batch)
        for (const row of dataRows) {
            const nim = row[1];
            const nama = row[2];
            const scoreMap = {};
            piHeaders.forEach((h, i) => { scoreMap[h] = parseFloat(row[i + 3]); });

            const piScoresStudent = {};
            Object.entries(window.piMap).forEach(([pi, items]) => {
                let total = 0, count = 0;
                items.forEach(({ label, max }) => {
                    const rawScore = scoreMap[label];
                    if (!isNaN(rawScore)) {
                        total += (rawScore / max) * 100;
                        count++;
                    }
                });
                piScoresStudent[pi] = count > 0 ? (total / count).toFixed(2) : "0";
            });

            const studentPayload = {
                "Nama Mata Kuliah": mkName,
                "Kelas": kelas,
                "NIM": nim,
                "Nama": nama,
                "jenjang": selectedJenjang, // Masukkan ke dalam payload utama
                ...piScoresStudent
            };

            const fdStudent = new FormData();
            fdStudent.append("data", JSON.stringify(studentPayload));
            // Tambahkan jenjang ke dalam FormData juga sebagai cadangan
            fdStudent.append("jenjang", selectedJenjang);

            // KIRIM DENGAN QUERY STRING agar terbaca di e.parameter GAS
            const studentUrl = `https://script.google.com/macros/s/AKfycby0WtntXyuHEwlwBFmx7lcpOX_uMZ267s075Ey35tMpcr88HdvVjq8pK7rBPDr92658/exec?jenjang=${selectedJenjang}`;

            await fetch(studentUrl, {
                method: "POST",
                body: fdStudent
            });
        }

        if (overlay) overlay.style.display = "none";
        Swal.fire('Berhasil!', 'Semua data penilaian berhasil disinkronisasi ke Spreadsheet.', 'success');

    } catch (err) {
        if (overlay) overlay.style.display = "none";
        console.error(err);
        Swal.fire('Gagal Sinkron', err.message, 'error');
    }
}

// =============================================================================================================
// // Fungsi untuk mengunduh canvas sebagai gambar PNG
// function downloadChart(canvasId, fileName) {
//     const canvas = document.getElementById(canvasId);
//     if (!canvas) return;
    
//     // Buat link download sementara
//     const link = document.createElement('a');
//     link.download = `${fileName}.png`;
//     link.href = canvas.toDataURL('image/png');
//     link.click();
// }

// // Fungsi Download Porto yang sudah disederhanakan (Tanpa Image Module)
// async function generateAndDownloadFullPortfolio() {
//     const mkName = document.getElementById('searchMK').value.trim();
//     const overlay = document.getElementById("loadingOverlay");
    
//     if (!mkName) return alert("Silakan pilih Mata Kuliah terlebih dahulu.");
    
//     try {
//         if (overlay) overlay.style.display = "flex";

//         // 1. Ambil Template dari GAS (Sama seperti sebelumnya)
//         const scriptUrl = 'URL_GAS_ANDA'; 
//         const params = new URLSearchParams({ nama: mkName, jenjang: selectedJenjang || "" });
//         const response = await fetch(`${scriptUrl}?${params.toString()}`);
//         const result = await response.json();

//         if (result.status !== "SUCCESS") throw new Error("Template tidak ditemukan.");

//         // 2. Proses DOCX dengan PizZip & Docxtemplater Dasar (Gratis)
//         const binaryString = atob(result.base64);
//         const PizZipLib = window.PizZip;
//         const DocxtemplaterLib = window.docxtemplater;

//         const zip = new PizZipLib(binaryString);
//         const doc = new DocxtemplaterLib(zip, {
//             paragraphLoop: true,
//             linebreaks: true
//         });

//         // 3. Inject Data Teks dan Tabel
//         doc.setData({
//             MK: mkName,
//             Kelas: document.getElementById("kelas").value,
//             Evaluasi: document.getElementById("evaluasi").value,
//             Rencana: document.getElementById("rencana").value,
//             // Tabel sederhana menggunakan tabulasi \t
//             Data_CPMK: (window.cpmkData || []).map(r => `${r.cpmk}\t${r.capaian}\t${r.evaluasi}`).join("\n"),
//             Data_CPL: (window.cplData || []).map(r => `${r.cpl}\t${r.capaian}`).join("\n"),
//             Data_PI: (window.piData || []).map(r => `${r.pi}\t${r.capaian}`).join("\n")
//         });

//         doc.render();

//         const out = doc.getZip().generate({
//             type: "blob",
//             mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//         });

//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(out);
//         link.download = `Portofolio_${mkName}.docx`;
//         link.click();

//         alert("Dokumen berhasil diunduh. Silakan unduh gambar grafik secara manual dan tempelkan ke dalam dokumen.");

//     } catch (err) {
//         console.error(err);
//         alert(err.message);
//     } finally {
//         if (overlay) overlay.style.display = "none";
//     }
// }