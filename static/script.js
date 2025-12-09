// Estado global da aplicação
let appState = {
    estado: '',
    equipamentosSelecionados: [],
    paineisSolaresSelecionados: [],
    dadosCarregados: false,
    orcamentoTotal: 500000,
    equipamentosDisponiveis: null,
    paineisDisponiveis: [],
    tarifasEstados: {},
    
    dadosCalculados: {
        consumoTotalW: 0,
        custoEquipamentos: 0,
        hashrateTotalTH: 0,
        btcMensal: 0,
        consumoMensalKwh: 0,
        consumoDiarioKwh: 0,
        
        quantidadeTotalPaineis: 0,
        potenciaTotalSistemaW: 0,
        custoSistemaSolar: 0,
        geracaoMensalKwh: 0,
        areaTotalM2: 0,
        
        coberturaSolar: 0,
        economiaMensal: 0,
        receitaMineracaoMensal: 0,
        paybackMeses: 0,
        co2EvitadoKg: 0,
        
        detalhesCalculo: {}
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
    // Aba 1: Página inicial
    document.getElementById('info-irradiacao').textContent = '-- kWh/m²/dia';
    document.getElementById('info-tarifa').textContent = 'R$ --/kWh';
    
    // Aba 2: Equipamentos
    document.getElementById('consumo-total').textContent = '0 W';
    document.getElementById('consumo-mensal-equip').textContent = '≈ 0 kWh/mês';
    document.getElementById('custo-equipamentos').textContent = 'R$ 0';
    document.getElementById('hashrate-total').textContent = '0 TH/s';
    document.getElementById('btc-estimado').textContent = '≈ 0 BTC/mês';
    document.getElementById('consumo-diario-kwh').textContent = '0 kWh';
    
    // Orçamento
    document.getElementById('orcamento-display').textContent = 'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('gasto-equipamentos').textContent = 'R$ 0';
    document.getElementById('saldo-disponivel').textContent = 'R$ ' + appState.orcamentoTotal.toLocaleString();
    document.getElementById('percentual-orcamento').textContent = '0%';
    
    // Aba 3: Painéis solares
    document.getElementById('quantidade-total-paineis').textContent = '0 painéis';
    document.getElementById('potencia-total-sistema').textContent = '0 kWp';
    document.getElementById('custo-sistema-solar').textContent = 'R$ 0';
    document.getElementById('area-total-sistema').textContent = '0 m²';
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
    document.getElementById('detalhe-tarifa').textContent = 'R$ 0,000';
    document.getElementById('detalhe-custo-solar').textContent = 'R$ 0';
    document.getElementById('detalhe-custo-energia-total').textContent = 'R$ 0/mês';

}

/**
 * Carrega dados iniciais do backend
 */
async function carregarDadosIniciais() {
    try {
        const response = await fetch('/api/dados-iniciais');
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        
        const data = await response.json();
        preencherEstados(data.estados, data.tarifas);
        appState.equipamentosDisponiveis = data.equipamentos;
        preencherEquipamentos(data.equipamentos);
        appState.paineisDisponiveis = data.paineis_solares;
        preencherPaineisSolares(data.paineis_solares);
        appState.tarifasEstados = data.tarifas;
        
        appState.orcamentoTotal = parseFloat(document.getElementById('orcamento').value) || 500000;
        atualizarDisplayOrcamento();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        throw error;
    }
}

/**
 * Preenche dropdown de estados com formatação organizada
 */
function preencherEstados(estados, tarifas) {
    const select = document.getElementById('estado');
    select.innerHTML = '<option value="">Selecione seu estado</option>';

    for (const [sigla, info] of Object.entries(estados)) {
        const tarifa = tarifas[sigla]?.tarifa ?? 0.80;

        const option = document.createElement('option');
        option.value = sigla;
        
        // Estrutura de string com quebras de linha (\n)
        const nomeEstado = info.nome;
        const infoIrradiacao = `| Irradiação: ${info.irradiacao.toFixed(3)} kWh/m²/dia`;
        const infoTarifa = `| Tarifa: R$ ${tarifa.toFixed(3)}/kWh`;
        
        // O navegador tentará aplicar as quebras de linha.
        // A visualização real dependerá do navegador.
        option.text = `${nomeEstado} (${sigla})\n${infoIrradiacao}\n${infoTarifa}`;
        
        option.dataset.irradiacao = info.irradiacao;
        option.dataset.tarifa = tarifa;
        option.dataset.nome = info.nome;

        select.appendChild(option);
    }
    
    // O CSS deve ser mantido, mas não garante a visualização.
    select.style.cssText = 'white-space: pre-line;';
    
    // **Dica para testes:** Tente adicionar o atributo 'size' (Ex: size="10") no <select> no HTML 
    // ou via JS para que ele seja renderizado como uma lista de rolagem.
}

/**
 * Preenche lista de equipamentos
 */
function preencherEquipamentos(equipamentos) {
    preencherCategoriaEquipamentos('ASIC', equipamentos.ASIC, 'lista-asics');
    preencherCategoriaEquipamentos('GPU', equipamentos.GPU, 'lista-gpus');
}

/**
 * Preenche uma categoria de equipamentos
 */
function preencherCategoriaEquipamentos(tipo, lista, elementoId) {
    const container = document.getElementById(elementoId);
    container.innerHTML = '';
    
    lista.forEach((equipamento, index) => {
        // Calcular consumo mensal
        const consumoMensal = (equipamento.consumo_w * 24 * 30) / 1000;
        
        const div = document.createElement('div');
        div.className = 'equipamento-item';
        div.innerHTML = `
            <div class="equipamento-detalhes">
                <div class="equipamento-info">
                    <strong>${equipamento.modelo}</strong>
                    <small>Fabricante: ${equipamento.fabricante}</small>
                    <small>Consumo: ${equipamento.consumo_w} W 
                        <span class="tooltip">(i)
                            <span class="tooltiptext">
                                W (Watts) = potência instantânea<br>
                                kWh = energia consumida (W × horas)<br>
                                Este equipamento consome ≈ ${consumoMensal.toFixed(1)} kWh/mês
                            </span>
                        </span>
                    </small>
                    <small>Hashrate: ${equipamento.hashrate_th} TH/s</small>
                </div>
                <div class="controle-quantidade">
                    <button onclick="diminuirEquipamento('${tipo}', ${index})" class="diminuir">-</button>
                    <input type="number" id="quantidade-${tipo.toLowerCase()}-${index}" 
                           min="0" value="0" 
                           onchange="atualizarQuantidadeEquipamento('${tipo}', ${index})">
                    <button onclick="aumentarEquipamento('${tipo}', ${index})" class="aumentar">+</button>
                </div>
                <div class="equipamento-preco">
                    <strong>R$ ${equipamento.custo_aproximado.toLocaleString()}</strong><br>
                    <small>cada</small>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * Aumenta quantidade de um equipamento
 */
function aumentarEquipamento(tipo, index) {
    const input = document.getElementById(`quantidade-${tipo.toLowerCase()}-${index}`);
    input.value = parseInt(input.value || 0) + 1;
    atualizarQuantidadeEquipamento(tipo, index);
}

/**
 * Diminui quantidade de um equipamento
 */
function diminuirEquipamento(tipo, index) {
    const input = document.getElementById(`quantidade-${tipo.toLowerCase()}-${index}`);
    const valorAtual = parseInt(input.value || 0);
    if (valorAtual > 0) {
        input.value = valorAtual - 1;
        atualizarQuantidadeEquipamento(tipo, index);
    }
}

/**
 * Atualiza quantidade de um equipamento
 */
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
    
    // Recalcula tudo
    await calcularESincronizarTodosDados();
}

/**
 * Preenche lista de painéis solares
 */
function preencherPaineisSolares(paineis) {
    const container = document.getElementById('lista-paineis');
    container.innerHTML = '';
    
    paineis.forEach((painel, index) => {
        const areaPainel = (painel.largura_m * painel.altura_m).toFixed(2);
        
        const div = document.createElement('div');
        div.className = 'equipamento-item';
        div.innerHTML = `
            <div class="equipamento-detalhes">
                <div class="equipamento-info">
                    <strong>${painel.modelo}</strong>
                    <div class="painel-detalhes">
                        <div class="painel-detalhe">Tipo: ${painel.tipo}</div>
                        <div class="painel-detalhe">Potência: ${painel.potencia_w} Wp</div>
                        <div class="painel-detalhe">Eficiência: ${(painel.eficiencia * 100).toFixed(1)}%</div>
                        <div class="painel-detalhe">Dimensões: ${painel.largura_m}m × ${painel.altura_m}m</div>
                        <div class="painel-detalhe">Área: ${areaPainel} m²</div>
                        <div class="painel-detalhe">Custo/W: R$ ${painel.custo_por_watt.toFixed(2)}</div>
                    </div>
                </div>
                <div class="controle-quantidade">
                    <button onclick="diminuirPainel(${index})" class="diminuir">-</button>
                    <input type="number" id="quantidade-painel-${index}" 
                           min="0" value="0" 
                           onchange="atualizarQuantidadePainel(${index})">
                    <button onclick="aumentarPainel(${index})" class="aumentar">+</button>
                </div>
                <div class="equipamento-preco">
                    <strong>R$ ${painel.preco.toFixed(2)}</strong><br>
                    <small>cada</small>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * Atualiza quantidade de um painel solar
 */
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
    
    // Recalcula tudo
    calcularESincronizarTodosDados();
}

/**
 * Aumenta quantidade de um painel
 */
function aumentarPainel(index) {
    const input = document.getElementById(`quantidade-painel-${index}`);
    input.value = parseInt(input.value || 0) + 1;
    atualizarQuantidadePainel(index);
}

/**
 * Diminui quantidade de um painel
 */
function diminuirPainel(index) {
    const input = document.getElementById(`quantidade-painel-${index}`);
    const valorAtual = parseInt(input.value || 0);
    if (valorAtual > 0) {
        input.value = valorAtual - 1;
        atualizarQuantidadePainel(index);
    }
}

/**
 * Configura event listeners
 */
function configurarEventListeners() {
    // Estado
    document.getElementById('estado').addEventListener('change', function() {
        appState.estado = this.value;
        const selectedOption = this.options[this.selectedIndex];
        const irradiacao = selectedOption.getAttribute('data-irradiacao');
        const tarifa = selectedOption.getAttribute('data-tarifa');
        
        if (appState.estado) {
            document.getElementById('card-estado').style.display = 'block';
            document.getElementById('info-irradiacao').textContent = irradiacao + ' kWh/m²/dia';
            document.getElementById('info-tarifa').textContent = 'R$ ' + parseFloat(tarifa).toFixed(3) + '/kWh';
        } else {
            document.getElementById('card-estado').style.display = 'none';
        }
        
        // Recalcula tudo quando muda o estado
        calcularESincronizarTodosDados();
    });
    
    // Orçamento total
    document.getElementById('orcamento').addEventListener('input', function() {
        appState.orcamentoTotal = parseFloat(this.value) || 0;
        atualizarDisplayOrcamento();
        calcularESincronizarTodosDados();
    });
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
}

/**
 * Calcula dados dos equipamentos
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
    appState.dadosCalculados.consumoDiarioKwh = (consumoTotal * 24) / 1000;
    
    // Calcula BTC mensal estimado (fórmula simplificada)
    const hashrateRedeTotal = 500000000; // 500 EH/s em TH/s
    const recompensaDiariaBTC = 3.125 * 144; // 3.125 BTC/bloco * 144 blocos/dia
    const participacao = hashrateTotal / hashrateRedeTotal;
    appState.dadosCalculados.btcMensal = participacao * recompensaDiariaBTC * 30;
    
    // Calcula no backend para precisão
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
            appState.dadosCalculados.consumoTotalW = data.consumo_total_w;
            appState.dadosCalculados.custoEquipamentos = data.custo_equipamentos;
            appState.dadosCalculados.hashrateTotalTH = data.hashrate_total_th;
            appState.dadosCalculados.consumoMensalKwh = data.consumo_mensal_kwh;
            appState.dadosCalculados.consumoDiarioKwh = data.consumo_diario_kwh || appState.dadosCalculados.consumoDiarioKwh;
        }
    } catch (error) {
        console.error('Erro ao calcular equipamentos no backend:', error);
    }
}

/**
 * Calcula dados dos painéis solares
 */
async function calcularDadosPainéisSolares() {
    // Cálculo local
    let quantidadeTotal = 0;
    let potenciaTotal = 0;
    let custoTotal = 0;
    let areaTotal = 0;
    
    appState.paineisSolaresSelecionados.forEach(painel => {
        const quantidade = painel.quantidade || 0;
        quantidadeTotal += quantidade;
        potenciaTotal += (painel.potencia_w || 0) * quantidade;
        custoTotal += (painel.preco || 0) * quantidade;
        areaTotal += (painel.largura_m || 0) * (painel.altura_m || 0) * quantidade;
    });
    
    // Armazena nos dados calculados
    appState.dadosCalculados.quantidadeTotalPaineis = quantidadeTotal;
    appState.dadosCalculados.potenciaTotalSistemaW = potenciaTotal;
    appState.dadosCalculados.custoSistemaSolar = custoTotal;
    appState.dadosCalculados.areaTotalM2 = areaTotal;
    
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
                appState.dadosCalculados.areaTotalM2 = data.area_total_m2 || areaTotal;
            }
        } catch (error) {
            console.error('Erro ao calcular geração solar:', error);
            // Cálculo local aproximado
            appState.dadosCalculados.geracaoMensalKwh = (potenciaTotal / 1000) * 4.5 * 30 * 0.85;
        }
    } else {
        appState.dadosCalculados.geracaoMensalKwh = 0;
    }
}

