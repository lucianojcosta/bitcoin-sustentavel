// Estado global da aplicação - VERSÃO ATUALIZADA
let appState = {
    estado: '',
    equipamentosSelecionados: [],
    paineisSolaresSelecionados: [],
    dadosCarregados: false,
    orcamentoTotal: 50000,
    equipamentosDisponiveis: null,
    paineisDisponiveis: [],
    
    // NOVO: Dados calculados para sincronização
    dadosCalculados: {
        consumoTotalW: 0,
        custoEquipamentos: 0,
        hashrateTotalTH: 0,
        consumoMensalKwh: 0,
        
        quantidadeTotalPaineis: 0,
        potenciaTotalSistemaW: 0,
        custoSistemaSolar: 0,
        geracaoMensalKwh: 0,
        
        coberturaSolar: 0,
        economiaMensal: 0,
        receitaMineracaoMensal: 0,
        paybackMeses: 0,
        co2EvitadoKg: 0
    }
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async function() {
    await inicializarAplicacao();
    inicializarDisplays();
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
 * Inicializa os displays com valores padrão
 */
function inicializarDisplays() {
    // Aba 2: Equipamentos
    document.getElementById('consumo-total').textContent = '0 W';
    document.getElementById('custo-equipamentos').textContent = 'R$ 0';
    document.getElementById('hashrate-total').textContent = '0 TH/s';
    document.getElementById('consumo-mensal-kwh').textContent = '0 kWh';
    
    // Orçamento
    document.getElementById('orcamento-display').textContent = 'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('gasto-equipamentos').textContent = 'R$ 0';
    document.getElementById('saldo-disponivel').textContent = 'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('percentual-orcamento').textContent = '0%';
    
    // Aba 3: Painéis solares
    document.getElementById('quantidade-total-paineis').textContent = '0 painéis';
    document.getElementById('potencia-total-sistema').textContent = '0 kWp';
    document.getElementById('custo-sistema-solar').textContent = 'R$ 0';
    document.getElementById('geracao-mensal-estimada').textContent = '0 kWh/mês';
    
    // Orçamento solar
    document.getElementById('orcamento-total-display').textContent = 'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('gasto-total-projeto').textContent = 'R$ 0';
    document.getElementById('saldo-final-projeto').textContent = 'R$ ' + appState.orcamentoTotal.toLocaleString();
    
    // Aba 4: Resultados
    document.getElementById('cobertura-solar').textContent = '--%';
    document.getElementById('economia-mensal').textContent = 'R$ --';
    document.getElementById('payback').textContent = '-- meses';
    document.getElementById('co2-evitado').textContent = '-- kg/mês';
    document.getElementById('valor-consumo').textContent = '0 kWh';
    document.getElementById('valor-geracao').textContent = '0 kWh';
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
        appState.equipamentosDisponiveis = data.equipamentos;
        preencherEquipamentos(data.equipamentos);
        appState.paineisDisponiveis = data.paineis_solares;
        preencherPaineisSolares(data.paineis_solares);
        
        appState.orcamentoTotal = parseFloat(document.getElementById('orcamento').value) || 50000;
        atualizarDisplayOrcamento();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        throw error;
    }
}

/**
 * FUNÇÃO PRINCIPAL: Calcula e sincroniza TODOS os dados
 */
async function calcularESincronizarTodosDados() {
    // 1. Calcula dados dos equipamentos
    await calcularDadosEquipamentos();
    
    // 2. Calcula dados dos painéis solares
    await calcularDadosPainéisSolares();
    
    // 3. Atualiza orçamentos
    await atualizarOrcamentos();
    
    // 4. Atualiza displays
    atualizarTodosDisplays();
    
    // 5. Se tiver todos os dados, calcula prévia da aba 4
    if (appState.estado && appState.equipamentosSelecionados.length > 0 && appState.paineisSolaresSelecionados.length > 0) {
        await calcularPreviaResultados();
    }
}

/**
 * 1. Calcula dados dos equipamentos (Aba 2)
 */
async function calcularDadosEquipamentos() {
    // Cálculo local para resposta imediata
    let consumoTotal = 0;
    let custoTotal = 0;
    let hashrateTotal = 0;
    
    appState.equipamentosSelecionados.forEach(equip => {
        const quantidade = equip.quantidade || 1;
        consumoTotal += equip.consumo * quantidade;
        custoTotal += equip.custo * quantidade;
        hashrateTotal += equip.hashrate * quantidade;
    });
    
    // Armazena nos dados calculados
    appState.dadosCalculados.consumoTotalW = consumoTotal;
    appState.dadosCalculados.custoEquipamentos = custoTotal;
    appState.dadosCalculados.hashrateTotalTH = hashrateTotal;
    appState.dadosCalculados.consumoMensalKwh = (consumoTotal * 24 * 30) / 1000;
    
    // Também calcula no backend para precisão
    try {
        const response = await fetch('/api/simular-equipamentos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                equipamentos: appState.equipamentosSelecionados.map(eq => ({
                    consumo: eq.consumo,
                    custo: eq.custo,
                    hashrate: eq.hashrate,
                    quantidade: eq.quantidade || 1
                }))
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Atualiza com dados precisos do backend
            appState.dadosCalculados.consumoTotalW = data.consumo_total_w;
            appState.dadosCalculados.custoEquipamentos = data.custo_equipamentos;
            appState.dadosCalculados.hashrateTotalTH = data.hashrate_total_th;
            appState.dadosCalculados.consumoMensalKwh = data.consumo_mensal_kwh;
        }
    } catch (error) {
        console.error('Erro ao calcular equipamentos no backend:', error);
    }
}

