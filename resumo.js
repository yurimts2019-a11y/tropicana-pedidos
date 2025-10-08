document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
  const btn = document.getElementById('confirmarBtn');
  const msg = document.getElementById('successMsg');
  const resumo = document.getElementById('pedidoResumo');
  const total = document.getElementById('totalPedido');

  resumo.textContent = '1x Salada Tropical, 1x Suco de Laranja';
  total.textContent = 'R$ 28,50';

  btn.addEventListener('click', () => {
    msg.style.display = 'block';
    msg.classList.add('show-success');
    btn.disabled = true;
    btn.style.opacity = '0.6';
  });
});
