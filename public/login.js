const formLogin = document.getElementById("formLogin");

formLogin.onsubmit = async e => {
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    window.location.href = "index.html";
  } else {
    const text = await res.text();
    alert("Login gagal: " + text);
  }
};