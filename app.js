// NOVO: Função para gerenciar a transição (fade-out)
function handlePageTransition(url) {
    document.documentElement.classList.add('fade-out');
    // Espera a duração da transição (0.3s) antes de navegar
    setTimeout(() => {
        window.location.href = url;
    }, 300); 
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('loaded');
    
    // ===================================
    // 1. CONFIGURAÇÕES GLOBAIS E LIMITES
    // ===================================
    // O telefone real será usado no confirmacao.html. Aqui é apenas para fins de configuração.
    const EXTRA_LIMIT = 2; // Limite de adicionais pagos
    const FRUIT_LIMIT = 5; // Limite de frutas grátis

    // Utility para formatar preço (i18n)
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // 1.1 DADOS DO CARDÁPIO (LISTAS ATUALIZADAS)
    const tamanhos = [
        { nome: '300ml (P)', preco: 16, id: 'tam-p', description: 'Pequena na medida, gigante no sabor!' },
        { nome: '400ml (M)', preco: 20, id: 'tam-m', description: 'Perfeita para a sua pausa tropical.' },
        { nome: '500ml (G)', preco: 24, id: 'tam-g', description: 'Compartilhe ou saboreie sem moderação!' }
    ];
    // Frutas (Grátis - Máx 5)
    const fruits = ['Abacaxi', 'Morango', 'Mamão', 'Uva', 'Banana', 'Manga', 'Maçã']; 
    // Extras (R$3,00 cada - Adicionais de Frutas - Máx 2)
    const extras = [
        { nome: 'Kiwi Extra', preco: 3.00, id: 'ext-kiwi' },
        { nome: 'Goiaba Extra', preco: 3.00, id: 'ext-goiaba' },
        { nome: 'Melão Extra', preco: 3.00, id: 'ext-melao' }
    ];
    // Acompanhamentos (Grátis)
    const acomp = ['Leite Condensado', 'Mel', 'Granola', 'Iogurte Natural', 'Creme de Leite'];

    // 1.2 Elementos DOM
    const nameInput = document.getElementById('nameInput');
    const whatsappInput = document.getElementById('whatsappInput');
    const neighborhoodInput = document.getElementById('neighborhoodInput');
    const footerConfirmar = document.getElementById('footerConfirmar');
    const footerTotal = document.getElementById('footerTotal');
    const cardsContainer = document.getElementById('cardsContainer');
    const resumoContent = document.getElementById('resumoContent');
    const modalOverlay = document.getElementById('customizationModal');
    const modalTotalSpan = document.getElementById('modalTotal');
    const addToOrderBtn = document.getElementById('addToOrder');
    const obsInput = document.getElementById('obsInput');
    const quantityInput = document.getElementById('quantityInput');
    
    // 1.3 Variáveis de Estado
    let pedidos = JSON.parse(localStorage.getItem('tropicanaPedidos') || '[]');
    let currentItem = {}; // Item sendo customizado no modal
    let currentEditIndex = null; // Índice do item sendo editado (null se for novo)

    // Carrega dados do LocalStorage para preencher os inputs na inicialização
    nameInput.value = localStorage.getItem('tropicanaName') || '';
    whatsappInput.value = localStorage.getItem('tropicanaWhatsapp') || '';
    neighborhoodInput.value = localStorage.getItem('tropicanaNeighborhood') || '';

    // ===================================
    // 2. FUNÇÕES DE FIDELIDADE (WHATSAPP)
    // ===================================

    // Converte o WhatsApp limpo para a chave de fidelidade (pode ser o próprio número)
    const getClientKey = (whatsapp) => whatsapp.replace(/\D/g, ''); 

    // Carrega o progresso de selos do cliente
    const getLoyaltyData = (key) => {
        const data = JSON.parse(localStorage.getItem('tropicanaLoyalty') || '{}');
        return data[key] || 0;
    };

    // Salva o progresso de selos do cliente
    const saveLoyaltyData = (key, seals) => {
        const data = JSON.parse(localStorage.getItem('tropicanaLoyalty') || '{}');
        data[key] = seals;
        localStorage.setItem('tropicanaLoyalty', JSON.stringify(data));
    };

    // Renderiza o cartão de selos
    function renderLoyaltySeals(whatsapp) {
        const whatsappKey = getClientKey(whatsapp);
        const sealsGrid = document.getElementById('sealsGrid');
        const fidelityMessage = document.getElementById('fidelityMessage');
        const seals = getLoyaltyData(whatsappKey);
        
        let sealsHTML = '';
        for (let i = 1; i <= 10; i++) {
            let classes = 'seal';
            let content = i;
            
            if (i <= seals) {
                classes += ' completed';
                content = i < 10 ? '✅' : '🌟'; // Emoji para selo completo (1-9) ou prêmio (10)
            }
            if (i === 10) {
                classes += ' reward';
            }
            
            sealsHTML += `<div class="${classes}">${content}</div>`;
        }
        sealsGrid.innerHTML = sealsHTML;

        // Atualiza a mensagem de status
        if (seals >= 10) {
            fidelityMessage.textContent = '🥳 Parabéns! Você já ganhou um prêmio na próxima compra!';
        } else {
            fidelityMessage.textContent = `Faltam ${10 - seals} selos para o seu prêmio! (${seals}/10)`;
        }
    }
    
    // Listener principal para o campo do WhatsApp
    function updateLoyaltyCard() {
        const whatsapp = whatsappInput.value.trim().replace(/\D/g, '');
        const cardContainer = document.getElementById('loyaltyCardContainer');
        
        // Formata o número (opcional, mas melhora a UX)
        let formattedWhatsapp = whatsapp;
        if (whatsapp.length > 2 && whatsapp.length <= 7) {
            formattedWhatsapp = `(${whatsapp.substring(0, 2)}) ${whatsapp.substring(2)}`;
        } else if (whatsapp.length > 7) {
            formattedWhatsapp = `(${whatsapp.substring(0, 2)}) ${whatsapp.substring(2, 7)}-${whatsapp.substring(7, 11)}`;
        }
        whatsappInput.value = formattedWhatsapp;

        if (whatsapp.length >= 11) {
            cardContainer.style.display = 'block';
            renderLoyaltySeals(whatsapp);
        } else {
            cardContainer.style.display = 'none';
        }
    }


    // ===================================
    // 3. RENDERIZAÇÃO E ATUALIZAÇÃO GERAL
    // ===================================

    // Renderiza os cards de tamanho na seção inicial
    function renderizarSelecaoTamanho() {
        const container = document.getElementById('sizeSelectionContainer');
        let html = '';
        tamanhos.forEach(tamanho => {
            // Converte o objeto para JSON e escapa as aspas para o data-attribute
            const tamanhoJson = JSON.stringify(tamanho).replace(/"/g, '&quot;');
            html += `
                <div class="size-card" data-tamanho="${tamanhoJson}">
                    <div class="size-info">
                        <h4>${tamanho.nome}</h4>
                        <p>${tamanho.description}</p>
                    </div>
                    <span class="size-price">${formatCurrency(tamanho.preco)}</span>
                </div>
            `;
        });
        container.innerHTML = html;
        attachSizeCardListeners(); // Anexa listeners aos novos cards
    }

    // Renderiza o resumo do pedido (Cards no Container e Footer)
    function renderizarPedido() {
        let cardsHTML = '';
        let totalPedido = 0;
        let resumoText = '';
        
        pedidos.forEach((item, index) => {
            const totalMultiplicado = item.total * item.quantity;
            totalPedido += totalMultiplicado;

            // Formata o resumo para o resumoText (Resumo do Pedido para o WhatsApp)
            let detalhesText = [];
            if (item.fruits.length) detalhesText.push(item.fruits.map(f => f.nome).join(', '));
            if (item.extras.length) detalhesText.push(`+ ${item.extras.map(e => e.nome).join(', ')}`);
            if (item.acomp.length) detalhesText.push(item.acomp.map(a => a.nome).join(', '));
            if (item.obs) detalhesText.push(`Obs: ${item.obs}`);
            
            resumoText += `*${item.quantity}x* Salada #${index + 1} (${item.tamanho.nome}): ${detalhesText.join(' | ')}\n`;
            
            // HTML para os Cards de Pedido
            cardsHTML += `
                <div class="card" onclick="editItem(${index})">
                    <div class="card-top">
                        <img src="icon-192.png" alt="Salada" class="card-img">
                        <div class="card-title">
                            <h3>Salada de Frutas ${item.tamanho.nome}</h3>
                            <span class="salada-number">#${index + 1} (${item.quantity}x)</span>
                        </div>
                        <button class="btn excluir" onclick="event.stopPropagation(); excluirItem(${index});">X</button>
                    </div>
                    <div class="card-body">
                        <p>Frutas e Acompanhamentos: ${detalhesText.join(', ')}</p>
                        <span class="card-total">${formatCurrency(totalMultiplicado)}</span>
                    </div>
                </div>
            `;
        });
        
        cardsContainer.innerHTML = cardsHTML || '<p style="text-align:center; color:#767676; margin-top: 30px;">Adicione sua primeira Salada!</p>';
        resumoContent.textContent = resumoText || 'Nenhuma Salada adicionada.';
        
        footerTotal.textContent = `TOTAL: ${formatCurrency(totalPedido)}`;
        footerConfirmar.disabled = pedidos.length === 0;

        // Animação no Resumo
        const resumoBox = document.getElementById('resumoBox');
        resumoBox.classList.remove('animate');
        // Usa setTimeout para garantir que a classe seja removida e adicionada novamente
        setTimeout(() => resumoBox.classList.add('animate'), 10); 

        // Salva apenas o array de pedidos (dados do cliente são salvos no envio)
        localStorage.setItem('tropicanaPedidos', JSON.stringify(pedidos));
    }

    // Função para remover item do pedido
    function excluirItem(index) {
        if (confirm(`Tem certeza que deseja remover o item #${index + 1} do seu pedido?`)) {
            pedidos.splice(index, 1);
            renderizarPedido();
        }
    }

    // ===================================
    // 4. LÓGICA DO MODAL DE CUSTOMIZAÇÃO
    // ===================================

    // Inicializa o modal com um item novo ou para edição
    function openModal(tamanho, index = null) {
        currentEditIndex = index;
        
        if (index !== null) {
            // Modo Edição: Carrega o item existente
            currentItem = JSON.parse(JSON.stringify(pedidos[index])); // Deep copy
            document.getElementById('modalTitle').textContent = `Editar Salada #${index + 1}`;
            addToOrderBtn.textContent = 'Salvar Alterações';
            quantityInput.value = currentItem.quantity;
        } else {
            // Modo Novo: Inicia novo item com base no tamanho
            currentItem = {
                tamanho: tamanho,
                fruits: [],
                extras: [],
                acomp: [],
                obs: '',
                quantity: 1,
                total: tamanho.preco // Preço base inicial
            };
            document.getElementById('modalTitle').textContent = `Personalize sua Salada (${tamanho.nome})`;
            addToOrderBtn.textContent = `Adicionar ao Pedido - ${formatCurrency(currentItem.total)}`;
            quantityInput.value = 1;
        }

        obsInput.value = currentItem.obs;
        renderizarOpcoes(); // Renderiza todas as opções (frutas, extras, acomp)
        atualizarModalResumo(); // Atualiza o resumo inicial e o total
        
        modalOverlay.classList.add('open');
    }

    // Fecha o modal e limpa o estado de edição
    function closeModal() {
        modalOverlay.classList.remove('open');
        currentEditIndex = null;
    }

    // Renderiza os chips de opções
    function renderizarOpcoes() {
        const frutasOpcoes = document.getElementById('frutasOpcoes');
        const extrasOpcoes = document.getElementById('extrasOpcoes');
        const acompOpcoes = document.getElementById('acompOpcoes');
        
        frutasOpcoes.innerHTML = renderGroup(fruits, 'fruit', false);
        extrasOpcoes.innerHTML = renderGroup(extras, 'extra', true);
        acompOpcoes.innerHTML = renderGroup(acomp, 'acomp', false);

        // Anexa listeners de input para atualizar o estado e o resumo
        document.querySelectorAll('.opcoes input').forEach(input => {
            input.removeEventListener('change', handleOptionChange);
            input.addEventListener('change', handleOptionChange);
        });
    }

    // Função auxiliar para gerar HTML de chips
    function renderGroup(options, type, hasPrice) {
        let html = '';
        const currentSelections = currentItem[`${type}s`] || currentItem[`${type}`] || [];

        options.forEach(option => {
            const nome = option.nome || option;
            const id = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const preco = hasPrice ? option.preco : 0;
            const isSelected = currentSelections.some(s => (s.nome || s) === nome);
            
            // Checagem de limite para desabilitar opções se o limite FRUIT_LIMIT foi atingido
            let isDisabled = false;
            if (type === 'fruit' && !isSelected && currentItem.fruits.length >= FRUIT_LIMIT) {
                isDisabled = true;
            }
            if (type === 'extra' && !isSelected && currentItem.extras.length >= EXTRA_LIMIT) {
                isDisabled = true;
            }
            
            const checkedAttr = isSelected ? 'checked' : '';
            const typeAttr = (type === 'tamanho' || type === 'acomp') ? 'radio' : 'checkbox';
            const priceHtml = hasPrice ? `<span class="chip-price">+${formatCurrency(preco)}</span>` : '';
            
            const optionData = { nome, preco, id };
            const dataAttr = JSON.stringify(optionData).replace(/"/g, '&quot;');
            
            html += `
                <label class="${isDisabled ? 'disabled' : ''}">
                    <input type="${typeAttr}" name="${type}Options" value="${nome}" data-option='${dataAttr}' ${checkedAttr} ${isDisabled ? 'disabled' : ''}>
                    <span class="chip-content">
                        ${nome}
                        ${priceHtml}
                    </span>
                </label>
            `;
        });
        return html;
    }

    // Trata a mudança de seleção de frutas, extras e acomp
    function handleOptionChange(event) {
        const input = event.target;
        const groupName = input.name;
        const type = groupName.replace('Options', '');
        
        // Pega o objeto de dados da opção
        const optionData = JSON.parse(input.dataset.option.replace(/&quot;/g, '"'));
        const targetArray = currentItem[`${type}s`] || currentItem[type]; // Ex: currentItem.fruits
        
        if (input.checked) {
            // Adicionar a opção
            // Para Rádio (ex: acomp), limpa o array antes de adicionar
            if (input.type === 'radio') {
                targetArray.splice(0, targetArray.length);
            }
            targetArray.push(optionData);
        } else {
            // Remover a opção (apenas para checkbox)
            const index = targetArray.findIndex(item => (item.nome || item) === optionData.nome);
            if (index > -1) {
                targetArray.splice(index, 1);
            }
        }

        // Para evitar bugs de limite, é bom re-renderizar o grupo que tem limite (frutas e extras)
        if (type === 'fruit' || type === 'extra') {
            renderizarOpcoes();
        }

        atualizarModalResumo();
    }
    
    // Calcula o total e atualiza o resumo dentro do modal
    function atualizarModalResumo() {
        if (!currentItem || !currentItem.tamanho) return;
        
        let total = currentItem.tamanho.preco;
        let resumoText = `*Tamanho:* ${currentItem.tamanho.nome}\n`;
        let detalhes = [];
        
        // Adicionais de Frutas (Extras)
        currentItem.extras.forEach(extra => {
            total += extra.preco;
        });
        
        // Construção do resumo
        if (currentItem.fruits.length > 0) {
            detalhes.push(`Frutas: ${currentItem.fruits.map(f => f.nome).join(', ')}`);
        } else {
            detalhes.push(`Frutas: Nenhuma selecionada`);
        }
        
        if (currentItem.extras.length > 0) {
            detalhes.push(`Extras: + ${currentItem.extras.map(e => e.nome).join(', ')}`);
        }
        
        if (currentItem.acomp.length > 0) {
            detalhes.push(`Acompanhamentos: ${currentItem.acomp.map(a => a.nome).join(', ')}`);
        }
        
        currentItem.obs = obsInput.value.trim();
        if (currentItem.obs) {
            detalhes.push(`Obs: ${currentItem.obs}`);
        }
        
        // Atualiza a propriedade total do item
        currentItem.total = total;
        currentItem.quantity = parseInt(quantityInput.value, 10) || 1;
        
        // Renderiza o resumo no modal
        document.getElementById('modalResumo').textContent = detalhes.join(' | ');
        
        // Atualiza o total final no botão
        const totalFinal = currentItem.total * currentItem.quantity;
        modalTotalSpan.textContent = formatCurrency(totalFinal);
        
        if (currentEditIndex === null) {
             addToOrderBtn.textContent = `Adicionar ao Pedido - ${formatCurrency(totalFinal)}`;
        } else {
             addToOrderBtn.textContent = `Salvar Alterações - ${formatCurrency(totalFinal)}`;
        }
        
        // Bloqueia o botão se as regras básicas não forem atendidas
        addToOrderBtn.disabled = currentItem.fruits.length === 0;
    }

    // 5. Adicionar ou Salvar Item
    function addToOrder() {
        if (currentItem.fruits.length === 0) {
            alert('Você precisa selecionar pelo menos uma fruta.');
            return;
        }
        
        // Se estiver editando, substitui o item existente
        if (currentEditIndex !== null) {
            pedidos[currentEditIndex] = JSON.parse(JSON.stringify(currentItem)); // Deep copy
        } else {
            // Se for um novo item, adiciona ao array
            pedidos.push(JSON.parse(JSON.stringify(currentItem))); // Deep copy
        }
        
        closeModal();
        renderizarPedido();
    }

    // ===================================
    // 6. SALVAMENTO E ENVIO
    // ===================================

    // FUNÇÃO CORRIGIDA: SALVA TODOS OS DADOS NO LOCALSTORAGE
    function saveToLocalStorage() {
        // Pega os valores dos inputs de Nome, WhatsApp e Endereço
        const name = nameInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        const neighborhood = neighborhoodInput.value.trim();

        // Salva os dados do cliente para a tela de confirmação ler
        localStorage.setItem('tropicanaPedidos', JSON.stringify(pedidos));
        localStorage.setItem('tropicanaName', name);
        localStorage.setItem('tropicanaWhatsapp', whatsapp);
        localStorage.setItem('tropicanaNeighborhood', neighborhood);
        
        // Lógica de Fidelidade: Adiciona selo por pedido (será consumido na tela de sucesso)
        if (whatsapp && whatsapp.length >= 11) {
            // A lógica de adicionar o selo **DEVE** ocorrer na tela de **SUCESSO** após a confirmação.
            // Aqui, apenas garantimos que os dados do cliente foram salvos.
        }
    }

    // FUNÇÃO CORRIGIDA: DE ENVIO DO PEDIDO
    function enviarPedido() {
        
        if (pedidos.length === 0) {
             alert('Adicione pelo menos um item ao pedido.');
             return;
        }
        
        const name = nameInput.value.trim();
        const neighborhood = neighborhoodInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        
        if (!name || !neighborhood || !whatsapp || whatsapp.length < 11) {
             alert('Por favor, preencha seu Nome, Endereço e WhatsApp (com DDD) corretamente para finalizar.');
             return;
        }
        
        // 1. Salva os dados no localStorage ANTES de ir para a próxima tela
        saveToLocalStorage(); 
        
        // 2. Redireciona para a tela de confirmação
        handlePageTransition('confirmacao.html');
    }

    // ===================================
    // 7. STATUS DA LOJA (EXEMPLO)
    // ===================================

    function isStoreOpen() {
        const now = new Date();
        const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
        const hour = now.getHours();
        
        // Exemplo: Aberto de Segunda a Sábado, das 10h às 22h
        const openHour = 10;
        const closeHour = 22;

        if (day === 0) return false; // Fechado no Domingo (0)
        
        return hour >= openHour && hour < closeHour;
    }

    function checkStoreStatus() {
        const storeStatusElement = document.querySelector('.store-status');
        
        if (isStoreOpen()) {
            storeStatusElement.textContent = 'Aberto';
            storeStatusElement.style.backgroundColor = '#4CAF50'; // Verde
            storeStatusElement.style.color = 'white';
            footerConfirmar.disabled = pedidos.length === 0 ? true : false;
        } else {
            storeStatusElement.textContent = 'Fechado';
            storeStatusElement.style.backgroundColor = '#F44336'; // Vermelho
            storeStatusElement.style.color = 'white';
            footerConfirmar.disabled = true;
        }
    }


    // ===================================
    // 8. LISTENERS E INICIALIZAÇÃO
    // ===================================

    // Expondo funções globais
    window.excluirItem = excluirItem; 
    window.editItem = editItem; 
    
    // Listeners do Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    addToOrderBtn.addEventListener('click', addToOrder);
    obsInput.addEventListener('input', atualizarModalResumo);
    quantityInput.addEventListener('input', atualizarModalResumo);

    // Listeners de Input (Dados do Cliente)
    // Salva os dados do cliente no LocalStorage ao digitar (UX)
    nameInput.addEventListener('input', () => localStorage.setItem('tropicanaName', nameInput.value.trim()));
    neighborhoodInput.addEventListener('input', () => localStorage.setItem('tropicanaNeighborhood', neighborhoodInput.value.trim()));
    
    // Listener do WhatsApp (formatação e cartão fidelidade)
    whatsappInput.addEventListener('input', updateLoyaltyCard);
    
    // Listener do Footer
    footerConfirmar.addEventListener('click', enviarPedido);

    // Inicialização
    renderizarSelecaoTamanho();
    renderizarPedido(); // Carrega pedidos e total na inicialização
    updateLoyaltyCard(); // Atualiza o cartão fidelidade se o WhatsApp estiver preenchido
    
    // Checagem de Status
    checkStoreStatus();
    setInterval(checkStoreStatus, 60000); // Checa o status a cada minuto
});