/**
 * Atualiza TODOS os displays
 */
function atualizarTodosDisplays() {
    // Aba 2: Equipamentos
    document.getElementById('consumo-total').textContent = 
        appState.dadosCalculados.consumoTotalW.toLocaleString() + ' W';
    document.getElementById('consumo-mensal-equip').textContent = 
        '≈ ' + appState.dadosCalculados.consumoMensalKwh.toFixed(1) + ' kWh/mês';
    document.getElementById('custo-equipamentos').textContent = 
        'R$ ' + appState.dadosCalculados.custoEquipamentos.toLocaleString();
    document.getElementById('hashrate-total').textContent = 
        appState.dadosCalculados.hashrateTotalTH.toLocaleString('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }) + ' TH/s';
    document.getElementById('btc-estimado').textContent = 
        '≈ ' + appState.dadosCalculados.btcMensal.toFixed(6) + ' BTC/mês';
    document.getElementById('consumo-diario-kwh').textContent = 
        appState.dadosCalculados.consumoDiarioKwh.toFixed(1) + ' kWh';
    
    // Aba 3: Painéis solares
    document.getElementById('quantidade-total-paineis').textContent = 
        appState.dadosCalculados.quantidadeTotalPaineis + ' painéis';
    document.getElementById('potencia-total-sistema').textContent = 
        (appState.dadosCalculados.potenciaTotalSistemaW / 1000).toFixed(2) + ' kWp';
    document.getElementById('custo-sistema-solar').textContent = 
        'R$ ' + appState.dadosCalculados.custoSistemaSolar.toLocaleString();
    document.getElementById('area-total-sistema').textContent = 
        appState.dadosCalculados.areaTotalM2.toFixed(1) + ' m²';
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
    const maxValor = Math.max(consumo, geracao, 1);
    
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
 * Atualiza orçamentos
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
        alertaEquipamentos.style.padding = '1rem';
        alertaEquipamentos.style.borderRadius = '8px';
    } else if (percentualEquipamentos > 80) {
        alertaEquipamentos.innerHTML = `<span style="color: #f39c12;">⚠️ Cuidado: Você já utilizou ${percentualEquipamentos.toFixed(1)}% do orçamento</span>`;
        alertaEquipamentos.style.display = 'block';
        alertaEquipamentos.style.backgroundColor = '#fff3cd';
        alertaEquipamentos.style.padding = '1rem';
        alertaEquipamentos.style.borderRadius = '8px';
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
        alertaTotal.style.padding = '1rem';
        alertaTotal.style.borderRadius = '8px';
    } else if (gastoTotal / appState.orcamentoTotal > 0.9) {
        alertaTotal.innerHTML = `<span style="color: #f39c12;">⚠️ Cuidado: 90% do orçamento utilizado</span>`;
        alertaTotal.style.display = 'block';
        alertaTotal.style.backgroundColor = '#fff3cd';
        alertaTotal.style.padding = '1rem';
        alertaTotal.style.borderRadius = '8px';
    } else {
        alertaTotal.style.display = 'none';
    }
}

