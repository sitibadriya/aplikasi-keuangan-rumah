      function rupiah(angka) {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(angka);
      }

      function loadTransaksi() {
        fetch("/api/transaksi")
          .then((res) => res.json())
          .then((data) => {
            const tbody = document.getElementById("tabelTransaksi");
            tbody.innerHTML = "";
            data.rows.forEach((t) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `<td>${t.id}</td><td>${t.tanggal}</td><td>${t.tipe}</td><td>${t.kategori}</td><td>${rupiah(t.jumlah)}</td>`;
              tbody.appendChild(tr);
            });
            document.getElementById("totalPemasukan").textContent = rupiah(
              data.summary.total_pemasukan,
            );
            document.getElementById("totalPengeluaran").textContent = rupiah(
              data.summary.total_pengeluaran,
            );
            document.getElementById("saldo").textContent = rupiah(
              data.summary.saldo,
            );
          });
      }

      window.onload = loadTransaksi;