/**
 * 2. Calcula dados dos painéis solares (Aba 3)
 */
async function calcularDadosPainéisSolares() {
    // Cálculo local
    let quantidadeTotal = 0;
    let potenciaTotal = 0;
    let custoTotal = 0;
    
    appState.paineisSolaresSelecionados.forEach(painel => {
        quantidadeTotal += painel.quantidade || 0;
        potenciaTotal += (painel.potencia_w || 0) * (painel.quantidade || 0);
        custoTotal += (painel.preco || 0) * (painel.quantidade || 0);
    });
    
    // Armazena nos dados calculados
    appState.dadosCalculados.quantidadeTotalPaineis = quantidadeTotal;
    appState.dadosCalculados.potenciaTotalSistemaW = potenciaTotal;
    appState.dadosCalculados.custoSistemaSolar = custoTotal;
    
    // Calcula geração solar se tiver estado selecionado
    if (appState.estado && quantidadeTotal > 0) {
        const potenciaMedia = Math.round(potenciaTotal / quantidadeTotal);
        
        try {
            const response = await fetch('/api/simular-solar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    quantidade_paineis: quantidadeTotal,
                    potencia_painel: potenciaMedia,
                    estado: appState.estado
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                appState.dadosCalculados.geracaoMensalKwh = data.geracao_solar_kwh;
            }
        } catch (error) {
            console.error('Erro ao calcular geração solar:', error);
            // Calculo local aproximado
            appState.dadosCalculados.geracaoMensalKwh = (potenciaTotal / 1000) * 4.5 * 30 * 0.85; // Fórmula simplificada
        }
    } else {
        appState.dadosCalculados.geracaoMensalKwh = 0;
    }
}

/**
 * 3. Calcula prévia dos resultados (Aba 4)
 */
