// Fungsi format rupiah
function rupiah(angka) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(angka);
}

// Load ringkasan keuangan
async function loadRingkasan() {
  try {
    const res = await fetch("/api/transaksi");
    if (!res.ok) throw new Error("Gagal mengambil data ringkasan");
    const data = await res.json();
    const { total_pemasukan, total_pengeluaran, saldo } = data.summary;

    document.getElementById("totalPemasukan").textContent = rupiah(total_pemasukan);
    document.getElementById("totalPengeluaran").textContent = rupiah(total_pengeluaran);
    document.getElementById("saldo").textContent = rupiah(saldo);
  } catch (err) {
    console.error(err);
  }
}

// Load grafik gabungan pengeluaran per kategori + total pemasukan
async function loadGrafik() {
  try {
    const [pengeluaranData, pemasukanData] = await Promise.all([
      fetch("/api/grafikKategori").then(r => r.json()),
      fetch("/api/pemasukan").then(r => r.json())
    ]);

    const labels = pengeluaranData.map(d => d.kategori).concat("Total Pemasukan");
    const pengeluaranTotals = pengeluaranData.map(d => d.total);
    const totalPemasukan = pemasukanData.reduce((sum, d) => sum + d.jumlah, 0);
    const data = pengeluaranTotals.concat(totalPemasukan);

    const colors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`);

    const ctx = document.getElementById("grafikDashboard").getContext("2d");
    if (window.dashboardChart) window.dashboardChart.destroy();
    window.dashboardChart = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ label: "Jumlah", data, backgroundColor: colors }] },
      options: { responsive: true, plugins: { legend: { position: "top" } } }
    });
  } catch (err) {
    console.error(err);
  }
}

// Logout
const btnLogout = document.getElementById("logout");
if (btnLogout) {
  btnLogout.onclick = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "login.html";
  };
}

// Session check (opsional, jika backend sudah ada login)
async function cekSession() {
  try {
    const res = await fetch("/api/transaksi");
    if (res.status === 401) window.location.href = "login.html";
  } catch (err) {
    console.error(err);
  }
}

// Jalankan semua saat halaman siap
window.onload = () => {
  cekSession();
  loadRingkasan();
  loadGrafik();
};