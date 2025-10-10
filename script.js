document.addEventListener("DOMContentLoaded", () => {
  const confirmarPedidoBtn = document.getElementById("confirmarPedidoBtn");
  const modal = document.getElementById("clienteModal");
  const finalizarPedidoBtn = document.getElementById("finalizarPedidoBtn");
  const fidelidadeStatus = document.getElementById("fidelidadeStatus");
  const progressBar = document.getElementById("progress");

  let cliente = JSON.parse(localStorage.getItem("cliente")) || {
    nome: "",
    telefone: "",
    pedidos: 0
  };

  atualizarFidelidade();

  if (confirmarPedidoBtn) {
    confirmarPedidoBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  finalizarPedidoBtn.addEventListener("click", () => {
    const nome = document.getElementById("nomeCliente").value.trim();
    const telefone = document.getElementById("telefoneCliente").value.trim();

    if (!nome || !telefone) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    cliente.nome = nome;
    cliente.telefone = telefone.replace(/\D/g, "");
    cliente.pedidos++;

    localStorage.setItem("cliente", JSON.stringify(cliente));

    atualizarFidelidade();
    modal.style.display = "none";

    let mensagem = `Olá ${cliente.nome}, seu pedido foi confirmado! Você já tem ${cliente.pedidos}/10 pedidos. Ao completar 10, você ganhará uma recompensa! 🎉`;
    window.open(`https://wa.me/55${cliente.telefone}?text=${encodeURIComponent(mensagem)}`);
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  function atualizarFidelidade() {
    let estrelasHTML = "";
    for (let i = 0; i < 10; i++) {
      if (i < cliente.pedidos) {
        estrelasHTML += "<span class='estrela-cheia'>★</span>";
      } else {
        estrelasHTML += "<span class='estrela-vazia'>☆</span>";
      }
    }
    fidelidadeStatus.innerHTML = `Você tem ${cliente.pedidos}/10 pedidos <br> ${estrelasHTML}`;

    let progresso = Math.min(100, (cliente.pedidos / 10) * 100);
    if (progressBar) progressBar.style.width = progresso + "%";

    if (cliente.pedidos >= 10) {
      alert("Parabéns! 🎉 Você completou 10 pedidos e ganhou uma recompensa!");
      cliente.pedidos = 0;
      localStorage.setItem("cliente", JSON.stringify(cliente));
      fidelidadeStatus.innerHTML = `Você tem 0/10 pedidos <br> <span class='estrela-vazia'>☆☆☆☆☆☆☆☆☆☆</span>`;
      if (progressBar) progressBar.style.width = "0%";
    }
  }
});

// Capturar observações e salvar no localStorage
document.addEventListener('DOMContentLoaded', function() {
  const obsInput = document.getElementById('obsInput');
  if (obsInput) {
    obsInput.addEventListener('input', function() {
      localStorage.setItem('observacoes', obsInput.value);
    });
  }
});
