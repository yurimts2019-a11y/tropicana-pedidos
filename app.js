document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('loaded');
});

// NOVO: Função para gerenciar a transição (fade-out)
function handlePageTransition(url) {
    document.documentElement.classList.add('fade-out');
    // Espera a duração da transição (0.3s) antes de navegar
    setTimeout(() => {
        window.location.href = url;
    }, 300); 
}

document.addEventListener('DOMContentLoaded', function() {
    
    // ===================================
    // 1. CONFIGURAÇÕES GLOBAIS E LIMITES
    // ===================================
    const phone = '5565993321761'; // <-- 🚨 SUBSTITUA AQUI PELO SEU NÚMERO DE TELEFONE COM DDD
    const EXTRA_LIMIT = 1; // Limite de adicionais pagos
    const FRUIT_LIMIT = 5; // Limite de frutas grátis

    // Utility para formatar preço (i18n)
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // 1.1 DADOS DO CARDÁPIO (LISTAS ATUALIZADAS com descrição e imagem)
    const tamanhos = [
        { 
            nome: '300ml (P)', 
            preco: 16, 
            id: 'tam-p', 
            description: '🍓Pequena na medida,gigante no sabor!', 
            imageURL: 'salada_300ml.jpg' // 🚨 Mude para o nome real da sua imagem
        },
        { 
            nome: '400ml (M)', 
            preco: 20, 
            id: 'tam-m', 
            description: '🍍O equilíbrio perfeito entre frescor e sabor!', 
            imageURL: 'salada_400ml.jpg' // 🚨 Mude para o nome real da sua imagem
        },
        { 
            nome: '500ml (G)', 
            preco: 24, 
            id: 'tam-g', 
            description: '🍇 Gigante em sabor, perfeita pra dividir (ou não)!', 
            imageURL: 'salada_500ml.jpg' // 🚨 Mude para o nome real da sua imagem
        }
    ];

    // Frutas (Grátis - Máx 5)
    const fruits = ['🍍 Abacaxi', '🍓 Morango', '🥭 Mamão', '🍇 Uva', '🍌 Banana', '🥭 Manga', '🍎 Maçã']; 

    // Extras (R$2,00 cada - Adicionais)
    const extras = [
        { nome: '🥝 Kiwi', preco: 2, id: 'extra-kiwi' } // Emoji de kiwi
    ];

    // Acompanhamentos (Grátis)
    const acomp = ['Creme de Maracujá', 'Creme de Ninho', 'Granola', 'Mel', 'Aveia'];

    // 2. REFERÊNCIAS DO DOM
    const cardsContainer = document.getElementById('cardsContainer');
    const sizeSelectionContainer = document.getElementById('sizeSelectionContainer'); 
    const resumoContent = document.getElementById('resumoContent');
    const modalOverlay = document.getElementById('customizationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTotalSpan = document.getElementById('modalTotal');
    // const modalResumoDiv = document.getElementById('modalResumo'); // 🚨 REMOVIDO
    // const obsInput = document.getElementById('obsInput'); // REMOVIDO: CAMPO OBSERVAÇÕES
    const addToOrderBtn = document.getElementById('addToOrder');
    const storeStatusSpan = document.querySelector('.store-status');

    // Opções de frutas, extras e acomp no modal
    const frutasOpcoesDiv = document.getElementById('frutasOpcoes');
    const extrasOpcoesDiv = document.getElementById('extrasOpcoes');
    const acompOpcoesDiv = document.getElementById('acompOpcoes');

    // 3. ESTADO GLOBAL
    let pedidos = [];
    let itemEmEdicaoIndex = -1; 
    let itemAtual = {};


    // 4. FUNÇÕES DE UTILIDADE E STATUS
    
function checkStoreStatus() {
    // Fuso horário de Cuiabá (MT)
    const now = new Date();
    const dataCuiaba = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Cuiaba' })
    );

    const dia = dataCuiaba.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hora = dataCuiaba.getHours();
    const minuto = dataCuiaba.getMinutes();
    const horaDecimal = hora + minuto / 60;

    let aberto = false;

    // Segunda (1) a Quinta (4): 13h às 22h
    if (dia >= 1 && dia <= 4) {
        if (horaDecimal >= 13 && horaDecimal < 22) aberto = true;
    }
    // Sexta (5) e Domingo (0): 13h às 17h
    else if (dia === 5 || dia === 0) {
        if (horaDecimal >= 13 && horaDecimal < 17) aberto = true;
    }
    // Sábado (6): fechado
    else if (dia === 6) {
        aberto = false;
    }

    // Atualiza o status na interface
 if (aberto) {
    statusText.textContent = '🟢 Aberto Agora';
    storeStatusSpan.style.backgroundColor = '#e8f5e9';
    storeStatusSpan.style.color = '#2e7d32';
} else {
    statusText.textContent = '🔴 Fechado';
    storeStatusSpan.style.backgroundColor = '#fff3e0';
    storeStatusSpan.style.color = 'var(--orange)';
    }
}

    // 5. FUNÇÕES DO MODAL
    function calcularTotal(item) {
        if (!item.tamanho || !item.tamanho.preco) return 0;
        
        let total = item.tamanho.preco;
        
        // Custo de extras (R$2,00 por extra)
        const custoExtras = item.extras.length * extras[0].preco;
        total += custoExtras;

        item.total = total; // Salva o total no objeto do item
        modalTotalSpan.textContent = formatCurrency(total);
        return total;
    }

    function atualizarModalResumo() {
        // O resumo detalhado foi removido do modal. 
        // A função agora serve apenas para recalcular e atualizar o total na tela.
        calcularTotal(itemAtual);
    }
    
    function renderizarOpcoes(container, lista, tipo, limit) {
        container.innerHTML = '';
        const tipoLower = tipo.toLowerCase();
        
        // Adiciona uma classe para o novo estilo de lista
        container.classList.add('list-options');
        
        lista.forEach(item => {
            const nome = typeof item === 'string' ? item : item.nome;
            const id = nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const checked = itemAtual[tipoLower].some(i => i.nome === nome);
            const isDisabled = !checked && itemAtual[tipoLower].length >= limit && limit > 0;
            
            // Usa div para o item
            const itemDiv = document.createElement('div');
            itemDiv.className = `option-item ${checked ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
            itemDiv.setAttribute('tabindex', isDisabled ? '-1' : '0'); 
            
            // CÓDIGO DO PREÇO CONCATENADO NA MESMA LINHA:
            let nomeComPreco = nome;
            if (tipoLower === 'extras') {
                // Adiciona o preço diretamente ao nome para exibição na mesma linha
                nomeComPreco += ' (+R$ 2,00)';
            }
            // FIM CÓDIGO DO PREÇO CONCATENADO

            itemDiv.innerHTML = `
                <label class="option-label" for="${tipo}-${id}">
                    <span class="option-name">${nomeComPreco}</span> 
                </label>
                <input type="checkbox" id="${tipo}-${id}" data-nome="${nome}" data-tipo="${tipo}" 
                        ${checked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            `;
            
            // Adiciona o listener principal ao itemDiv
            itemDiv.addEventListener('click', (e) => {
                // Se estiver desabilitado (e não estiver checado), impede a ação e alerta
                if (isDisabled && !checked) {
                    e.preventDefault();
                    if (tipo === 'FRUITS') {
                        alert(`Limite de ${FRUIT_LIMIT} frutas grátis atingido!`);
                    } else if (tipo === 'EXTRAS') {
                        alert(`Limite de ${EXTRA_LIMIT} adicionais de fruta atingido!`);
                    }
                    return;
                }
                
                // Se o clique não foi no input, inverte o estado do checkbox antes de chamar o handler
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = itemDiv.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                }
                
                // Chamada do handler para atualizar o itemAtual e re-renderizar
                handleOptionToggle(nome, tipo); 
            });
            
            // Adiciona listener ao input (se alguém clicar especificamente nele)
            itemDiv.querySelector('input[type="checkbox"]').addEventListener('change', () => {
                     handleOptionToggle(nome, tipo); 
            });
            
            container.appendChild(itemDiv);
        });
        atualizarModalResumo();
    }
    
    function handleOptionToggle(nome, tipo) {
        const tipoLower = tipo.toLowerCase();
        const listaAtual = itemAtual[tipoLower];
        const isChecked = listaAtual.some(i => i.nome === nome);
        const limit = tipoLower === 'fruits' ? FRUIT_LIMIT : tipoLower === 'extras' ? EXTRA_LIMIT : 99;

        if (isChecked) {
            itemAtual[tipoLower] = listaAtual.filter(i => i.nome !== nome);
        } else if (listaAtual.length < limit) {
            const itemObj = tipoLower === 'extras' ? extras.find(e => e.nome === nome) : { nome: nome };
            itemAtual[tipoLower].push(itemObj);
        }

        // Re-renderiza para atualizar o estado de checked/disabled E o visual do novo item
        if (tipoLower === 'fruits') {
            renderizarOpcoes(frutasOpcoesDiv, fruits, 'FRUITS', FRUIT_LIMIT);
        } else if (tipoLower === 'extras') {
            renderizarOpcoes(extrasOpcoesDiv, extras, 'EXTRAS', EXTRA_LIMIT);
        } else if (tipoLower === 'acomp') {
            renderizarOpcoes(acompOpcoesDiv, acomp, 'ACOMP', 99);
        }
        
        atualizarModalResumo();
    }

    function openModal(tamanho, index = -1) {
        modalOverlay.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Se estiver editando, carrega o item existente
        if (index !== -1) {
            itemEmEdicaoIndex = index;
            itemAtual = JSON.parse(JSON.stringify(pedidos[index])); // Clonar o objeto para edição
            modalTitle.textContent = `Editar Salada #${index + 1} (${itemAtual.tamanho.nome})`;
            addToOrderBtn.textContent = 'Salvar Alterações';
            // obsInput.value = itemAtual.obs || ''; // REMOVIDO: CAMPO OBSERVAÇÕES
        } else {
            itemEmEdicaoIndex = -1;
            itemAtual = { 
                tamanho: tamanho, 
                fruits: [], 
                extras: [], 
                acomp: [], 
                // obs: '', // REMOVIDO: CAMPO OBSERVAÇÕES
                total: 0
            };
            modalTitle.textContent = `Personalizar Salada ${tamanho.nome}`;
            addToOrderBtn.textContent = 'Adicionar ao Pedido - ' + formatCurrency(tamanho.preco);
            // obsInput.value = ''; // REMOVIDO: CAMPO OBSERVAÇÕES
        }

        renderizarOpcoes(frutasOpcoesDiv, fruits, 'FRUITS', FRUIT_LIMIT);
        renderizarOpcoes(extrasOpcoesDiv, extras, 'EXTRAS', EXTRA_LIMIT);
        renderizarOpcoes(acompOpcoesDiv, acomp, 'ACOMP', 99);
        atualizarModalResumo();
        
        // 🚀 NOVO CÓDIGO: Rola a página para o topo assim que o modal é aberto/carregado
        window.scrollTo(0, 0); 
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        document.body.classList.remove('modal-open');
        itemAtual = {};
        itemEmEdicaoIndex = -1;
    }
    
    // 6. RENDERIZAÇÃO INICIAL (SELEÇÃO DE TAMANHO)
    function renderizarSelecaoTamanho() {
        sizeSelectionContainer.innerHTML = '';
        tamanhos.forEach(tamanho => {
            const precoTexto = formatCurrency(tamanho.preco);
            const card = document.createElement('div');
            // Usando a nova classe 'vertical-card' para o novo layout
            card.className = 'size-card vertical-card'; 
            
            // Cria um data-attribute com o objeto tamanho
            const tamanhoStr = JSON.stringify(tamanho).replace(/"/g, '&quot;'); 
            card.setAttribute('data-tamanho', tamanhoStr);

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${tamanho.imageURL}" alt="Salada de Frutas ${tamanho.nome}" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-header-row">
                        <div class="size-name">${tamanho.nome}</div>
                        <div class="size-price">${precoTexto}</div>
                    </div>
                    <p class="size-description">${tamanho.description}</p>
                    <button class="btn small-btn">Montar</button>
                </div>
            `;
            
            sizeSelectionContainer.appendChild(card);
        });
        attachSizeCardListeners();
    }

    // Função para anexar listeners de forma programática
    function attachSizeCardListeners() {
        document.querySelectorAll('.size-card').forEach(card => {
            // Remove listener para evitar duplicação em re-renderizações
            card.removeEventListener('click', handleSizeCardClick); 
            card.addEventListener('click', handleSizeCardClick);
        });
    }

    // Função de tratamento de clique isolada
    function handleSizeCardClick() {
        try {
            // Lê o objeto JSON diretamente do data-attribute
            const tamanho = JSON.parse(this.dataset.tamanho.replace(/&quot;/g, '\"'));
            openModal(tamanho);
        } catch (e) {
            console.error("Erro ao processar dados do cartão de tamanho:", e);
        }
    }
    
    // ===================================
    // NOVAS FUNÇÕES DE LOCAL STORAGE
    // ===================================
    function saveToLocalStorage() {
        // Salva apenas o pedido. Dados de nome/bairro são salvos apenas na tela de confirmação.
        localStorage.setItem('tropicanaPedidos', JSON.stringify(pedidos));
    }

    function loadFromLocalStorage() {
        const pedidosJSON = localStorage.getItem('tropicanaPedidos');
        if (pedidosJSON) {
            pedidos = JSON.parse(pedidosJSON);
            renderizarCardsPedidos();
            atualizarResumoGeral();
        }
    }


    // 7. ADICIONAR/SALVAR NO PEDIDO
    function addToOrder() {
        if (!itemAtual.tamanho.nome) return;

        // Se a quantidade é sempre 1, a lógica de itemAtual.quantity não afeta o pedido
        itemAtual.quantity = 1; 
        // itemAtual.obs já está removido da inicialização, mas se vier de um pedido antigo:
        delete itemAtual.obs; 

        if (itemEmEdicaoIndex !== -1) {
            pedidos[itemEmEdicaoIndex] = JSON.parse(JSON.stringify(itemAtual));
        } else {
            pedidos.push(JSON.parse(JSON.stringify(itemAtual)));
        }
        
        closeModal();
        renderizarCardsPedidos();
        atualizarResumoGeral();
        saveToLocalStorage(); // <--- SALVA NO LOCAL STORAGE
        
        // NOVO: Rola a tela para o card 'Seu Pedido'
        const targetElement = document.getElementById('seuPedidoCard');
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }


    // 8. RENDERIZAÇÃO DO CARRINHO (TELA PRINCIPAL)
    function renderizarCardsPedidos() {
        cardsContainer.innerHTML = '';

        if (pedidos.length === 0) {
            cardsContainer.innerHTML = '<p class="empty-state">Seu carrinho está vazio. Comece a montar sua salada!</p>';
        } else {
            pedidos.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'order-card';
                card.innerHTML = `
                    <div class="order-header">
                        <span class="order-title">Salada #${index + 1}</span>
                        <span class="order-price">${formatCurrency(item.total)}</span>
                    </div>
                    <div class="order-details">
                        <p>Tamanho: ${item.tamanho.nome}</p>
                        ${item.fruits.length ? `<p>Frutas (${item.fruits.length}): ${item.fruits.map(f => f.nome).join(', ')}</p>` : ''}
                        ${item.extras.length ? `<p>Adicionais: ${item.extras.map(e => e.nome).join(', ')}</p>` : ''}
                        ${item.acomp.length ? `<p>Acomp: ${item.acomp.map(a => a.nome).join(', ')}</p>` : ''}
                        </div>
                    <div class="order-actions">
                        <button class="btn editar-item" onclick="editItem(${index})">Editar</button>
                        <button class="btn excluir-item" onclick="excluirItem(${index})">Excluir</button>
                    </div>
                `;
                cardsContainer.appendChild(card);
            });
        }
    }


    function atualizarResumoGeral() {
        let resumoTexto = '';
        let totalPedido = 0;

        if (pedidos.length === 0) {
            resumoContent.textContent = 'Nenhuma Salada adicionada.';
            totalPedido = 0;
            // Remove o container de ações se estiver vazio
            resumoContent.parentElement.querySelector('.resumo-actions')?.remove();
        } else {
            resumoTexto += pedidos.map((item, index) => {
                const totalItem = item.total; 
                let linha = `*1x* Salada #${index + 1} (${item.tamanho.nome}): `;
                let detalhes = [];

                if (item.fruits.length) detalhes.push(item.fruits.map(f => f.nome).join(', '));
                if (item.extras.length) detalhes.push(`+${item.extras.map(e => e.nome).join(', ')}`);
                if (item.acomp.length) detalhes.push(`Acomp: ${item.acomp.map(a => a.nome).join(', ')}`);
                // if (item.obs) detalhes.push(`Obs: ${item.obs}`); // REMOVIDO: CAMPO OBSERVAÇÕES
                
                linha += detalhes.join(' | ') + ` - ${formatCurrency(totalItem)}`;
                totalPedido += totalItem;
                return linha;
            }).join('\n\n'); 

            resumoContent.textContent = resumoTexto;
            
            adicionarBotaoConfirmarResumo(totalPedido); // <--- CHAMA NOVA FUNÇÃO
        }

        resumoContent.parentElement.classList.remove('animate');
        void resumoContent.parentElement.offsetWidth;
        resumoContent.parentElement.classList.add('animate');
    }
    
    // NOVO: Adiciona o total e o botão 'Confirmar Pedido' na caixa de resumo
    function adicionarBotaoConfirmarResumo(totalPedido) {
        const resumoBox = document.querySelector('.resumo-box');
        if (!resumoBox) return;

        let container = resumoBox.querySelector('.resumo-actions');
        if (!container) {
            container = document.createElement('div');
            container.className = 'resumo-actions';
            resumoBox.appendChild(container);
        }
        
        let totalSpan = container.querySelector('.resumo-total-final');
        if (!totalSpan) {
            totalSpan = document.createElement('span');
            totalSpan.className = 'resumo-total-final resumo-total';
            container.appendChild(totalSpan);
        }
        totalSpan.textContent = 'TOTAL: ' + formatCurrency(totalPedido);

        let btnConfirmar = container.querySelector('#confirmarPedidoResumo');
        if (!btnConfirmar) {
            btnConfirmar = document.createElement('button');
            btnConfirmar.id = 'confirmarPedidoResumo';
            btnConfirmar.className = 'btn confirmar';
            btnConfirmar.addEventListener('click', enviarPedido); // <--- CHAMA FUNÇÃO DE REDIRECIONAMENTO
            container.appendChild(btnConfirmar);
        }
        
        // Atualiza o estado de disabled
        const isAberto = storeStatusSpan.textContent.includes('Aberto');
        btnConfirmar.disabled = !isAberto;
        btnConfirmar.textContent = isAberto ? 'Confirmar Pedido' : 'Loja Fechada';
    }


    function excluirItem(index) {
        pedidos.splice(index, 1);
        renderizarCardsPedidos();
        atualizarResumoGeral();
        saveToLocalStorage(); // <--- SALVA NO LOCAL STORAGE
    }
        
    function editItem(index) {
        openModal(pedidos[index].tamanho, index);
    }

    // 9. FUNÇÃO DE ENVIO DO PEDIDO (WHATSAPP)
    function enviarPedido() {
        
        if (pedidos.length === 0) {
             alert('Adicione pelo menos um item ao pedido.');
             return;
        }
        
        // Removida a checagem de Nome e Bairro. Agora, apenas salva o pedido e redireciona.
        saveToLocalStorage(); 
        // window.location.href = 'confirmacao.html'; // MUDANÇA: Usa a transição
        handlePageTransition('confirmacao.html');
    }


    // 11. LISTENERS E INICIALIZAÇÃO
    window.excluirItem = excluirItem; 
    window.openModal = openModal; 
    window.editItem = editItem; 
    window.handlePageTransition = handlePageTransition; // EXPOSTO PARA USO GLOBAL

    document.getElementById('closeModal').addEventListener('click', closeModal);
        
    modalOverlay.addEventListener('click', (e) => {
        // Agora, o modal-overlay é a tela inteira, então o clique fora do modal-content não deve fechar.
        // Apenas o botão 'X' deve fechar.
    });

    addToOrderBtn.addEventListener('click', addToOrder);
    // obsInput.addEventListener('input', atualizarModalResumo); // REMOVIDO: CAMPO OBSERVAÇÕES
    
    // Inicialização
    renderizarSelecaoTamanho();
    checkStoreStatus();
    setInterval(checkStoreStatus, 60000);
    loadFromLocalStorage(); // <--- CARREGA O PEDIDO SALVO AO INICIAR
});