async function calcularPreviaResultados() {
    if (!appState.estado || !appState.equipamentosSelecionados.length || !appState.paineisSolaresSelecionados.length) {
        return;
    }
    
    const custoEnergia = parseFloat(document.getElementById('custo-energia').value) || 0.80;
    
    try {
        const response = await fetch('/api/calcular-viabilidade-completa', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                estado: appState.estado,
                equipamentos: appState.equipamentosSelecionados.map(eq => ({
                    consumo: eq.consumo,
                    custo: eq.custo,
                    hashrate: eq.hashrate,
                    quantidade: eq.quantidade || 1
                })),
                quantidade_paineis: appState.dadosCalculados.quantidadeTotalPaineis,
                potencia_painel: appState.dadosCalculados.quantidadeTotalPaineis > 0 ? 
                    Math.round(appState.dadosCalculados.potenciaTotalSistemaW / appState.dadosCalculados.quantidadeTotalPaineis) : 0,
                custo_energia: custoEnergia,
                custo_sistema_solar: appState.dadosCalculados.custoSistemaSolar,
                orcamento_total: appState.orcamentoTotal
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Atualiza os dados calculados
            appState.dadosCalculados.coberturaSolar = data.cobertura_solar || 0;
            appState.dadosCalculados.economiaMensal = data.economia_mensal || 0;
            appState.dadosCalculados.receitaMineracaoMensal = data.receita_mineracao_mensal || 0;
            appState.dadosCalculados.paybackMeses = data.payback_meses || 0;
            appState.dadosCalculados.co2EvitadoKg = data.co2_evitado_kg || 0;
            
            // Atualiza a aba 4 imediatamente
            atualizarAbaResultados(data);
        }
    } catch (error) {
        console.error('Erro ao calcular prévia de resultados:', error);
    }
}

/**
 * 4. Atualiza TODOS os displays
 */