/**
 * Atualiza display do orçamento
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

/**
 * Inicia simulação
 */
function iniciarSimulacao() {
    if (!appState.estado) {
        alert('Por favor, selecione um estado primeiro.');
        return;
    }
    
    if (appState.orcamentoTotal <= 0) {
        alert('Por favor, informe um orçamento válido (maior que zero).');
        return;
    }
    
    openTab('montar-estacao');
}

/**
 * Avança para energia solar
 */
function avancarParaEnergiaSolar() {
    if (appState.equipamentosSelecionados.length === 0) {
        alert('Por favor, selecione pelo menos um equipamento antes de avançar.');
        return;
    }
    
    // Verifica se algum equipamento foi realmente selecionado (quantidade > 0)
    const equipamentosValidos = appState.equipamentosSelecionados.some(eq => eq.quantidade > 0);
    if (!equipamentosValidos) {
        alert('Por favor, selecione pelo menos um equipamento (quantidade maior que zero).');
        return;
    }
    
    openTab('energia-solar');
}

/**
 * Calcula viabilidade completa
 */
async function calcularViabilidadeCompleta() {
    if (!validarDados()) return;
    
    try {
        mostrarLoading();
        
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
                custo_sistema_solar: appState.dadosCalculados.custoSistemaSolar,
                orcamento_total: appState.orcamentoTotal
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro no servidor');
        }
        
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
        appState.dadosCalculados.btcMensal = data.btc_mensal || 0;
        appState.dadosCalculados.detalhesCalculo = data.detalhes_calculo || {};
        
        // Exibe resultados
        exibirResultadosCompletos(data);
        openTab('resultados');
        
    } catch (error) {
        console.error('Erro ao calcular viabilidade:', error);
        alert('Erro ao calcular viabilidade: ' + error.message);
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
    
    // Verifica se algum equipamento foi realmente selecionado (quantidade > 0)
    const equipamentosValidos = appState.equipamentosSelecionados.some(eq => eq.quantidade > 0);
    if (!equipamentosValidos) {
        alert('Por favor, selecione pelo menos um equipamento (quantidade maior que zero).');
        return false;
    }
    
    if (appState.paineisSolaresSelecionados.length === 0) {
        alert('Por favor, selecione pelo menos um painel solar.');
        return false;
    }
    
    // Verifica se algum painel foi realmente selecionado (quantidade > 0)
    const paineisValidos = appState.paineisSolaresSelecionados.some(p => p.quantidade > 0);
    if (!paineisValidos) {
        alert('Por favor, selecione pelo menos um painel solar (quantidade maior que zero).');
        return false;
    }
    
    if (appState.orcamentoTotal <= 0) {
        alert('Por favor, informe um orçamento válido (maior que zero).');
        return false;
    }
    
    return true;
}

