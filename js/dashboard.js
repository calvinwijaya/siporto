const URL_GAS_CHECKER = "https://script.google.com/macros/s/AKfycbzTjilMg9Y3bMLa5K7vxTOokGeop-vIO2CHgy-Qq4a0dZxbduQrAQuOioJEfgEDHwu3dQ/exec"
const ADMIN_EMAILS = ["calvin.wijaya@mail.ugm.ac.id", "cecep.pratama@ugm.ac.id"];

// Variabel Global
let globalData = null;
let myChartPersonal = null; 
let myChartGlobal = null;
let activeSemester = "";

// Variabel State untuk Search dan Sort
let currentDataState = {
    personalBelum: [], personalSudah: [], adminBelum: [], adminSudah: []
};
let isSortAscending = true;
let searchKeyword = "";

const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) {
    window.location.href = 'index.html';
} else {
    document.getElementById("userNama").textContent = user.nama;
    if (ADMIN_EMAILS.includes(user.email)) {
        document.getElementById("adminSection").style.display = "block";
    }
    initDashboard(user.email);
}

// Event Listeners untuk Toolbar
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    searchKeyword = e.target.value.toLowerCase().trim();
    renderTables(); 
});

document.getElementById('btnSort').addEventListener('click', () => {
    isSortAscending = !isSortAscending; // Balik arah sort
    const icon = document.querySelector('#btnSort i');
    icon.className = isSortAscending ? 'bi bi-sort-alpha-down' : 'bi bi-sort-alpha-up';
    renderTables();
});

document.getElementById('btnRefresh').addEventListener('click', () => {
    document.getElementById('loadingOverlay').style.display = "flex";
    initDashboard(user.email); // Tarik data ulang
});

async function initDashboard(emailUser) {
    try {
        const response = await fetch(`${URL_GAS_CHECKER}?email=${encodeURIComponent(emailUser)}`);
        globalData = await response.json(); 
        document.getElementById('loadingOverlay').style.display = "none";

        const semesterArray = Object.keys(globalData.globalStats).sort().reverse(); 
        const selectEl = document.getElementById("filterSemester");
        selectEl.innerHTML = ""; 
        
        if(semesterArray.length === 0) {
            selectEl.innerHTML = `<option value="">Tidak ada data semester</option>`;
            return;
        }

        semesterArray.forEach(sem => selectEl.innerHTML += `<option value="${sem}">${sem}</option>`);

        // Hapus listener lama jika ada agar tidak dobel saat refresh
        const newSelectEl = selectEl.cloneNode(true);
        selectEl.parentNode.replaceChild(newSelectEl, selectEl);
        newSelectEl.addEventListener('change', function() {
            processDataForSemester(this.value);
        });

        activeSemester = semesterArray[0];
        processDataForSemester(activeSemester);

    } catch (error) {
        console.error("Kesalahan jaringan:", error);
        document.getElementById('loadingOverlay').style.display = "none";
        Swal.fire("Error", "Gagal memuat data dari server.", "error");
    }
}

