let urlAtual = '/api/produtos'
let modoForm = 'criar'
let idEdicao = null
let ultimaLinhaSelecionada = null; 


// FUNÇÃO GLOBAL DE ATUALIZAÇÃO DE FILTROS
function atualizarFiltro() {
    const buscarCod = document.getElementById("codSearch");
    const buscarNome = document.getElementById("prodSearch");

    const cod = buscarCod?.value.trim() || "";
    const nome = buscarNome?.value.trim() || "";

    const params = new URLSearchParams();
    if (cod) params.append("cod", cod);
    if (nome) params.append("nome", nome);

    urlAtual = params.toString()
        ? `/api/produtos/filtro?${params.toString()}`
        : '/api/produtos';

    carregarProdutos(urlAtual);
}

document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.querySelector("#tbodyProdutos");
    if (tbody) {
        carregarProdutos(urlAtual);

        const buscarCod = document.getElementById("codSearch")
        const buscarNome = document.getElementById("prodSearch")

        if (buscarCod) {
            buscarCod.addEventListener('input', atualizarFiltro);
        }

        if (buscarNome) {
            buscarNome.addEventListener('input', atualizarFiltro);
        }
    }

    configurarFlutuantes();
    configurarFormulario();
    configurarInputs();
});


// CARREGA PRODUTOS E MONTA A TABELA
function getDadosUltimaLinha() {
    if (!ultimaLinhaSelecionada) return null;
    const dadosCells = Array.from(ultimaLinhaSelecionada.querySelectorAll("td")).map(td => td.innerText)
    return {
        cod: parseInt(dadosCells[0]),
        sku: dadosCells[1],
        prodName: dadosCells[2],
        variacao: dadosCells[3],
        chave: dadosCells[4],
        valor: parseFloat(dadosCells[5]),
        qtd: parseInt(dadosCells[6]),
        categoria: dadosCells[7]
    }
}