function atualizarTodosDisplays() {
    // Aba 2: Equipamentos
    document.getElementById('consumo-total').textContent = 
        appState.dadosCalculados.consumoTotalW.toLocaleString() + ' W';
    document.getElementById('custo-equipamentos').textContent = 
        'R$ ' + appState.dadosCalculados.custoEquipamentos.toLocaleString();
    document.getElementById('hashrate-total').textContent = 
        appState.dadosCalculados.hashrateTotalTH.toLocaleString('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }) + ' TH/s';
    document.getElementById('consumo-mensal-kwh').textContent = 
        appState.dadosCalculados.consumoMensalKwh.toFixed(1) + ' kWh';
    
    // Aba 3: Painéis solares
    document.getElementById('quantidade-total-paineis').textContent = 
        appState.dadosCalculados.quantidadeTotalPaineis + ' painéis';
    document.getElementById('potencia-total-sistema').textContent = 
        (appState.dadosCalculados.potenciaTotalSistemaW / 1000).toFixed(2) + ' kWp';
    document.getElementById('custo-sistema-solar').textContent = 
        'R$ ' + appState.dadosCalculados.custoSistemaSolar.toLocaleString();
    document.getElementById('geracao-mensal-estimada').textContent = 
        appState.dadosCalculados.geracaoMensalKwh.toFixed(1) + ' kWh/mês';
    
    // Aba 4: Atualiza gráfico se tiver dados
    atualizarGraficoEnergia();
}

/**
 * Atualiza gráfico de energia na aba 4
 */
function atualizarGraficoEnergia() {
    const consumo = appState.dadosCalculados.consumoMensalKwh;
    const geracao = appState.dadosCalculados.geracaoMensalKwh;
    const maxValor = Math.max(consumo, geracao, 1); // Evita divisão por zero
    
    if (maxValor > 0) {
        const alturaConsumo = (consumo / maxValor) * 100;
        const alturaGeracao = (geracao / maxValor) * 100;
        
        document.getElementById('barra-consumo').style.height = alturaConsumo + '%';
        document.getElementById('barra-geracao').style.height = alturaGeracao + '%';
        
        document.getElementById('valor-consumo').textContent = consumo.toFixed(1) + ' kWh';
        document.getElementById('valor-geracao').textContent = geracao.toFixed(1) + ' kWh';
    }
}

/**
 * Atualiza a aba 4 com dados completos
 */
function atualizarAbaResultados(data) {
    // Indicadores principais
    document.getElementById('cobertura-solar').textContent = 
        (data.cobertura_solar || 0).toFixed(1) + '%';
    document.getElementById('economia-mensal').textContent = 
        'R$ ' + (data.economia_mensal || 0).toFixed(2);
    document.getElementById('payback').textContent = 
        (data.payback_meses || 0).toFixed(1) + ' meses';
    document.getElementById('co2-evitado').textContent = 
        (data.co2_evitado_kg || 0).toFixed(1) + ' kg/mês';
    
    // Gráfico
    atualizarGraficoEnergia();
    
    // Recomendação
    if (data.viabilidade) {
        const recomendacao = document.getElementById('recomendacao');
        recomendacao.innerHTML = `
            <h3>💡 ${data.viabilidade.status || 'ANÁLISE'}</h3>
            <p>${data.viabilidade.descricao || 'Calculando análise de viabilidade...'}</p>
        `;
        if (data.viabilidade.cor) {
            recomendacao.style.borderLeftColor = data.viabilidade.cor;
        }
    }
    
    // Detalhes financeiros EXPANDIDOS
    const detalhes = document.getElementById('detalhes-financeiros');
    detalhes.style.display = 'block';
    
    // Atualiza os detalhes existentes
    document.getElementById('detalhe-receita').textContent = 
        'R$ ' + (data.receita_mineracao_mensal || 0).toFixed(2) + '/mês';
    document.getElementById('detalhe-investimento').textContent = 
        'R$ ' + (data.investimento_total || 0).toLocaleString();
    document.getElementById('detalhe-bitcoin').textContent = 
        'R$ ' + (data.preco_bitcoin_brl || 0).toLocaleString();
    
    // Adiciona novos detalhes se existirem
    if (data.detalhes_calculo) {
        const detalhesGrid = document.querySelector('.detalhes-grid');
        
        // Adiciona linha de custo de energia
        const linhaCustoEnergia = document.createElement('div');
        linhaCustoEnergia.className = 'detalhe-item';
        linhaCustoEnergia.innerHTML = `
            <span>Custo energia (déficit):</span>
            <span>R$ ${(data.custo_energia_deficit || 0).toFixed(2)}/mês</span>
        `;
        detalhesGrid.appendChild(linhaCustoEnergia);
        
        // Adiciona linha de energia solar utilizada
        const linhaEnergiaUtilizada = document.createElement('div');
        linhaEnergiaUtilizada.className = 'detalhe-item';
        linhaEnergiaUtilizada.innerHTML = `
            <span>Energia solar utilizada:</span>
            <span>${(data.detalhes_calculo.energia_solar_utilizada || 0).toFixed(1)} kWh/mês</span>
        `;
        detalhesGrid.appendChild(linhaEnergiaUtilizada);
    }
    
    // Adiciona botão para ver cálculos detalhados
    const botaoDetalhes = document.createElement('button');
    botaoDetalhes.textContent = '📊 Ver Cálculos Detalhados';
    botaoDetalhes.style.marginTop = '1rem';
    botaoDetalhes.style.padding = '0.5rem 1rem';
    botaoDetalhes.style.background = '#3498db';
    botaoDetalhes.style.color = 'white';
    botaoDetalhes.style.border = 'none';
    botaoDetalhes.style.borderRadius = '5px';
    botaoDetalhes.style.cursor = 'pointer';
    botaoDetalhes.onclick = mostrarCalculosDetalhados;
    
    if (!document.getElementById('btn-detalhes-calculo')) {
        botaoDetalhes.id = 'btn-detalhes-calculo';
        detalhes.appendChild(botaoDetalhes);
    }
}

/**
 * 3. Atualiza orçamentos
 */
async function atualizarOrcamentos() {
    // Orçamento equipamentos
    const custoEquipamentos = appState.dadosCalculados.custoEquipamentos;
    const saldoEquipamentos = appState.orcamentoTotal - custoEquipamentos;
    const percentualEquipamentos = appState.orcamentoTotal > 0 ? 
        (custoEquipamentos / appState.orcamentoTotal * 100) : 0;
    
    document.getElementById('gasto-equipamentos').textContent = 
        'R$ ' + custoEquipamentos.toLocaleString();
    document.getElementById('saldo-disponivel').textContent = 
        'R$ ' + saldoEquipamentos.toLocaleString();
    document.getElementById('percentual-orcamento').textContent = 
        percentualEquipamentos.toFixed(1) + '%';
    
    // Alerta orçamento equipamentos
    const alertaEquipamentos = document.getElementById('alerta-orcamento');
    if (saldoEquipamentos < 0) {
        alertaEquipamentos.innerHTML = `<span style="color: #e74c3c;">⚠️ Atenção: Orçamento ultrapassado em R$ ${Math.abs(saldoEquipamentos).toLocaleString()}</span>`;
        alertaEquipamentos.style.display = 'block';
        alertaEquipamentos.style.backgroundColor = '#f8d7da';
    } else if (percentualEquipamentos > 80) {
        alertaEquipamentos.innerHTML = `<span style="color: #f39c12;">⚠️ Cuidado: Você já utilizou ${percentualEquipamentos.toFixed(1)}% do orçamento</span>`;
        alertaEquipamentos.style.display = 'block';
        alertaEquipamentos.style.backgroundColor = '#fff3cd';
    } else {
        alertaEquipamentos.style.display = 'none';
    }
    
    // Orçamento total (equipamentos + solar)
    const custoSistemaSolar = appState.dadosCalculados.custoSistemaSolar;
    const gastoTotal = custoEquipamentos + custoSistemaSolar;
    const saldoFinal = appState.orcamentoTotal - gastoTotal;
    
    document.getElementById('gasto-total-projeto').textContent = 
        'R$ ' + gastoTotal.toLocaleString();
    document.getElementById('saldo-final-projeto').textContent = 
        'R$ ' + saldoFinal.toLocaleString();
    
    // Alerta orçamento total
    const alertaTotal = document.getElementById('alerta-orcamento-solar');
    if (saldoFinal < 0) {
        alertaTotal.innerHTML = `<span style="color: #e74c3c;">❌ Orçamento excedido em R$ ${Math.abs(saldoFinal).toLocaleString()}</span>`;
        alertaTotal.style.display = 'block';
        alertaTotal.style.backgroundColor = '#f8d7da';
    } else if (gastoTotal / appState.orcamentoTotal > 0.9) {
        alertaTotal.innerHTML = `<span style="color: #f39c12;">⚠️ Cuidado: 90% do orçamento utilizado</span>`;
        alertaTotal.style.display = 'block';
        alertaTotal.style.backgroundColor = '#fff3cd';
    } else {
        alertaTotal.style.display = 'none';
    }
}

/**
 * Atualiza display do orçamento em todas as abas
 */
function atualizarDisplayOrcamento() {
    // Aba 2
    document.getElementById('orcamento-display').textContent = 
        'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('saldo-disponivel').textContent = 
        'R$ ' + appState.orcamentoTotal.toLocaleString();
    
    // Aba 3
    document.getElementById('orcamento-total-display').textContent = 
        'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('saldo-final-projeto').textContent = 
        'R$ ' + appState.orcamentoTotal.toLocaleString();
}

// ==============================================
// FUNÇÕES EXISTENTES (ATUALIZADAS PARA USAR A NOVA FUNÇÃO PRINCIPAL)
// ==============================================

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
            <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                <div style="flex: 1;">
                    <strong>${equipamento.modelo}</strong><br>
                    <small>Fabricante: ${equipamento.fabricante}</small><br>
                    <small>Consumo: ${equipamento.consumo_w}W | Hashrate: ${equipamento.hashrate_th} TH/s</small>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <button onclick="diminuirEquipamento('${tipo}', ${index})" 
                            style="padding: 0.5rem 0.75rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">-</button>
                    <input type="number" id="quantidade-${tipo.toLowerCase()}-${index}" 
                           min="0" value="0" 
                           style="width: 70px; text-align: center; border: 2px solid #bdc3c7; border-radius: 5px; padding: 0.25rem;"
                           onchange="atualizarQuantidadeEquipamento('${tipo}', ${index})">
                    <button onclick="aumentarEquipamento('${tipo}', ${index})" 
                            style="padding: 0.5rem 0.75rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">+</button>
                </div>
                <div style="text-align: right; min-width: 120px;">
                    <strong>R$ ${equipamento.custo_aproximado.toLocaleString()}</strong><br>
                    <small>cada</small>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function aumentarEquipamento(tipo, index) {
    const input = document.getElementById(`quantidade-${tipo.toLowerCase()}-${index}`);
    input.value = parseInt(input.value || 0) + 1;
    atualizarQuantidadeEquipamento(tipo, index);
}

function diminuirEquipamento(tipo, index) {
    const input = document.getElementById(`quantidade-${tipo.toLowerCase()}-${index}`);
    const valorAtual = parseInt(input.value || 0);
    if (valorAtual > 0) {
        input.value = valorAtual - 1;
        atualizarQuantidadeEquipamento(tipo, index);
    }
}

async function atualizarQuantidadeEquipamento(tipo, index) {
    const input = document.getElementById(`quantidade-${tipo.toLowerCase()}-${index}`);
    const quantidade = parseInt(input.value) || 0;
    
    if (!appState.equipamentosDisponiveis || !appState.equipamentosDisponiveis[tipo]) {
        return;
    }
    
    const equipamentoBase = appState.equipamentosDisponiveis[tipo][index];
    const equipamentoExistenteIndex = appState.equipamentosSelecionados.findIndex(eq => 
        eq.tipo === tipo && eq.index === index
    );
    
    if (quantidade > 0) {
        if (equipamentoExistenteIndex !== -1) {
            appState.equipamentosSelecionados[equipamentoExistenteIndex].quantidade = quantidade;
        } else {
            appState.equipamentosSelecionados.push({
                tipo: tipo,
                modelo: equipamentoBase.modelo,
                consumo: equipamentoBase.consumo_w,
                hashrate: equipamentoBase.hashrate_th,
                custo: equipamentoBase.custo_aproximado,
                index: index,
                quantidade: quantidade
            });
        }
    } else if (equipamentoExistenteIndex !== -1) {
        appState.equipamentosSelecionados.splice(equipamentoExistenteIndex, 1);
    }
    
    // Usa a função principal para sincronizar tudo
    await calcularESincronizarTodosDados();
}

function preencherPaineisSolares(paineis) {
    const container = document.getElementById('lista-paineis');
    container.innerHTML = '';
    
    paineis.forEach((painel, index) => {
        const div = document.createElement('div');
        div.className = 'equipamento-item';
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                <div style="flex: 1;">
                    <strong>${painel.modelo}</strong><br>
                    <small>Tipo: ${painel.tipo} | Potência: ${painel.potencia_w}W</small><br>
                    <small>Custo por Watt: R$ ${painel.custo_por_watt.toFixed(2)}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <button onclick="diminuirPainel(${index})" style="padding: 0.5rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">-</button>
                    <input type="number" id="quantidade-painel-${index}" 
                           min="0" value="0" 
                           style="width: 60px; text-align: center; border: 2px solid #bdc3c7; border-radius: 5px; padding: 0.25rem;"
                           onchange="atualizarQuantidadePainel(${index})">
                    <button onclick="aumentarPainel(${index})" style="padding: 0.5rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">+</button>
                </div>
                <div style="text-align: right; min-width: 120px;">
                    <strong>R$ ${painel.preco.toFixed(2)}</strong><br>
                    <small>cada</small>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function atualizarQuantidadePainel(index) {
    const input = document.getElementById(`quantidade-painel-${index}`);
    const quantidade = parseInt(input.value) || 0;
    
    const painelExistenteIndex = appState.paineisSolaresSelecionados.findIndex(p => p.index === index);
    
    if (quantidade > 0) {
        if (painelExistenteIndex !== -1) {
            appState.paineisSolaresSelecionados[painelExistenteIndex].quantidade = quantidade;
        } else {
            const painel = appState.paineisDisponiveis[index];
            appState.paineisSolaresSelecionados.push({
                ...painel,
                index: index,
                quantidade: quantidade
            });
        }
    } else if (painelExistenteIndex !== -1) {
        appState.paineisSolaresSelecionados.splice(painelExistenteIndex, 1);
    }
    
    // Usa a função principal para sincronizar tudo
    calcularESincronizarTodosDados();
}

function aumentarPainel(index) {
    const input = document.getElementById(`quantidade-painel-${index}`);
    input.value = parseInt(input.value || 0) + 1;
    atualizarQuantidadePainel(index);
}

function diminuirPainel(index) {
    const input = document.getElementById(`quantidade-painel-${index}`);
    const valorAtual = parseInt(input.value || 0);
    if (valorAtual > 0) {
        input.value = valorAtual - 1;
        atualizarQuantidadePainel(index);
    }
}

function configurarEventListeners() {
    // Estado
    document.getElementById('estado').addEventListener('change', function() {
        appState.estado = this.value;
        const selectedOption = this.options[this.selectedIndex];
        const irradiacao = selectedOption.getAttribute('data-irradiacao');
        document.getElementById('irradiacao-info').textContent = irradiacao || '--';
        
        // Recalcula tudo quando muda o estado
        calcularESincronizarTodosDados();
    });
    
    // Orçamento total
    document.getElementById('orcamento').addEventListener('input', function() {
        appState.orcamentoTotal = parseFloat(this.value) || 0;
        atualizarDisplayOrcamento();
        calcularESincronizarTodosDados();
    });
    
    // Custo da energia
    document.getElementById('custo-energia').addEventListener('input', function() {
        // Recalcula resultados quando muda o custo da energia
        if (appState.estado && appState.equipamentosSelecionados.length > 0) {
            calcularPreviaResultados();
        }
    });
}

/**
 * Função para calcular viabilidade completa (mantida para compatibilidade)
 */
async function calcularViabilidadeCompleta() {
    if (!validarDados()) return;
    
    try {
        mostrarLoading();
        
        const custoEnergia = parseFloat(document.getElementById('custo-energia').value) || 0.80;
        
        const response = await fetch('/api/calcular-viabilidade-completa', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                estado: appState.estado,
                equipamentos: appState.equipamentosSelecionados.map(eq => ({
                    consumo: eq.consumo,
                    custo: eq.custo,
                    hashrate: eq.hashrate,
                    quantidade: eq.quantidade || 1
                })),
                quantidade_paineis: appState.dadosCalculados.quantidadeTotalPaineis,
                potencia_painel: appState.dadosCalculados.quantidadeTotalPaineis > 0 ? 
                    Math.round(appState.dadosCalculados.potenciaTotalSistemaW / appState.dadosCalculados.quantidadeTotalPaineis) : 0,
                custo_energia: custoEnergia,
                custo_sistema_solar: appState.dadosCalculados.custoSistemaSolar,
                orcamento_total: appState.orcamentoTotal
            })
        });
        
        if (!response.ok) throw new Error('Erro no servidor');
        
        const data = await response.json();
        
        if (data.erro) {
            alert('Erro: ' + data.erro);
            return;
        }
        
        // Atualiza os dados calculados
        appState.dadosCalculados.coberturaSolar = data.cobertura_solar || 0;
        appState.dadosCalculados.economiaMensal = data.economia_mensal || 0;
        appState.dadosCalculados.receitaMineracaoMensal = data.receita_mineracao_mensal || 0;
        appState.dadosCalculados.paybackMeses = data.payback_meses || 0;
        appState.dadosCalculados.co2EvitadoKg = data.co2_evitado_kg || 0;
        
        // Exibe resultados
        exibirResultadosCompletos(data);
        openTab('resultados');
        
    } catch (error) {
        console.error('Erro ao calcular viabilidade:', error);
        alert('Erro ao calcular viabilidade. Tente novamente.');
    }
}

function validarDados() {
    if (!appState.estado) {
        alert('Por favor, selecione um estado.');
        return false;
    }
    if (appState.equipamentosSelecionados.length === 0) {
        alert('Por favor, selecione pelo menos um equipamento.');
        return false;
    }
    if (appState.paineisSolaresSelecionados.length === 0) {
        alert('Por favor, selecione pelo menos um painel solar.');
        return false;
    }
    return true;
}

function exibirResultadosCompletos(data) {
    atualizarAbaResultados(data);
}

function mostrarLoading() {
    document.getElementById('recomendacao').innerHTML = `
        <h3>🔄 Calculando Viabilidade</h3>
        <p>Processando dados e realizando cálculos...</p>
    `;
    document.getElementById('detalhes-financeiros').style.display = 'none';
}

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    // Se for para a aba de resultados, garante que está atualizada
    if (tabName === 'resultados') {
        calcularPreviaResultados();
    }
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

/**
 * Função para mostrar cálculos detalhados no final
 */

function mostrarCalculosDetalhados() {
    console.log("=== CÁLCULOS DETALHADOS ===");
    
    // Dados atuais
    console.log("1. DADOS DE ENTRADA:");
    console.log("- Estado:", appState.estado);
    console.log("- Orçamento:", appState.orcamentoTotal);
    console.log("- Custo energia:", parseFloat(document.getElementById('custo-energia').value) || 0.80);
    
    console.log("2. EQUIPAMENTOS:");
    appState.equipamentosSelecionados.forEach((eq, i) => {
        console.log(`  ${i+1}. ${eq.modelo}: ${eq.quantidade}x`);
        console.log(`     Consumo: ${eq.consumo}W cada = ${eq.consumo * eq.quantidade}W total`);
        console.log(`     Custo: R$ ${eq.custo} cada = R$ ${eq.custo * eq.quantidade} total`);
        console.log(`     Hashrate: ${eq.hashrate} TH/s cada = ${eq.hashrate * eq.quantidade} TH/s total`);
    });
    
    console.log("3. PAINÉIS SOLARES:");
    appState.paineisSolaresSelecionados.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.modelo}: ${p.quantidade}x`);
        console.log(`     Potência: ${p.potencia_w}W cada = ${p.potencia_w * p.quantidade}W total`);
        console.log(`     Custo: R$ ${p.preco} cada = R$ ${p.preco * p.quantidade} total`);
    });
    
    console.log("4. CÁLCULOS INTERMEDIÁRIOS:");
    console.log("- Consumo total equipamentos:", appState.dadosCalculados.consumoTotalW, "W");
    console.log("- Consumo mensal:", appState.dadosCalculados.consumoMensalKwh, "kWh");
    console.log("- Custo equipamentos:", appState.dadosCalculados.custoEquipamentos);
    console.log("- Hashrate total:", appState.dadosCalculados.hashrateTotalTH, "TH/s");
    console.log("- Quantidade painéis:", appState.dadosCalculados.quantidadeTotalPaineis);
    console.log("- Potência sistema:", appState.dadosCalculados.potenciaTotalSistemaW, "W");
    console.log("- Custo sistema solar:", appState.dadosCalculados.custoSistemaSolar);
    console.log("- Geração solar estimada:", appState.dadosCalculados.geracaoMensalKwh, "kWh/mês");
    
    // Cálculos manuais para verificar
    const consumoKwh = appState.dadosCalculados.consumoMensalKwh;
    const geracaoKwh = appState.dadosCalculados.geracaoMensalKwh;
    const custoEnergia = parseFloat(document.getElementById('custo-energia').value) || 0.80;
    
    console.log("5. VERIFICAÇÃO MANUAL:");
    console.log("- Cobertura solar:", Math.min((geracaoKwh / consumoKwh) * 100, 100).toFixed(1) + "%");
    console.log("- Economia (se 100% cobertura):", (consumoKwh * custoEnergia).toFixed(2));
    console.log("- Economia (real, se geração < consumo):", (Math.min(geracaoKwh, consumoKwh) * custoEnergia).toFixed(2));
    
    // Estimativa de receita de mineração (simplificada)
    const hashrate = appState.dadosCalculados.hashrateTotalTH;
    const precoBTC = 535345.02;
    const receitaEstimada = (hashrate * 0.0000001 * 30 * precoBTC); // Fórmula antiga
    console.log("- Receita mineração (estimativa): R$", receitaEstimada.toFixed(2));
    
    console.log("=== FIM CÁLCULOS DETALHADOS ===");
}