function processDataForSemester(selectedSemester) {
    activeSemester = selectedSemester;
    document.querySelectorAll(".judulSemesterText").forEach(el => el.textContent = selectedSemester);

    currentDataState = { personalBelum: [], personalSudah: [], adminBelum: [], adminSudah: [] };

    // --- 1. PROSES DATA PERSONAL ---
    const mkSemesterIni = globalData.mkDiampu.filter(mk => mk.semesterAsli === selectedSemester);
    mkSemesterIni.forEach(mk => {
        const nC = String(mk.namaMK).toLowerCase().trim();
        const sC = String(mk.semesterKonversi).toLowerCase().trim();
        const kelasSelesai = globalData.mkSudahDinilai.filter(s => s.namaMK_clean === nC && s.semester_clean === sC);

        // LOGIKA BARU: Cek apakah ada minimal 1 kelas yang BUKAN IUP
        const adaReguler = kelasSelesai.some(k => String(k.kelas).toUpperCase().trim() !== "IUP");

        if (adaReguler) {
            // Jika ada kelas reguler (A, B, dll), masuk daftar Sudah Upload
            mk.kelasText = kelasSelesai.map(k => k.kelas).join(", ");
            currentDataState.personalSudah.push(mk);
        } else {
            // Jika kosong, atau HANYA ada kelas IUP, tetap masuk daftar Belum Upload
            currentDataState.personalBelum.push(mk);
        }
    });

    // --- 2. PROSES DATA ADMIN (GLOBAL) ---
    // Kita proses untuk SEMUA user agar Chart Global tetap bisa dihitung secara akurat
    const globalMKSemesterIni = globalData.globalMKList.filter(mk => mk.semesterAsli === selectedSemester);
    globalMKSemesterIni.forEach(mk => {
        const nC = mk.namaMK_clean;
        const sC = String(mk.semesterKonversi).toLowerCase().trim();
        const kelasSelesai = globalData.globalSudahDinilaiList.filter(s => s.namaMK_clean === nC && s.semester_clean === sC);

        // LOGIKA BARU: Berlaku juga untuk keseluruhan departemen
        const adaReguler = kelasSelesai.some(k => String(k.kelas).toUpperCase().trim() !== "IUP");

        if (adaReguler) {
            mk.kelasText = kelasSelesai.map(k => k.kelas).join(", ");
            currentDataState.adminSudah.push(mk);
        } else {
            currentDataState.adminBelum.push(mk);
        }
    });

    // --- 3. RENDER CHART ---
    // Override perhitungan GAS: Hitung manual dari array Admin agar sinkron dengan aturan IUP
    let jmlSudahGlobal = currentDataState.adminSudah.length;
    let jmlBelumGlobal = currentDataState.adminBelum.length;
    
    updateCharts(currentDataState.personalSudah.length, currentDataState.personalBelum.length, jmlSudahGlobal, jmlBelumGlobal);

    // --- 4. RENDER TABEL (Dengan Search & Sort) ---
    renderTables();
}