/**
 * Exibe resultados completos
 */
function exibirResultadosCompletos(data) {
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
    
    // Detalhes financeiros
    const detalhes = document.getElementById('detalhes-financeiros');
    detalhes.style.display = 'block';
    
    document.getElementById('detalhe-receita').textContent = 
        'R$ ' + (data.receita_mineracao_mensal || 0).toFixed(2) + '/mês';
    document.getElementById('detalhe-investimento').textContent = 
        'R$ ' + (data.investimento_total || 0).toLocaleString();
    document.getElementById('detalhe-bitcoin').textContent = 
        'R$ ' + (data.preco_bitcoin_brl || 0).toLocaleString();
    document.getElementById('detalhe-tarifa').textContent = 
        'R$ ' + (data.custo_energia_kwh || 0).toFixed(3);
    document.getElementById('detalhe-custo-solar').textContent = 
        'R$ ' + (data.custo_sistema_solar || 0).toLocaleString();
    document.getElementById('detalhe-custo-energia-total').textContent = 
        'R$ ' + (data.custo_energia_total_sem_solar || 0).toFixed(2) + '/mês';
    
    // Explicação dos cálculos
    const explicacao = document.getElementById('explicacao-conteudo');
    if (data.detalhes_calculo) {
        const btcMensal = data.btc_mensal || 0;
        const precoBTC = data.preco_bitcoin_brl || 507647.02;
        
        explicacao.innerHTML = `
            <p style="font-size: 0.9rem; color: #5a6268; margin-bottom: 0.5rem;">
                <strong>Receita de Mineração:</strong><br>
                • Seu hashrate: ${appState.dadosCalculados.hashrateTotalTH.toFixed(2)} TH/s<br>
                • Hashrate total da rede: 500.000.000 TH/s (500 EH/s)<br>
                • Participação: ${(appState.dadosCalculados.hashrateTotalTH / 500000000 * 100).toFixed(6)}%<br>
                • Recompensa por bloco: 3.125 BTC × 144 blocos/dia = 450 BTC/dia<br>
                • Sua parte: ${btcMensal.toFixed(6)} BTC/mês × R$ ${precoBTC.toLocaleString()} = R$ ${data.receita_mineracao_mensal.toFixed(2)}/mês
            </p>
            <p style="font-size: 0.9rem; color: #5a6268; margin-bottom: 0.5rem;">
                <strong>Cálculo do Payback:</strong><br>
                • Investimento total: R$ ${data.investimento_total.toLocaleString()}<br>
                • Receita mensal: R$ ${data.receita_mineracao_mensal.toFixed(2)}<br>
                • Economia energia: R$ ${data.economia_mensal.toFixed(2)}<br>
                • Custo manutenção: R$ ${(data.detalhes_calculo.custo_manutencao_mensal || 0).toFixed(2)}<br>
                • Lucro líquido: R$ ${(data.receita_mineracao_mensal + data.economia_mensal - (data.detalhes_calculo.custo_manutencao_mensal || 0)).toFixed(2)}/mês<br>
                • Payback: ${data.investimento_total.toLocaleString()} ÷ ${(data.receita_mineracao_mensal + data.economia_mensal - (data.detalhes_calculo.custo_manutencao_mensal || 0)).toFixed(2)} = ${data.payback_meses.toFixed(1)} meses
            </p>
        `;
    }
}

