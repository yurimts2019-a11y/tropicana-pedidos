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
    const fruits = ['Abacaxi', 'Morango', 'Mamão', 'Uva', 'Banana', 'Manga', 'Maçã']; 
    const extras = [
        { nome: 'Kiwi Extra', preco: 3.00, id: 'ext-kiwi' },
        { nome: 'Goiaba Extra', preco: 3.00, id: 'ext-goiaba' },
        { nome: 'Melão Extra', preco: 3.00, id: 'ext-melao' }
    ];
    const acomp = ['Leite Condensado', 'Mel', 'Granola', 'Iogurte Natural', 'Creme de Leite'];

    // 1.2 Elementos DOM - Inicializa as variáveis. Onde não existem, são 'null'.
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
    let currentItem = {}; 
    let currentEditIndex = null; 

    // Carrega dados do LocalStorage (APENAS SE O ELEMENTO EXISTIR)
    if(nameInput) nameInput.value = localStorage.getItem('tropicanaName') || '';
    if(whatsappInput) whatsappInput.value = localStorage.getItem('tropicanaWhatsapp') || '';
    if(neighborhoodInput) neighborhoodInput.value = localStorage.getItem('tropicanaNeighborhood') || '';

    // ===================================
    // 2. FUNÇÕES DE FIDELIDADE (WHATSAPP)
    // ===================================

    const getClientKey = (whatsapp) => whatsapp.replace(/\D/g, ''); 
    const getLoyaltyData = (key) => {
        const data = JSON.parse(localStorage.getItem('tropicanaLoyalty') || '{}');
        return data[key] || 0;
    };
    const saveLoyaltyData = (key, seals) => {
        const data = JSON.parse(localStorage.getItem('tropicanaLoyalty') || '{}');
        data[key] = seals;
        localStorage.setItem('tropicanaLoyalty', JSON.stringify(data));
    };

    function renderLoyaltySeals(whatsapp) {
        const whatsappKey = getClientKey(whatsapp);
        const sealsGrid = document.getElementById('sealsGrid');
        const fidelityMessage = document.getElementById('fidelityMessage');
        const seals = getLoyaltyData(whatsappKey);
        
        if (!sealsGrid || !fidelityMessage) return; // Sai se os elementos não existirem
        
        let sealsHTML = '';
        for (let i = 1; i <= 10; i++) {
            let classes = 'seal';
            let content = i;
            
            if (i <= seals) {
                classes += ' completed';
                content = i < 10 ? '✅' : '🌟';
            }
            if (i === 10) {
                classes += ' reward';
            }
            
            sealsHTML += `<div class="${classes}">${content}</div>`;
        }
        sealsGrid.innerHTML = sealsHTML;

        if (seals >= 10) {
            fidelityMessage.textContent = '🥳 Parabéns! Você já ganhou um prêmio na próxima compra!';
        } else {
            fidelityMessage.textContent = `Faltam ${10 - seals} selos para o seu prêmio! (${seals}/10)`;
        }
    }
    
    // FUNÇÃO CORRIGIDA PARA O ERRO NULL
    function updateLoyaltyCard() {
        if (!whatsappInput) return; // ✅ CORREÇÃO: Sai se o input não existir (e.g., na confirmacao.html)
        
        const whatsapp = whatsappInput.value.trim().replace(/\D/g, '');
        const cardContainer = document.getElementById('loyaltyCardContainer');
        
        let formattedWhatsapp = whatsapp;
        if (whatsapp.length > 2 && whatsapp.length <= 7) {
            formattedWhatsapp = `(${whatsapp.substring(0, 2)}) ${whatsapp.substring(2)}`;
        } else if (whatsapp.length > 7) {
            formattedWhatsapp = `(${whatsapp.substring(0, 2)}) ${whatsapp.substring(2, 7)}-${whatsapp.substring(7, 11)}`;
        }
        whatsappInput.value = formattedWhatsapp;

        if (cardContainer) {
            if (whatsapp.length >= 11) {
                cardContainer.style.display = 'block';
                renderLoyaltySeals(whatsapp);
            } else {
                cardContainer.style.display = 'none';
            }
        }
    }


    // ===================================
    // 3. RENDERIZAÇÃO E ATUALIZAÇÃO GERAL
    // ===================================

    function attachSizeCardListeners() {
        document.querySelectorAll('.size-card').forEach(card => {
            card.removeEventListener('click', handleSizeCardClick);
            card.addEventListener('click', handleSizeCardClick);
        });
    }

    function handleSizeCardClick() {
        try {
            const tamanho = JSON.parse(this.dataset.tamanho.replace(/&quot;/g, '\"'));
            openModal(tamanho);
        } catch (e) {
            console.error("Erro ao processar dados do cartão de tamanho:", e);
        }
    }

    // FUNÇÃO QUE RENDERIZA OS CARDS DE TAMANHO (OPÇÕES)
    function renderizarSelecaoTamanho() {
        const container = document.getElementById('sizeSelectionContainer');
        if (!container) return; // ✅ SEGURANÇA: Sai se o container não for encontrado
        
        let html = '';
        tamanhos.forEach(tamanho => {
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
        attachSizeCardListeners(); 
    }

    function renderizarPedido() {
        let cardsHTML = '';
        let totalPedido = 0;
        let resumoText = '';
        
        pedidos.forEach((item, index) => {
            const totalMultiplicado = item.total * item.quantity;
            totalPedido += totalMultiplicado;

            let detalhesText = [];
            if (item.fruits.length) detalhesText.push(item.fruits.map(f => f.nome).join(', '));
            if (item.extras.length) detalhesText.push(`+ ${item.extras.map(e => e.nome).join(', ')}`);
            if (item.acomp.length) detalhesText.push(item.acomp.map(a => a.nome).join(', '));
            if (item.obs) detalhesText.push(`Obs: ${item.obs}`);
            
            resumoText += `*${item.quantity}x* Salada #${index + 1} (${item.tamanho.nome}): ${detalhesText.join(' | ')}\n`;
            
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
        
        if(cardsContainer) cardsContainer.innerHTML = cardsHTML || '<p class="empty-state">Seu carrinho está vazio. Comece a montar sua salada!</p>';
        if(resumoContent) resumoContent.textContent = resumoText || 'Nenhuma Salada adicionada.';
        
        if(footerTotal) footerTotal.textContent = `TOTAL: ${formatCurrency(totalPedido)}`;
        if(footerConfirmar) footerConfirmar.disabled = pedidos.length === 0;

        const resumoBox = document.getElementById('resumoBox');
        if(resumoBox) {
            resumoBox.classList.remove('animate');
            setTimeout(() => resumoBox.classList.add('animate'), 10); 
        }

        localStorage.setItem('tropicanaPedidos', JSON.stringify(pedidos));
    }

    window.excluirItem = function(index) {
        if (confirm(`Tem certeza que deseja remover o item #${index + 1} do seu pedido?`)) {
            pedidos.splice(index, 1);
            renderizarPedido();
        }
    }


    // ===================================
    // 4. LÓGICA DO MODAL DE CUSTOMIZAÇÃO
    // ===================================

    function openModal(tamanho, index = null) {
        if (!modalOverlay) return;

        currentEditIndex = index;
        
        if (index !== null) {
            currentItem = JSON.parse(JSON.stringify(pedidos[index]));
            document.getElementById('modalTitle').textContent = `Editar Salada #${index + 1}`;
            addToOrderBtn.textContent = 'Salvar Alterações';
            quantityInput.value = currentItem.quantity;
        } else {
            currentItem = {
                tamanho: tamanho,
                fruits: [],
                extras: [],
                acomp: [],
                obs: '',
                quantity: 1,
                total: tamanho.preco
            };
            document.getElementById('modalTitle').textContent = `Personalize sua Salada (${tamanho.nome})`;
            addToOrderBtn.textContent = `Adicionar ao Pedido - ${formatCurrency(currentItem.total)}`;
            quantityInput.value = 1;
        }

        if(obsInput) obsInput.value = currentItem.obs;
        renderizarOpcoes();
        atualizarModalResumo();
        
        modalOverlay.classList.add('open');
    }

    function closeModal() {
        if(modalOverlay) modalOverlay.classList.remove('open');
        currentEditIndex = null;
    }

    function renderizarOpcoes() {
        const frutasOpcoes = document.getElementById('frutasOpcoes');
        const extrasOpcoes = document.getElementById('extrasOpcoes');
        const acompOpcoes = document.getElementById('acompOpcoes');
        
        if (!frutasOpcoes || !extrasOpcoes || !acompOpcoes) return; 
        
        frutasOpcoes.innerHTML = renderGroup(fruits.map(nome => ({ nome, preco: 0 })), 'fruit', false); 
        extrasOpcoes.innerHTML = renderGroup(extras, 'extra', true);
        acompOpcoes.innerHTML = renderGroup(acomp.map(nome => ({ nome, preco: 0 })), 'acomp', false); 

        document.querySelectorAll('.opcoes input').forEach(input => {
            input.removeEventListener('change', handleOptionChange);
            input.addEventListener('change', handleOptionChange);
        });
    }

    function renderGroup(options, type, hasPrice) {
        let html = '';
        const currentSelections = currentItem[`${type}s`] || currentItem[`${type}`] || [];

        options.forEach(option => {
            const nome = option.nome || option;
            const preco = hasPrice ? option.preco : 0;
            const isSelected = currentSelections.some(s => (s.nome || s) === nome);
            
            let isDisabled = false;
            if (type === 'fruit' && !isSelected && currentItem.fruits.length >= FRUIT_LIMIT) {
                isDisabled = true;
            }
            if (type === 'extra' && !isSelected && currentItem.extras.length >= EXTRA_LIMIT) {
                isDisabled = true;
            }
            
            const checkedAttr = isSelected ? 'checked' : '';
            const typeAttr = (type === 'acomp') ? 'radio' : 'checkbox';

            const optionData = { nome: nome, preco: preco }; 
            const dataAttr = JSON.stringify(optionData).replace(/"/g, '&quot;');
            
            const priceHtml = hasPrice && preco > 0 ? `<span class="chip-price">+${formatCurrency(preco)}</span>` : '';
            
            html += `
                <label class="option-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}">
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

    function handleOptionChange(event) {
        const input = event.target;
        const groupName = input.name;
        const type = groupName.replace('Options', '');
        
        const optionData = JSON.parse(input.dataset.option.replace(/&quot;/g, '"'));
        const targetArray = currentItem[`${type}s`] || currentItem[type]; 
        
        if (input.checked) {
            if (input.type === 'radio') {
                targetArray.splice(0, targetArray.length); 
            }
            targetArray.push(optionData);
        } else {
            const index = targetArray.findIndex(item => (item.nome || item) === optionData.nome);
            if (index > -1) {
                targetArray.splice(index, 1);
            }
        }

        renderizarOpcoes();
        atualizarModalResumo();
    }
    
    function atualizarModalResumo() {
        if (!currentItem || !currentItem.tamanho) return;
        
        let total = currentItem.tamanho.preco;
        let detalhes = [];
        
        currentItem.extras.forEach(extra => {
            total += extra.preco;
        });
        
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
        
        if(obsInput) currentItem.obs = obsInput.value.trim();
        if (currentItem.obs) {
            detalhes.push(`Obs: ${currentItem.obs}`);
        }
        
        currentItem.total = total;
        if(quantityInput) currentItem.quantity = parseInt(quantityInput.value, 10) || 1;
        
        const modalResumoElement = document.getElementById('modalResumo');
        if(modalResumoElement) modalResumoElement.textContent = detalhes.join(' | ');
        
        const totalFinal = currentItem.total * currentItem.quantity;
        if(modalTotalSpan) modalTotalSpan.textContent = formatCurrency(totalFinal);
        
        if(addToOrderBtn) {
            if (currentEditIndex === null) {
                 addToOrderBtn.textContent = `Adicionar ao Pedido - ${formatCurrency(totalFinal)}`;
            } else {
                 addToOrderBtn.textContent = `Salvar Alterações - ${formatCurrency(totalFinal)}`;
            }
            addToOrderBtn.disabled = currentItem.fruits.length === 0;
        }
    }

    function addToOrder() {
        if (currentItem.fruits.length === 0) {
            alert('Você precisa selecionar pelo menos uma fruta.');
            return;
        }
        
        if (currentEditIndex !== null) {
            pedidos[currentEditIndex] = JSON.parse(JSON.stringify(currentItem));
        } else {
            pedidos.push(JSON.parse(JSON.stringify(currentItem)));
        }
        
        closeModal();
        renderizarPedido();
    }

    window.editItem = function(index) {
        openModal(pedidos[index].tamanho, index);
    }

    // ===================================
    // 6. SALVAMENTO E ENVIO
    // ===================================

    function saveToLocalStorage() {
        // Apenas salva se o input existir na página
        const name = nameInput ? nameInput.value.trim() : localStorage.getItem('tropicanaName') || '';
        const whatsapp = whatsappInput ? whatsappInput.value.trim() : localStorage.getItem('tropicanaWhatsapp') || '';
        const neighborhood = neighborhoodInput ? neighborhoodInput.value.trim() : localStorage.getItem('tropicanaNeighborhood') || '';

        localStorage.setItem('tropicanaPedidos', JSON.stringify(pedidos));
        localStorage.setItem('tropicanaName', name);
        localStorage.setItem('tropicanaWhatsapp', whatsapp);
        localStorage.setItem('tropicanaNeighborhood', neighborhood);
    }

    function enviarPedido() {
        if (pedidos.length === 0) {
             alert('Adicione pelo menos um item ao pedido.');
             return;
        }
        
        // A checagem de preenchimento só ocorre se os inputs existirem na página (index.html)
        if (nameInput && neighborhoodInput && whatsappInput) {
             const name = nameInput.value.trim();
             const neighborhood = neighborhoodInput.value.trim();
             const whatsapp = whatsappInput.value.trim();
            
             if (!name || !neighborhood || !whatsapp || whatsapp.length < 11) {
                 alert('Por favor, preencha seu Nome, Endereço e WhatsApp (com DDD) corretamente para finalizar.');
                 return;
             }
        }
        
        saveToLocalStorage(); 
        handlePageTransition('confirmacao.html');
    }

    // ===================================
    // 7. STATUS DA LOJA (EXEMPLO)
    // ===================================

    function isStoreOpen() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        
        const openHour = 10;
        const closeHour = 22;

        if (day === 0) return false; 
        
        return hour >= openHour && hour < closeHour;
    }

    function checkStoreStatus() {
        const storeStatusElement = document.querySelector('.store-status');
        
        if (!storeStatusElement) return; 
        
        if (isStoreOpen()) {
            storeStatusElement.textContent = 'Aberto';
            storeStatusElement.style.backgroundColor = '#4CAF50';
            storeStatusElement.style.color = 'white';
            if(footerConfirmar) footerConfirmar.disabled = pedidos.length === 0 ? true : false;
        } else {
            storeStatusElement.textContent = 'Fechado';
            storeStatusElement.style.backgroundColor = '#F44336';
            storeStatusElement.style.color = 'white';
            if(footerConfirmar) footerConfirmar.disabled = true;
        }
    }


    // ===================================
    // 8. LISTENERS E INICIALIZAÇÃO
    // ===================================

    // Listeners do Modal (apenas se os elementos existirem)
    if(document.getElementById('closeModal')) document.getElementById('closeModal').addEventListener('click', closeModal);
    if(modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    if(addToOrderBtn) addToOrderBtn.addEventListener('click', addToOrder);
    if(obsInput) obsInput.addEventListener('input', atualizarModalResumo);
    if(quantityInput) quantityInput.addEventListener('input', atualizarModalResumo);

    // Listeners de Input (Dados do Cliente - apenas se existirem)
    if(nameInput) nameInput.addEventListener('input', () => localStorage.setItem('tropicanaName', nameInput.value.trim()));
    if(neighborhoodInput) neighborhoodInput.addEventListener('input', () => localStorage.setItem('tropicanaNeighborhood', neighborhoodInput.value.trim()));
    if(whatsappInput) whatsappInput.addEventListener('input', updateLoyaltyCard);
    
    // Listener do Footer
    if(footerConfirmar) footerConfirmar.addEventListener('click', enviarPedido);

    // Inicialização
    renderizarSelecaoTamanho(); // Chama a função principal que insere os botões de tamanho!
    renderizarPedido(); 
    updateLoyaltyCard();
    checkStoreStatus();
    setInterval(checkStoreStatus, 60000);
});