// Fungsi Khusus Men-generate Tabel HTML berdasarkan state Search & Sort
// Fungsi Khusus Men-generate Tabel HTML berdasarkan state Search & Sort
function renderTables() {
    const applyFilterAndSort = (arr) => {
        let res = arr.filter(mk => String(mk.namaMK).toLowerCase().includes(searchKeyword));
        res.sort((a, b) => {
            let nameA = String(a.namaMK).toLowerCase();
            let nameB = String(b.namaMK).toLowerCase();
            if (nameA < nameB) return isSortAscending ? -1 : 1;
            if (nameA > nameB) return isSortAscending ? 1 : -1;
            return 0;
        });
        return res;
    };

    // --- Render Personal Belum ---
    const pBelum = applyFilterAndSort(currentDataState.personalBelum);
    const tbodyPBelum = document.getElementById("tableBelumUpload");
    if (pBelum.length === 0) {
        tbodyPBelum.innerHTML = searchKeyword 
            ? `<tr><td colspan="4" class="text-center text-muted py-3">Pencarian tidak ditemukan.</td></tr>` 
            : `<tr><td colspan="4" class="text-center text-success py-3"><strong>Luar Biasa!</strong> Semua mata kuliah Anda telah diupload.</td></tr>`;
    } else {
        tbodyPBelum.innerHTML = pBelum.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td></tr>`).join("");
    }

    // --- Render Personal Sudah ---
    const pSudah = applyFilterAndSort(currentDataState.personalSudah);
    const tbodyPSudah = document.getElementById("tableSudahUpload");
    if (pSudah.length === 0) {
        tbodyPSudah.innerHTML = searchKeyword 
            ? `<tr><td colspan="5" class="text-center text-muted py-3">Pencarian tidak ditemukan.</td></tr>` 
            : `<tr><td colspan="5" class="text-center text-muted py-3">Belum ada data portofolio yang Anda selesaikan di semester ini.</td></tr>`;
    } else {
        tbodyPSudah.innerHTML = pSudah.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td><td class="text-center"><span class="badge bg-success">Kelas: ${mk.kelasText}</span></td></tr>`).join("");
    }

    // --- Render Admin (Jika punya akses) ---
    if (ADMIN_EMAILS.includes(user.email)) {
        // Admin Belum
        const aBelum = applyFilterAndSort(currentDataState.adminBelum);
        const tbodyABelum = document.getElementById("tableAdminBelum");
        if (aBelum.length === 0) {
            tbodyABelum.innerHTML = searchKeyword 
                ? `<tr><td colspan="5" class="text-center text-muted py-3">Pencarian tidak ditemukan.</td></tr>` 
                : `<tr><td colspan="5" class="text-center text-success py-3"><strong>Luar Biasa!</strong> Semua mata kuliah departemen telah diupload.</td></tr>`;
        } else {
            tbodyABelum.innerHTML = aBelum.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td><td>${mk.dosenPengampu}</td></tr>`).join("");
        }

        // Admin Sudah
        const aSudah = applyFilterAndSort(currentDataState.adminSudah);
        const tbodyASudah = document.getElementById("tableAdminSudah");
        if (aSudah.length === 0) {
            tbodyASudah.innerHTML = searchKeyword 
                ? `<tr><td colspan="5" class="text-center text-muted py-3">Pencarian tidak ditemukan.</td></tr>` 
                : `<tr><td colspan="5" class="text-center text-muted py-3">Belum ada data portofolio departemen yang diselesaikan di semester ini.</td></tr>`;
        } else {
            tbodyASudah.innerHTML = aSudah.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td><td class="text-center"><span class="badge bg-success">Kelas: ${mk.kelasText}</span></td></tr>`).join("");
        }
    }
}