/**
 * Mostra loading
 */
function mostrarLoading() {
    const explicacao = document.getElementById('explicacao-conteudo');
    explicacao.innerHTML = `
        <p style="font-size: 0.9rem; color: #5a6268; text-align: center;">
            <i class="fas fa-spinner fa-spin"></i> Calculando resultados...
        </p>
    `;
}

/**
 * Nova simulação - zera todos os dados
 */
function novaSimulacao() {
    // Limpa estado
    appState.estado = '';
    appState.equipamentosSelecionados = [];
    appState.paineisSolaresSelecionados = [];
    appState.orcamentoTotal = 500000;
    
    // Limpa dados calculados
    appState.dadosCalculados = {
        consumoTotalW: 0,
        custoEquipamentos: 0,
        hashrateTotalTH: 0,
        btcMensal: 0,
        consumoMensalKwh: 0,
        consumoDiarioKwh: 0,
        
        quantidadeTotalPaineis: 0,
        potenciaTotalSistemaW: 0,
        custoSistemaSolar: 0,
        geracaoMensalKwh: 0,
        areaTotalM2: 0,
        
        coberturaSolar: 0,
        economiaMensal: 0,
        receitaMineracaoMensal: 0,
        paybackMeses: 0,
        co2EvitadoKg: 0,
        
        detalhesCalculo: {}
    };
    
    // Limpa formulários
    document.getElementById('estado').value = '';
    document.getElementById('orcamento').value = '500000';
    document.getElementById('card-estado').style.display = 'none';
    
    // Limpa todas as quantidades de equipamentos
    if (appState.equipamentosDisponiveis) {
        const tipos = ['ASIC', 'GPU'];
        tipos.forEach(tipo => {
            if (appState.equipamentosDisponiveis[tipo]) {
                appState.equipamentosDisponiveis[tipo].forEach((equipamento, index) => {
                    const input = document.getElementById(`quantidade-${tipo.toLowerCase()}-${index}`);
                    if (input) input.value = '0';
                });
            }
        });
    }
    
    // Limpa todas as quantidades de painéis
    appState.paineisDisponiveis.forEach((painel, index) => {
        const input = document.getElementById(`quantidade-painel-${index}`);
        if (input) input.value = '0';
    });
    
    // Atualiza displays
    inicializarDisplays();
    
    // Volta para página inicial
    openTab('pagina-inicial');
    
    alert('Nova simulação iniciada! Todos os dados foram zerados.');
}

/**
 * Abre uma aba específica
 */
function openTab(tabName) {
    // Remove a classe active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove a classe active de todos os botões
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Adiciona a classe active à aba selecionada
    document.getElementById(tabName).classList.add('active');
    
    // Adiciona a classe active ao botão correspondente
    const buttons = document.querySelectorAll('.tab-button');
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].textContent.includes(tabName.replace('-', ' '))) {
            buttons[i].classList.add('active');
            break;
        }
    }
    
    // Rola para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
}