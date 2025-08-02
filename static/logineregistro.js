const btnEntrar = document.getElementById('entrar');
const btnRegistrar = document.getElementById('registrar');
const btnVoltar = document.getElementById('voltar');


if (btnEntrar) btnEntrar.onclick = () => window.location.href = "/login";
if (btnRegistrar) btnRegistrar.onclick = () => window.location.href = "/registrar";
if (btnVoltar) btnVoltar.onclick = () => window.location.href = "/";