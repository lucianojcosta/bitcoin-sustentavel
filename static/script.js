// Estado global da aplicação
let appState = {
    estado: '',
    equipamentosSelecionados: [],
    quantidadePaineis: 10,
    potenciaPainel: 550,
    dadosCarregados: false
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async function() {
    await inicializarAplicacao();
});

/**
 * Inicializa toda a aplicação
 */
async function inicializarAplicacao() {
    try {
        await carregarDadosIniciais();
        configurarEventListeners();
        appState.dadosCarregados = true;
        console.log('Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        alert('Erro ao carregar dados iniciais. Verifique sua conexão.');
    }
}

/**
 * Carrega dados iniciais do backend
 */
async function carregarDadosIniciais() {
    try {
        const response = await fetch('/api/dados-iniciais');
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        
        const data = await response.json();
        preencherEstados(data.estados);
        preencherEquipamentos(data.equipamentos);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        throw error;
    }
}

/**
 * Preenche dropdown de estados
 */
function preencherEstados(estados) {
    const select = document.getElementById('estado');
    select.innerHTML = '<option value="">Selecione seu estado</option>';
    
    for (const [sigla, info] of Object.entries(estados)) {
        const option = document.createElement('option');
        option.value = sigla;
        option.textContent = `${sigla} - ${info.nome} (${info.irradiacao} kWh/m²/dia)`;
        option.setAttribute('data-irradiacao', info.irradiacao);
        select.appendChild(option);
    }
}

/**
 * Preenche lista de equipamentos
 */
function preencherEquipamentos(equipamentos) {
    preencherCategoriaEquipamentos('ASIC', equipamentos.ASIC, 'lista-asics');
    preencherCategoriaEquipamentos('GPU', equipamentos.GPU, 'lista-gpus');
}

function preencherCategoriaEquipamentos(tipo, lista, elementoId) {
    const container = document.getElementById(elementoId);
    container.innerHTML = '';
    
    lista.forEach((equipamento, index) => {
        const div = document.createElement('div');
        div.className = 'equipamento-item';
        div.innerHTML = `
            <input type="checkbox" id="${tipo.toLowerCase()}-${index}" 
                   data-tipo="${tipo}"
                   data-modelo="${equipamento.modelo}"
                   data-consumo="${equipamento.consumo_w}"
                   data-hashrate="${equipamento.hashrate_th}"
                   data-custo="${equipamento.custo_aproximado}">
            <label for="${tipo.toLowerCase()}-${index}">
                <strong>${equipamento.modelo}</strong><br>
                <small>Fabricante: ${equipamento.fabricante}</small><br>
                Consumo: ${equipamento.consumo_w}W | Hashrate: ${equipamento.hashrate_th} TH/s<br>
                Custo: R$ ${equipamento.custo_aproximado.toLocaleString()}
            </label>
        `;
        container.appendChild(div);
    });
}

/**
 * Configura todos os event listeners
 */
function configurarEventListeners() {
    // Estado
    document.getElementById('estado').addEventListener('change', function() {
        appState.estado = this.value;
        const selectedOption = this.options[this.selectedIndex];
        const irradiacao = selectedOption.getAttribute('data-irradiacao');
        document.getElementById('irradiacao-info').textContent = irradiacao || '--';
        
        if (appState.estado) {
            calcularSolar();
        }
    });
    
    // Equipamentos
    document.addEventListener('change', function(e) {
        if (e.target.matches('input[data-tipo]')) {
            atualizarEquipamentosSelecionados();
        }
    });
    
    // Solar
    document.getElementById('quantidade-paineis').addEventListener('input', calcularSolar);
    document.getElementById('potencia-painel').addEventListener('change', calcularSolar);
}

/**
 * Atualiza lista de equipamentos selecionados
 */
async function atualizarEquipamentosSelecionados() {
    const checkboxes = document.querySelectorAll('input[data-tipo]:checked');
    appState.equipamentosSelecionados = Array.from(checkboxes).map(cb => ({
        tipo: cb.getAttribute('data-tipo'),
        modelo: cb.getAttribute('data-modelo'),
        consumo: parseInt(cb.getAttribute('data-consumo')),
        hashrate: parseFloat(cb.getAttribute('data-hashrate')),
        custo: parseInt(cb.getAttribute('data-custo'))
    }));
    
    await calcularEquipamentos();
}

/**
 * Calcula dados dos equipamentos via backend
 */
async function calcularEquipamentos() {
    try {
        const response = await fetch('/api/simular-equipamentos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                equipamentos: appState.equipamentosSelecionados
            })
        });
        
        if (!response.ok) throw new Error('Erro no servidor');
        
        const data = await response.json();
        
        // Atualiza UI
        document.getElementById('consumo-total').textContent = data.consumo_total_w.toLocaleString() + ' W';
        document.getElementById('custo-equipamentos').textContent = 'R$ ' + data.custo_equipamentos.toLocaleString();
        document.getElementById('hashrate-total').textContent = data.hashrate_total_th.toLocaleString('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }) + ' TH/s';
        document.getElementById('consumo-mensal-kwh').textContent = data.consumo_mensal_kwh + ' kWh';
        
    } catch (error) {
        console.error('Erro ao calcular equipamentos:', error);
    }
}

/**
 * Calcula dados do sistema solar via backend
 */
