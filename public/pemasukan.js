const modal = document.getElementById("modalEdit");
const formEdit = document.getElementById("formEdit");
const inputId = formEdit.querySelector("input[name='id']");
const inputKategori = formEdit.querySelector("input[name='kategori']");
const inputJumlah = formEdit.querySelector("input[name='jumlah']");
const closeModalBtn = document.getElementById("closeModal");

function rupiah(angka) { return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(angka); }
closeModalBtn.onclick = () => { modal.style.display="none"; formEdit.reset(); };
window.onclick = e => { if(e.target==modal) { modal.style.display="none"; formEdit.reset(); } };

function loadPemasukan() {
  fetch("/api/pemasukan").then(r=>r.json()).then(data=>{
    const tbody = document.getElementById("daftarPemasukan");
    tbody.innerHTML="";
    data.forEach(item=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${item.tanggal}</td><td>${item.kategori}</td><td>${rupiah(item.jumlah)}</td>
      <td><button class="edit">Edit</button> <button class="delete">Hapus</button></td>`;
      tbody.appendChild(tr);

      tr.querySelector(".edit").addEventListener("click",()=>{
        inputId.value=item.id;
        inputKategori.value=item.kategori;
        inputJumlah.value=item.jumlah;
        modal.style.display="block";
      });

      tr.querySelector(".delete").addEventListener("click",()=>{
        if(confirm("Yakin ingin menghapus?")){
          fetch(`/api/pemasukan/${item.id}`,{method:"DELETE"}).then(loadPemasukan);
        }
      });
    });
  });
}

document.getElementById("formTambah").onsubmit = e=>{
  e.preventDefault();
  const f=e.target;
  fetch("/api/pemasukan",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({tanggal:f.tanggal.value,kategori:f.kategori.value,jumlah:parseInt(f.jumlah.value)})})
  .then(()=>{ f.reset(); loadPemasukan(); });
};

formEdit.onsubmit = e=>{
  e.preventDefault();
  fetch(`/api/pemasukan/${inputId.value}`,{method:"PUT",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({kategori:inputKategori.value, jumlah:parseInt(inputJumlah.value)})})
  .then(()=>{ modal.style.display="none"; formEdit.reset(); loadPemasukan(); });
};

window.onload = loadPemasukan;