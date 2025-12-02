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
        'estados': calc.ESTADOS_BRASIL,
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
        
        # Para cada equipamento, multiplicar pelo quantidade
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
    COM CÁLCULOS REVISADOS E CORRIGIDOS
    """
    try:
        data = request.json
        
        # Validações iniciais
        estado = data.get('estado')
        if not estado or estado not in calc.ESTADOS_BRASIL:
            return jsonify({'erro': 'Estado inválido'}), 400

        equipamentos = data.get('equipamentos', [])
        if not equipamentos:
            return jsonify({'erro': 'Nenhum equipamento selecionado'}), 400

        # Parâmetros de entrada
        quantidade_paineis = data.get('quantidade_paineis', 0)
        potencia_painel_w = data.get('potencia_painel', 550)
        custo_energia_kwh = data.get('custo_energia', 0.80)
        custo_sistema_solar = data.get('custo_sistema_solar', 0)
        orcamento_total = data.get('orcamento_total', 0)

        # 1. Cálculo dos equipamentos (COM QUANTIDADE)
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
        
        dados_estado = calc.ESTADOS_BRASIL[estado]
        geracao_solar_kwh = calc.calcular_geracao_solar(
            quantidade_paineis, potencia_painel_w, dados_estado['irradiacao']
        )
        
        cobertura_solar = calc.calcular_cobertura_solar(geracao_solar_kwh, consumo_mensal_kwh)
        economia_mensal = calc.calcular_economia_mensal(
            geracao_solar_kwh, consumo_mensal_kwh, custo_energia_kwh
        )

        # 3. Cálculo de receita de mineração (FÓRMULA REVISADA)
        preco_bitcoin_brl = 535345.02
        receita_mineracao_mensal = calc.calcular_receita_mineracao(
            hashrate_total_th, preco_bitcoin_brl
        )

        # 4. Cálculos financeiros (COM CUSTOS ADICIONAIS)
        investimento_total = custo_equipamentos + custo_sistema_solar
        
        # Custo de energia não coberta (se houver déficit)
        deficit_energia = max(consumo_mensal_kwh - geracao_solar_kwh, 0)
        custo_energia_deficit = deficit_energia * custo_energia_kwh
        
        payback_meses = calc.calcular_payback(
            investimento_total, 
            economia_mensal, 
            receita_mineracao_mensal
        )

        # 5. Cálculos ambientais
        co2_evitado_kg = calc.calcular_co2_evitado(
            min(geracao_solar_kwh, consumo_mensal_kwh),  # Apenas o que foi usado
            dados_estado['fator_emissao']
        )

        # 6. Análise de viabilidade
        viabilidade = calc.analisar_viabilidade(cobertura_solar, payback_meses)

        # 7. Resultado completo COM DETALHES
        resultado = {
            # Dados básicos
            'consumo_total_w': consumo_total_w,
            'custo_equipamentos': custo_equipamentos,
            'hashrate_total_th': hashrate_total_th,
            
            # Energia
            'consumo_mensal_kwh': round(consumo_mensal_kwh, 1),
            'geracao_solar_kwh': round(geracao_solar_kwh, 1),
            'cobertura_solar': round(cobertura_solar, 1),
            'potencia_sistema_kw': round((quantidade_paineis * potencia_painel_w) / 1000, 1),
            
            # Financeiro - DETALHADO
            'economia_mensal': round(economia_mensal, 2),
            'receita_mineracao_mensal': round(receita_mineracao_mensal, 2),
            'custo_energia_deficit': round(custo_energia_deficit, 2),  # NOVO
            'lucro_liquido_mensal': round(receita_mineracao_mensal + economia_mensal - custo_energia_deficit, 2),
            'payback_meses': round(payback_meses, 1),
            'investimento_total': round(investimento_total, 2),
            
            # Detalhes do cálculo
            'detalhes_calculo': {  # NOVO - para transparência
                'energia_solar_utilizada': round(min(geracao_solar_kwh, consumo_mensal_kwh), 1),
                'deficit_energetico': round(deficit_energia, 1),
                'custo_manutencao_mensal': round(investimento_total * 0.0042, 2),
                'preco_bitcoin': preco_bitcoin_brl
            },
            
            # Ambiental
            'co2_evitado_kg': round(co2_evitado_kg, 1),
            
            # Viabilidade
            'viabilidade': viabilidade,
            
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
        
        # CORREÇÃO: Multiplica pelo quantidade de cada equipamento
        consumo_total_w = 0
        custo_equipamentos = 0
        hashrate_total_th = 0
        
        for eq in equipamentos:
            quantidade = eq.get('quantidade', 1)
            consumo_total_w += eq.get('consumo', 0) * quantidade
            custo_equipamentos += eq.get('custo', 0) * quantidade
            hashrate_total_th += eq.get('hashrate', 0) * quantidade
        
        consumo_mensal_kwh = calc.calcular_consumo_mensal(consumo_total_w)
        
        return jsonify({
            'consumo_total_w': consumo_total_w,
            'custo_equipamentos': custo_equipamentos,
            'hashrate_total_th': hashrate_total_th,
            'consumo_mensal_kwh': round(consumo_mensal_kwh, 1)
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
        
        if not estado or estado not in calc.ESTADOS_BRASIL:
            return jsonify({'erro': 'Estado inválido'}), 400
        
        irradiacao = calc.ESTADOS_BRASIL[estado]['irradiacao']
        geracao_solar_kwh = calc.calcular_geracao_solar(
            quantidade_paineis, potencia_painel_w, irradiacao
        )
        potencia_sistema_kw = (quantidade_paineis * potencia_painel_w) / 1000
        
        return jsonify({
            'geracao_solar_kwh': round(geracao_solar_kwh, 1),
            'potencia_sistema_kw': round(potencia_sistema_kw, 1)
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/api/testar-calculos', methods=['POST'])
def testar_calculos():
    """Endpoint para testar cálculos individuais"""
    try:
        data = request.json
        tipo = data.get('tipo')
        
        if tipo == 'equipamentos':
            equipamentos = data.get('equipamentos', [])
            consumo_total = sum(eq.get('consumo', 0) * eq.get('quantidade', 1) for eq in equipamentos)
            return jsonify({
                'consumo_total': consumo_total,
                'quantidade_equipamentos': len(equipamentos),
                'detalhes': equipamentos
            })
        
        elif tipo == 'solar':
            quantidade = data.get('quantidade_paineis', 0)
            potencia = data.get('potencia_painel', 550)
            estado = data.get('estado', 'SP')
            
            if estado in calc.ESTADOS_BRASIL:
                irradiacao = calc.ESTADOS_BRASIL[estado]['irradiacao']
                geracao = calc.calcular_geracao_solar(quantidade, potencia, irradiacao)
                return jsonify({
                    'geracao_kwh': geracao,
                    'irradiacao': irradiacao,
                    'quantidade_paineis': quantidade,
                    'potencia_painel': potencia
                })
        
        return jsonify({'erro': 'Tipo de cálculo não especificado'}), 400
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':

    app.run(debug=True, host='0.0.0.0', port=5000)