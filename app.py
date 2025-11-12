from flask import Flask, render_template, jsonify, request
from calculadora import CalculadoraBitcoin
import requests
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
        'equipamentos': calc.EQUIPAMENTOS
    })

@app.route('/api/bitcoin-price')
def get_bitcoin_price():
    """Busca cotação atual do Bitcoin"""
    try:
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl', 
            timeout=5
        )
        data = response.json()
        return jsonify({'preco_brl': data['bitcoin']['brl']})
    except Exception as e:
        print(f"Erro ao buscar preço Bitcoin: {e}")
        return jsonify({'preco_brl': 180000})  # Fallback

@app.route('/api/calcular-viabilidade-completa', methods=['POST'])
def calcular_viabilidade_completa():
    """
    Endpoint principal que calcula TODOS os aspectos do projeto
    Toda a lógica de cálculo está em Python
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

        # 1. Cálculo dos equipamentos
        consumo_total_w = sum(eq['consumo'] for eq in equipamentos)
        custo_equipamentos = sum(eq['custo'] for eq in equipamentos)
        hashrate_total_th = sum(eq['hashrate'] for eq in equipamentos)

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

        # 3. Cálculo de receita de mineração
        preco_bitcoin_response = get_bitcoin_price()
        preco_bitcoin_brl = preco_bitcoin_response.json['preco_brl']
        receita_mineracao_mensal = calc.calcular_receita_mineracao(
            hashrate_total_th, preco_bitcoin_brl
        )

        # 4. Cálculos financeiros
        investimento_total = custo_equipamentos + custo_sistema_solar
        payback_meses = calc.calcular_payback(
            investimento_total, economia_mensal, receita_mineracao_mensal
        )

        # 5. Cálculos ambientais
        co2_evitado_kg = calc.calcular_co2_evitado(
            geracao_solar_kwh, dados_estado['fator_emissao']
        )

        # 6. Análise de viabilidade
        viabilidade = calc.analisar_viabilidade(cobertura_solar, payback_meses)

        # 7. Resultado completo
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
            
            # Financeiro
            'economia_mensal': round(economia_mensal, 2),
            'receita_mineracao_mensal': round(receita_mineracao_mensal, 2),
            'lucro_total_mensal': round(economia_mensal + receita_mineracao_mensal, 2),
            'payback_meses': round(payback_meses, 1),
            'investimento_total': round(investimento_total, 2),
            
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
        return jsonify({'erro': f'Erro interno no servidor: {str(e)}'}), 500

@app.route('/api/simular-equipamentos', methods=['POST'])
def simular_equipamentos():
    """Calcula dados dos equipamentos selecionados"""
    try:
        data = request.json
        equipamentos = data.get('equipamentos', [])
        
        consumo_total_w = sum(eq['consumo'] for eq in equipamentos)
        custo_equipamentos = sum(eq['custo'] for eq in equipamentos)
        hashrate_total_th = sum(eq['hashrate'] for eq in equipamentos)
        consumo_mensal_kwh = calc.calcular_consumo_mensal(consumo_total_w)
        
        return jsonify({
            'consumo_total_w': consumo_total_w,
            'custo_equipamentos': custo_equipamentos,
            'hashrate_total_th': hashrate_total_th,
            'consumo_mensal_kwh': round(consumo_mensal_kwh, 1)
        })
    except Exception as e:
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)