function updateCharts(sudahPersonal, belumPersonal, sudahGlobal, belumGlobal) {
    // --- 1. Update Grafik Pribadi ---
    const totalPersonal = sudahPersonal + belumPersonal;
    let pctPersonal = totalPersonal > 0 ? Math.round((sudahPersonal / totalPersonal) * 100) : 0;
    document.getElementById("chartPersonalText").innerText = `${pctPersonal}%`;

    const ctxP = document.getElementById('chartPersonal').getContext('2d');
    if (myChartPersonal) myChartPersonal.destroy();
    myChartPersonal = new Chart(ctxP, {
        type: 'doughnut',
        data: {
            labels: ['Sudah Upload', 'Belum Upload'],
            datasets: [{
                data: [sudahPersonal, belumPersonal],
                backgroundColor: ['#198754', '#e9ecef'], // Hijau & Abu-abu terang
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });

    // --- 2. Update Grafik Departemen (Global) ---
    const totalGlobal = sudahGlobal + belumGlobal;
    let pctGlobal = totalGlobal > 0 ? Math.round((sudahGlobal / totalGlobal) * 100) : 0;
    document.getElementById("chartGlobalText").innerText = `${pctGlobal}%`;

    const ctxG = document.getElementById('chartGlobal').getContext('2d');
    if (myChartGlobal) myChartGlobal.destroy();
    myChartGlobal = new Chart(ctxG, {
        type: 'doughnut',
        data: {
            labels: ['Total Uploaded', 'Sisa MK Departemen'],
            datasets: [{
                data: [sudahGlobal, belumGlobal],
                backgroundColor: ['#0d6efd', '#e9ecef'], // Biru & Abu-abu terang
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
}

document.getElementById('toggleSidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');

    // Tutup semua submenu ketika sidebar dicollapse
    if (sidebar.classList.contains('collapsed')) {
        document.querySelectorAll('.sidebar .collapse.show').forEach(el => {
            const bsCollapse = bootstrap.Collapse.getInstance(el);
            if (bsCollapse) {
                bsCollapse.hide();
            } else {
                new bootstrap.Collapse(el, { toggle: false }).hide();
            }
        });
    }
});

function loadPage(eventOrPage, pagePath, key) {
    let finalPage, finalKey;

    if (typeof eventOrPage === 'object' && eventOrPage !== null) {
        if (eventOrPage.preventDefault) eventOrPage.preventDefault();
        finalPage = pagePath;
        finalKey = key;
    } else {
        finalPage = eventOrPage;
        finalKey = pagePath;
    }

    if (!finalPage || !finalKey || finalKey === "undefined") return;

    fetch(finalPage)
        .then(res => {
            if (!res.ok) throw new Error("Gagal mengambil file");
            return res.text();
        })
        .then(html => {
            document.getElementById("mainContent").innerHTML = html;

            const newUrl = window.location.origin + window.location.pathname + `?page=${finalKey}`;
            history.pushState({ page: finalPage, key: finalKey }, "", newUrl);

            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'))
            const activeLink = document.querySelector(`a[onclick*="'${finalKey}'"]`);
            if (activeLink) activeLink.classList.add('active');

            if (finalKey === 'buatporto') {
                loadScript('buatporto/buatPorto.js');
            } if (finalKey === 'rekapporto') {
                loadScript('rekapporto/rekapPorto.js');
            } if (finalKey === 'rekapmahasiswa') {
                loadScript('rekapmahasiswa/rekapMahasiswa.js');
            } if (finalKey === 'timeseriesProdi') {
                loadScript('timeseries/timeSeriesProdi.js');
            } if (finalKey === 'timeseriesMK') {
                loadScript('timeseries/timeSeriesMK.js');
            }
        })
        .catch(err => {
            console.error(err);
            document.getElementById("mainContent").innerHTML = 
                "<p class='text-danger'>Gagal memuat halaman.</p>";
        });
}

function loadScript(src) {
    const oldScript = document.querySelector(`script[src="${src}"]`);
    if (oldScript) {
        oldScript.remove(); // Hapus script lama jika ada
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
}

// Menangani kondisi ketika user menekan tombol 'Back' atau 'Forward' di browser
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        loadPage(event.state.page, event.state.key);
    } else {
        window.location.href = window.location.pathname; 
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const pageKey = params.get("page");

    const routes = {
        'buatporto': 'buatporto/buatPorto.html',
        'rekapporto': 'rekapporto/rekapPorto.html',
        'rekapmahasiswa': 'rekapmahasiswa/rekapMahasiswa.html',
        'timeseriesProdi': 'timeseries/timeSeriesProdi.html',
        'timeseriesMK': 'timeseries/timeSeriesMK.html'
    };

    if (pageKey && routes[pageKey]) {
        loadPage(routes[pageKey], pageKey);
    }
});

document.getElementById("btnLogout").addEventListener("click", (e) => {
    e.preventDefault();

    Swal.fire({
        title: 'Keluar dari Sistem?',
        text: "Anda harus login kembali untuk mengakses data penilaian.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', // Bootstrap Danger color
        cancelButtonColor: '#6c757d', // Bootstrap Secondary color
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            performLogout();
        }
    });
});

function performLogout() {
    try {
        const userRaw = sessionStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const email = user?.email;

        if (window.google?.accounts?.id) {
            google.accounts.id.disableAutoSelect();
            if (email) {
                google.accounts.id.revoke(email, () => {
                    console.log("Google session revoked");
                });
            }
        }
    } catch (err) {
        console.warn("Logout cleanup error:", err);
    }

    sessionStorage.clear();
    localStorage.clear();
    
    // Optional: Show a quick success message before redirecting
    Swal.fire({
        title: 'Berhasil Keluar',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        window.location.href = "index.html";
    });
}