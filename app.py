from flask import Flask, render_template, jsonify, request
from calculadora import CalculadoraBitcoin
from datetime import datetime

app = Flask(__name__)
calc = CalculadoraBitcoin()

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/dados-iniciais')
def dados_iniciais():
    """Retorna todos os dados iniciais para o frontend"""
    return jsonify({
        'estados': calc.IRRACIACAO_E_EMISSAO_POR_ESTADO,
        'tarifas': calc.TARIFAS_POR_ESTADO,
        'equipamentos': calc.EQUIPAMENTOS,
        'paineis_solares': calc.get_paineis_solares()
    })

@app.route('/api/calcular-orcamento-equipamentos', methods=['POST'])
def calcular_orcamento_equipamentos():
    """Calcula orçamento apenas para equipamentos"""
    try:
        data = request.json
        
        orcamento_total = float(data.get('orcamento_total', 0))
        equipamentos = data.get('equipamentos', [])
        
        custo_equipamentos = 0
        for equip in equipamentos:
            quantidade = equip.get('quantidade', 1)
            custo_equipamentos += equip['custo'] * quantidade
        
        saldo = orcamento_total - custo_equipamentos
        
        return jsonify({
            'custo_equipamentos': round(custo_equipamentos, 2),
            'saldo_equipamentos': round(saldo, 2),
            'ultrapassou_equipamentos': saldo < 0,
            'percentual_equipamentos': round((custo_equipamentos / orcamento_total * 100) if orcamento_total > 0 else 0, 1)
        })
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/api/calcular-viabilidade-completa', methods=['POST'])
def calcular_viabilidade_completa():
    """
    Endpoint principal que calcula TODOS os aspectos do projeto
    """
    try:
        data = request.json
        
        # Validações iniciais
        estado = data.get('estado')
        if not estado or estado not in calc.IRRACIACAO_E_EMISSAO_POR_ESTADO:
            return jsonify({'erro': 'Estado inválido'}), 400

        equipamentos = data.get('equipamentos', [])
        if not equipamentos:
            return jsonify({'erro': 'Nenhum equipamento selecionado'}), 400

        # Parâmetros de entrada
        quantidade_paineis = data.get('quantidade_paineis', 0)
        potencia_painel_w = data.get('potencia_painel', 550)
        custo_sistema_solar = data.get('custo_sistema_solar', 0)
        orcamento_total = data.get('orcamento_total', 0)
        
        # Usar tarifa do estado
        if estado in calc.TARIFAS_POR_ESTADO:
            custo_energia_kwh = calc.TARIFAS_POR_ESTADO[estado]['tarifa']
        else:
            custo_energia_kwh = 0.80

        # 1. Cálculo dos equipamentos
        consumo_total_w = 0
        custo_equipamentos = 0
        hashrate_total_th = 0
        
        for eq in equipamentos:
            quantidade = eq.get('quantidade', 1)
            consumo_total_w += eq.get('consumo', 0) * quantidade
            custo_equipamentos += eq.get('custo', 0) * quantidade
            hashrate_total_th += eq.get('hashrate', 0) * quantidade

        # 2. Cálculos energéticos
        consumo_mensal_kwh = calc.calcular_consumo_mensal(consumo_total_w)
        
        dados_estado = calc.IRRACIACAO_E_EMISSAO_POR_ESTADO[estado]
        geracao_solar_kwh = calc.calcular_geracao_solar(
            quantidade_paineis, potencia_painel_w, dados_estado['irradiacao']
        )
        
        cobertura_solar = calc.calcular_cobertura_solar(geracao_solar_kwh, consumo_mensal_kwh)
        economia_mensal = calc.calcular_economia_mensal(
            geracao_solar_kwh, consumo_mensal_kwh, custo_energia_kwh
        )

        # 3. Cálculo de receita de mineração
        preco_bitcoin_brl = 535345.02
        receita_mineracao_mensal = calc.calcular_receita_mineracao(
            hashrate_total_th, preco_bitcoin_brl
        )
        
        # Calcular BTC mensal
        btc_mensal = calc.calcular_btc_mensal(hashrate_total_th)

        # 4. Cálculos financeiros
        investimento_total = custo_equipamentos + custo_sistema_solar
        
        # Custo de energia não coberta
        deficit_energia = max(consumo_mensal_kwh - geracao_solar_kwh, 0)
        custo_energia_deficit = deficit_energia * custo_energia_kwh
        
        # Custo de energia total SEM sistema solar (para comparação)
        custo_energia_total_sem_solar = consumo_mensal_kwh * custo_energia_kwh

        # Custo de manutenção mensal
        custo_manutencao_mensal = investimento_total * 0.0042

        # Payback
        payback_meses = calc.calcular_payback(
            investimento_total, 
            economia_mensal, 
            custo_energia_deficit,
            receita_mineracao_mensal
        )

        # 5. Cálculos ambientais
        co2_evitado_kg = calc.calcular_co2_evitado(
            min(geracao_solar_kwh, consumo_mensal_kwh),
            dados_estado['fator_emissao']
        )
        
        # 6. Cálculo de área ocupada pelos painéis
        area_total_m2 = calc.calcular_area_total_paineis(
            quantidade_paineis, potencia_painel_w
        )

        # 7. Resultado completo
        resultado = {
            # Dados básicos
            'consumo_total_w': consumo_total_w,
            'custo_equipamentos': custo_equipamentos,
            'hashrate_total_th': hashrate_total_th,
            'btc_mensal': btc_mensal,
            
            # Energia
            'consumo_mensal_kwh': round(consumo_mensal_kwh, 1),
            'geracao_solar_kwh': round(geracao_solar_kwh, 1),
            'cobertura_solar': round(cobertura_solar, 1),
            'potencia_sistema_kw': round((quantidade_paineis * potencia_painel_w) / 1000, 1),
            'area_total_m2': round(area_total_m2, 1),
            
            # Financeiro
            'economia_mensal': round(economia_mensal, 2),
            'receita_mineracao_mensal': round(receita_mineracao_mensal, 2),
            'custo_energia_deficit': round(custo_energia_deficit, 2),
            'custo_energia_total_sem_solar': round(custo_energia_total_sem_solar, 2),
            'custo_manutencao_mensal': round(custo_manutencao_mensal, 2),
            'lucro_liquido_mensal': round(receita_mineracao_mensal + economia_mensal - custo_energia_deficit - custo_manutencao_mensal, 2),
            'payback_meses': round(payback_meses, 1),
            'investimento_total': round(investimento_total, 2),
            'custo_energia_kwh': round(custo_energia_kwh, 3),
            'custo_sistema_solar': round(custo_sistema_solar, 2),
            
            # Detalhes do cálculo
            'detalhes_calculo': {
                'hashrate_rede_total': 500000000,  # 500 EH/s em TH/s
                'recompensa_por_bloco': 3.125,
                'blocos_por_dia': 144,
                'preco_bitcoin': preco_bitcoin_brl,
                'deficit_energetico': round(deficit_energia, 1),
                'custo_manutencao_mensal': round(custo_manutencao_mensal, 2)
            },
            
            # Ambiental
            'co2_evitado_kg': round(co2_evitado_kg, 1),
            
            # Metadados
            'preco_bitcoin_brl': preco_bitcoin_brl,
            'timestamp': datetime.now().isoformat()
        }

        return jsonify(resultado)

    except Exception as e:
        print(f"Erro no cálculo de viabilidade: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'erro': f'Erro interno no servidor: {str(e)}'}), 500

@app.route('/api/verificar-orcamento', methods=['POST'])
def verificar_orcamento():
    """Verifica se o orçamento está sendo ultrapassado"""
    try:
        data = request.json
        
        orcamento_total = float(data.get('orcamento_total', 0))
        custo_equipamentos = float(data.get('custo_equipamentos', 0))
        custo_sistema_solar = float(data.get('custo_sistema_solar', 0))
        
        investimento_total = custo_equipamentos + custo_sistema_solar
        saldo = orcamento_total - investimento_total
        
        return jsonify({
            'orcamento_total': orcamento_total,
            'investimento_total': round(investimento_total, 2),
            'saldo': round(saldo, 2),
            'ultrapassou': saldo < 0,
            'percentual_utilizado': round((investimento_total / orcamento_total * 100) if orcamento_total > 0 else 0, 1)
        })
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/api/simular-equipamentos', methods=['POST'])
def simular_equipamentos():
    """Calcula dados dos equipamentos selecionados"""
    try:
        data = request.json
        equipamentos = data.get('equipamentos', [])
        
        consumo_total_w = 0
        custo_equipamentos = 0
        hashrate_total_th = 0
        
        for eq in equipamentos:
            quantidade = eq.get('quantidade', 1)
            consumo_total_w += eq.get('consumo', 0) * quantidade
            custo_equipamentos += eq.get('custo', 0) * quantidade
            hashrate_total_th += eq.get('hashrate', 0) * quantidade
        
        consumo_mensal_kwh = calc.calcular_consumo_mensal(consumo_total_w)
        consumo_diario_kwh = (consumo_total_w * 24) / 1000
        
        return jsonify({
            'consumo_total_w': consumo_total_w,
            'custo_equipamentos': custo_equipamentos,
            'hashrate_total_th': hashrate_total_th,
            'consumo_mensal_kwh': round(consumo_mensal_kwh, 1),
            'consumo_diario_kwh': round(consumo_diario_kwh, 1)
        })
    except Exception as e:
        print(f"Erro em simular-equipamentos: {e}")
        return jsonify({'erro': str(e)}), 500

@app.route('/api/simular-solar', methods=['POST'])
def simular_solar():
    """Calcula dados do sistema solar"""
    try:
        data = request.json
        
        quantidade_paineis = data.get('quantidade_paineis', 0)
        potencia_painel_w = data.get('potencia_painel', 550)
        estado = data.get('estado')
        
        if not estado or estado not in calc.IRRACIACAO_E_EMISSAO_POR_ESTADO:
            return jsonify({'erro': 'Estado inválido'}), 400
        
        irradiacao = calc.IRRACIACAO_E_EMISSAO_POR_ESTADO[estado]['irradiacao']
        
        # Calcular usando a classe
        geracao_solar_kwh = calc.calcular_geracao_solar(
            quantidade_paineis, potencia_painel_w, irradiacao
        )
        
        # Calcular área total
        area_total_m2 = calc.calcular_area_total_paineis(
            quantidade_paineis, potencia_painel_w
        )
        
        potencia_sistema_kw = (quantidade_paineis * potencia_painel_w) / 1000
        
        return jsonify({
            'geracao_solar_kwh': round(geracao_solar_kwh, 1),
            'potencia_sistema_kw': round(potencia_sistema_kw, 1),
            'area_total_m2': round(area_total_m2, 1),
            'irradiacao': irradiacao
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)