function carregarProdutos(url) {
    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Erro HTTP: ${res.status}`);
            }
            return res.json();
        })
        .then(produtos => {
            produtos.sort((a, b) => a.id - b.id)
            const tbody = document.querySelector("#tbodyProdutos");
            if (!tbody) return;
            tbody.innerHTML = "";

            produtos.forEach(p => {
                const tr = document.createElement("tr");
                tr.dataset.id = p.id
                tr.innerHTML = `
                    <td>${p.cod}</td>
                    <td>${p.sku}</td>      
                    <td>${p.nome}</td>
                    <td>${p.variacao}</td>
                    <td>${p.chave}</td>
                    <td>${p.valor.toFixed(2)}</td>
                    <td>${p.qtd}</td>
                    <td>${p.categoria}</td>`;
                
                tr.addEventListener("click", () => selecionarLinha(tr));
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.warn("Não foi possível carregar produtos:", err);
        });
}


// SELECIONAR LINHA
function selecionarLinha(tr) {
    const todas = tr.parentElement.querySelectorAll("tr");

    todas.forEach(linha => {
        linha.style.backgroundColor = (linha === tr) ? "#757575ff" : "#e2e2e2";
    });

    ultimaLinhaSelecionada = tr;
    mostrarBotoesCRUD();
}


// BOTÕES CRUD

function mostrarBotoesCRUD() {
    const btns = document.getElementsByClassName('btnsCRUD');
    Array.from(btns).forEach(btn => {
        btn.style.visibility = 'visible';
    });
}

// DUPLICAR ITEM
function duplicarItemSelecionado() {
    if (!ultimaLinhaSelecionada) {
        alert("Selecione uma linha primeiro!");
        return;
    }
    const dadosUltimaLinha = getDadosUltimaLinha()
    fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosUltimaLinha)
    })
    .then(res => res.json())
    .then(() => carregarProdutos(urlAtual));
}

// REMOVER ITEM
function telaRemocao(){
    const itemARemover = document.getElementById('itemARemover')
    const containerRemocao = document.getElementById('certezaRemover')
    containerRemocao.style.visibility = 'visible'
    const dadosUltimaLinha = getDadosUltimaLinha()
    itemARemover.innerHTML = `
    <p style="color: white; font-size: 20px; font-family: Arial, Helvetica, sans-serif;">
        Código: ${dadosUltimaLinha.cod}
        <br>
        Produto: ${dadosUltimaLinha.prodName}
        <br>
        Variação: ${dadosUltimaLinha.variacao}
        <br>
        Palavra-chave: ${dadosUltimaLinha.chave}
    </p>`
}
function removerItemSelecionado(){
    if(!ultimaLinhaSelecionada){
        alert("Selecione uma linha primeiro!")
        return
    }
    const id = ultimaLinhaSelecionada.dataset.id
    fetch(`/api/produtos/${id}`,
    {
        method:"DELETE"
    })
    .then(res => res.json())
    .then(data => {
        const containerRemocao = document.getElementById('certezaRemover')
        containerRemocao.style.visibility = 'hidden'
        alert(data.mensagem)
        carregarProdutos(urlAtual)
    }) 
}

// EDITAR ITEM
function editarItemSelecionado(){
    if(!ultimaLinhaSelecionada){
        alert("Selecione uma linha primeiro!")
        return
    }
    const dadosUltimaLinha = getDadosUltimaLinha()
    modoForm = 'editar'
    const containerEditarProduto = document.getElementById('prodAddContainer')
    containerEditarProduto.style.visibility = 'visible'
    document.getElementById('cod').value = dadosUltimaLinha.cod
    document.getElementById('sku').value = dadosUltimaLinha.sku
    document.getElementById('prodName').value = dadosUltimaLinha.prodName
    document.getElementById('variacao').value = dadosUltimaLinha.variacao
    document.getElementById('chave').value = dadosUltimaLinha.chave
    document.getElementById('valor').value = dadosUltimaLinha.valor
    document.getElementById('qtd').value = dadosUltimaLinha.qtd
    document.getElementById('categoria').value = dadosUltimaLinha.categoria
}


// BOTÕES FLUTUANTES E FORMULÁRIOS
function configurarFlutuantes() {
    const prodAddContainer = document.getElementById('prodAddContainer');
    const btnVoltarFuncionalidades = document.getElementById('voltarFuncionalidades');
    const listaBtnsFlutuantes = document.querySelectorAll('.btnFlutuante');

    const btnsFlutuantes = Array.from(listaBtnsFlutuantes).map(div => {
        const img = div.querySelector('img');
        return {
            element: div,
            id: div.id,
            cor: div.style.backgroundColor,
            bottom: div.style.bottom,
            left: div.style.left,
            imagemSrc: img?.src || "",
            alt: img?.alt || "",
            larguraImagem: img?.style.width || "50%",
            label: img?.alt || ""
        };
    });

    function aoPassarMouse(botao, alt, label, imagemSrc, cor) {
        botao.style.width = "210px";
        botao.style.height = "70px";
        botao.style.borderRadius = "25px";
        botao.innerHTML = `
            <img src="${imagemSrc}" alt="${alt}" style="width: 20%;">
            <p style="font-size:20px; color:${(cor === "grey" || cor === "rgb(128,128,128)") ? "black" : "white"}; font-family:Arial, Helvetica, sans-serif;">
                ${label}
            </p>`;
    }

    function aoSairMouse(botao, imagemSrc, alt, larguraImagem = "50%") {
        botao.style.width = "70px";
        botao.style.height = "70px";
        botao.style.borderRadius = "50%";
        botao.innerHTML = `<img src="${imagemSrc}" alt="${alt}" style="width: ${larguraImagem};">`;
    }

    btnsFlutuantes.forEach(botao => {
        if (botao) {
            botao.element.addEventListener("mouseenter", () =>
                aoPassarMouse(botao.element, botao.alt, botao.label, botao.imagemSrc, botao.cor)
            );
            botao.element.addEventListener("mouseleave", () =>
                aoSairMouse(botao.element, botao.imagemSrc, botao.alt, botao.larguraImagem)
            );
            botao.element.addEventListener("click", () => {
                if (botao.id === "funcionalidades") {
                    botao.element.style.visibility = 'hidden';
                    btnVoltarFuncionalidades.style.visibility = 'visible';
                    btnsFlutuantes.forEach(outroBotao => {
                        if (outroBotao.id !== "funcionalidades") {
                            outroBotao.element.style.visibility = 'visible';
                        }
                        if (btnVoltarFuncionalidades){
                            btnVoltarFuncionalidades.addEventListener('click',()=>{
                                outroBotao.element.style.visibility = 'hidden'
                                btnVoltarFuncionalidades.style.visibility = 'hidden'
                                botao.element.style.visibility = 'visible'
                            })
                        }
                    });
                }
                if (botao.id === "addProduto") {
                    prodAddContainer.style.visibility = 'visible';
                }
                if (botao.id === "leave"){
                    window.location.href = "/logout"
                }
                if (botao.id === "startLive")
                    alert('Funcionalidade será adicionada em breve! :)')
            });
        }
    });
}


// FORMULÁRIO DE PRODUTO

function configurarFormulario() {
    const form = document.getElementById('formProdutos');
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const dados = {
            cod: document.getElementById('cod').value,
            sku: document.getElementById('sku').value,
            prodName: document.getElementById('prodName').value,
            variacao: document.getElementById('variacao').value,
            chave: document.getElementById('chave').value,
            valor: parseFloat(document.getElementById('valor').value),
            qtd: document.getElementById('qtd').value,
            categoria: document.getElementById('categoria').value
        };
        let metodo = 'POST'
        let urlRequisicao = '/api/produtos'
        if (modoForm === 'editar'){
            urlRequisicao = `/api/produtos/${ultimaLinhaSelecionada.dataset.id}`
            metodo = 'PUT'
        }
        fetch(urlRequisicao, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        })
            .then(res => res.json())
            .then(data => {
                alert(data.mensagem);
                e.target.reset();
                modoForm = 'criar'
                idEdicao = null;
                document.getElementById('prodAddContainer').style.visibility = 'hidden'
                atualizarFiltro()
            });
    });

    document.querySelectorAll(".btnCancelar").forEach(botao => {
        botao.addEventListener("click", function () {
            this.closest('.container').style.visibility = 'hidden';
        });
    });
}


// TRATAMENTO DOS INPUTS

function configurarInputs() {
    document.getElementById("cod").addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
    });

    ["chave", "sku"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", function () {
                this.value = this.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
            });
        }
    });

    document.getElementById("valor").addEventListener("input", function () {
        let valor = this.value.replace(/\D/g, "");
        if (!valor) {
            this.value = "";
            return;
        }
        if (valor.length === 1) valor = "0" + valor;
        valor = valor.replace(/^0+(?=\d{3,})/, "");
        const inteiro = valor.slice(0, -2);
        const decimais = valor.slice(-2);
        this.value = `${inteiro || 0}.${decimais}`;
    });

    document.getElementById("qtd").addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
    });

    document.getElementById("codSearch").addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
    })

    function removerAcentosEEspeciais(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    }

    const campos = ['prodName', 'variacao', 'categoria', 'prodSearch']; 
    campos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function () {
                let valor = removerAcentosEEspeciais(this.value);
                valor = valor.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
                this.value = valor;
            });
        }
    });
}


