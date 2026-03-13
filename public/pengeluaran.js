let chart;
const modal = document.getElementById("modalEdit");
const formEdit = document.getElementById("formEdit");
const inputId = formEdit.querySelector("input[name='id']");
const inputKategori = formEdit.querySelector("select[name='kategori']");
const inputJumlah = formEdit.querySelector("input[name='jumlah']");
const closeModalBtn = document.getElementById("closeModal");

function rupiah(angka) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(angka);
}

// Modal
closeModalBtn.onclick = () => { modal.style.display="none"; formEdit.reset(); };
window.onclick = e => { if(e.target==modal){ modal.style.display="none"; formEdit.reset(); } };

// Load pengeluaran
function loadPengeluaran(){
  fetch("/api/pengeluaran").then(r=>r.json()).then(data=>{
    const tbody = document.getElementById("daftarPengeluaran");
    tbody.innerHTML="";
    data.forEach(item=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${item.tanggal}</td><td>${item.kategori}</td><td>${rupiah(item.jumlah)}</td>
        <td><button class="edit">Edit</button> <button class="delete">Hapus</button></td>`;
      tbody.appendChild(tr);

      // Edit
      tr.querySelector(".edit").addEventListener("click",()=>{
        inputId.value = item.id;
        inputKategori.value = item.kategori;
        inputJumlah.value = item.jumlah;
        modal.style.display="block";
      });

      // Hapus
      tr.querySelector(".delete").addEventListener("click",()=>{
        if(confirm("Yakin ingin menghapus?")){
          fetch(`/api/pengeluaran/${item.id}`,{method:"DELETE"}).then(loadPengeluaran);
        }
      });
    });
  }).then(loadGrafik);
}

// Tambah pengeluaran
document.getElementById("formTambah").onsubmit = e=>{
  e.preventDefault();
  const f=e.target;
  fetch("/api/pengeluaran",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      tanggal:f.tanggal.value,
      kategori:f.kategori.value,
      jumlah:parseInt(f.jumlah.value)
    })
  }).then(()=>{
    f.reset();
    loadPengeluaran();
  });
};

// Submit Edit
formEdit.onsubmit = e=>{
  e.preventDefault();
  fetch(`/api/pengeluaran/${inputId.value}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      kategori: inputKategori.value,
      jumlah: parseInt(inputJumlah.value)
    })
  }).then(()=>{
    modal.style.display="none";
    formEdit.reset();
    loadPengeluaran();
  });
};

// Grafik
function loadGrafik(){
  fetch("/api/grafikKategori").then(r=>r.json()).then(data=>{
    const labels = data.map(d=>d.kategori);
    const totals = data.map(d=>d.total);
    const colors = data.map(()=>`hsl(${Math.random()*360},70%,60%)`);
    const ctx = document.getElementById("grafikPengeluaran").getContext("2d");
    if(chart) chart.destroy();
    chart = new Chart(ctx,{
      type:"bar",
      data:{labels,datasets:[{label:"Pengeluaran",data:totals,backgroundColor:colors}]},
      options:{responsive:true}
    });
  });
}

window.onload = loadPengeluaran;