async function calcularSolar() {
    if (!appState.estado) return;
    
    appState.quantidadePaineis = parseInt(document.getElementById('quantidade-paineis').value) || 0;
    appState.potenciaPainel = parseInt(document.getElementById('potencia-painel').value) || 550;
    
    try {
        const response = await fetch('/api/simular-solar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                quantidade_paineis: appState.quantidadePaineis,
                potencia_painel: appState.potenciaPainel,
                estado: appState.estado
            })
        });
        
        if (!response.ok) throw new Error('Erro no servidor');
        
        const data = await response.json();
        
        document.getElementById('geracao-mensal').textContent = data.geracao_solar_kwh + ' kWh/mês';
        document.getElementById('potencia-sistema').textContent = data.potencia_sistema_kw + ' kWp';
        
    } catch (error) {
        console.error('Erro ao calcular solar:', error);
    }
}

/**
 * Calcula viabilidade completa do projeto
 */
async function calcularViabilidadeCompleta() {
    if (!validarDados()) return;
    
    const custoEnergia = parseFloat(document.getElementById('custo-energia').value) || 0.80;
    const custoSistemaSolar = parseFloat(document.getElementById('custo-sistema').value) || 0;
    const orcamentoTotal = parseFloat(document.getElementById('orcamento').value) || 0;
    
    try {
        mostrarLoading();
        
        const response = await fetch('/api/calcular-viabilidade-completa', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                estado: appState.estado,
                equipamentos: appState.equipamentosSelecionados,
                quantidade_paineis: appState.quantidadePaineis,
                potencia_painel: appState.potenciaPainel,
                custo_energia: custoEnergia,
                custo_sistema_solar: custoSistemaSolar,
                orcamento_total: orcamentoTotal
            })
        });
        
        if (!response.ok) throw new Error('Erro no servidor');
        
        const data = await response.json();
        
        if (data.erro) {
            alert('Erro: ' + data.erro);
            return;
        }
        
        exibirResultadosCompletos(data);
        openTab('resultados');
        
    } catch (error) {
        console.error('Erro ao calcular viabilidade:', error);
        alert('Erro ao calcular viabilidade. Tente novamente.');
    }
}

/**
 * Valida dados antes do cálculo
 */
function validarDados() {
    if (!appState.estado) {
        alert('Por favor, selecione um estado.');
        return false;
    }
    if (appState.equipamentosSelecionados.length === 0) {
        alert('Por favor, selecione pelo menos um equipamento.');
        return false;
    }
    if (appState.quantidadePaineis === 0) {
        alert('Por favor, configure o sistema solar.');
        return false;
    }
    return true;
}

/**
 * Exibe resultados completos na interface
 */
function exibirResultadosCompletos(data) {
    // Indicadores principais
    document.getElementById('cobertura-solar').textContent = data.cobertura_solar + '%';
    document.getElementById('economia-mensal').textContent = 'R$ ' + data.economia_mensal;
    document.getElementById('payback').textContent = data.payback_meses + ' meses';
    document.getElementById('co2-evitado').textContent = data.co2_evitado_kg + ' kg/mês';
    
    // Gráfico de barras
    const maxValor = Math.max(data.consumo_mensal_kwh, data.geracao_solar_kwh);
    const alturaConsumo = (data.consumo_mensal_kwh / maxValor) * 100;
    const alturaGeracao = (data.geracao_solar_kwh / maxValor) * 100;
    
    document.getElementById('barra-consumo').style.height = alturaConsumo + '%';
    document.getElementById('barra-geracao').style.height = alturaGeracao + '%';
    
    document.getElementById('valor-consumo').textContent = data.consumo_mensal_kwh + ' kWh';
    document.getElementById('valor-geracao').textContent = data.geracao_solar_kwh + ' kWh';
    
    // Recomendação e detalhes
    exibirRecomendacao(data);
    exibirDetalhesFinanceiros(data);
}

/**
 * Exibe análise de viabilidade
 */
function exibirRecomendacao(data) {
    const recomendacao = document.getElementById('recomendacao');
    recomendacao.innerHTML = `
        <h3>💡 ${data.viabilidade.status}</h3>
        <p>${data.viabilidade.descricao}</p>
    `;
    recomendacao.style.borderLeftColor = data.viabilidade.cor;
}

/**
 * Exibe detalhes financeiros
 */
function exibirDetalhesFinanceiros(data) {
    const detalhes = document.getElementById('detalhes-financeiros');
    detalhes.style.display = 'block';
    
    document.getElementById('detalhe-receita').textContent = 
        'R$ ' + data.receita_mineracao_mensal + '/mês';
    document.getElementById('detalhe-investimento').textContent = 
        'R$ ' + data.investimento_total.toLocaleString();
    document.getElementById('detalhe-bitcoin').textContent = 
        'R$ ' + data.preco_bitcoin_brl.toLocaleString();
}

/**
 * Mostra estado de carregamento
 */
function mostrarLoading() {
    document.getElementById('recomendacao').innerHTML = `
        <h3>🔄 Calculando Viabilidade</h3>
        <p>Processando dados e realizando cálculos...</p>
    `;
    document.getElementById('detalhes-financeiros').style.display = 'none';
}

/**
 * Funções de navegação entre abas
 */
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function avancarParaMontagem() {
    if (!appState.estado) {
        alert('Por favor, selecione seu estado primeiro.');
        return;
    }
    openTab('montar-estacao');
}

function avancarParaEnergiaSolar() {
    if (appState.equipamentosSelecionados.length === 0) {
        alert('Por favor, selecione pelo menos um equipamento.');
        return;
    }
    openTab('energia-solar');
}