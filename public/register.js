const formRegister = document.getElementById("formRegister");

formRegister.onsubmit = async e => {
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    alert("Registrasi berhasil, silakan login");
    window.location.href = "login.html";
  } else {
    const text = await res.text();
    alert("Registrasi gagal: " + text);
  }
};