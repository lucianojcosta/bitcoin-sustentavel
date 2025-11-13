"""
Módulo com toda a lógica de cálculos do projeto
"""

class CalculadoraBitcoin:
    """
    Classe principal para todos os cálculos do projeto
    Implementa os cálculos descritos na especificação
    """
    
    # Dados dos estados brasileiros com irradiação solar média (kWh/m²/dia)
    # Fonte: Atlas Solar Brasileiro (INPE)
    ESTADOS_BRASIL = {
        "AC": {"nome": "Acre", "irradiacao": 5.223232, "fator_emissao": 0.08},
        "AL": {"nome": "Alagoas", "irradiacao": 5.8, "fator_emissao": 0.12},
        "AP": {"nome": "Amapá", "irradiacao": 5.1, "fator_emissao": 0.07},
        "AM": {"nome": "Amazonas", "irradiacao": 4.8, "fator_emissao": 0.06},
        "BA": {"nome": "Bahia", "irradiacao": 5.7, "fator_emissao": 0.11},
        "CE": {"nome": "Ceará", "irradiacao": 5.9, "fator_emissao": 0.13},
        "DF": {"nome": "Distrito Federal", "irradiacao": 5.5, "fator_emissao": 0.09},
        "ES": {"nome": "Espírito Santo", "irradiacao": 5.3, "fator_emissao": 0.10},
        "GO": {"nome": "Goiás", "irradiacao": 5.4, "fator_emissao": 0.09},
        "MA": {"nome": "Maranhão", "irradiacao": 5.4, "fator_emissao": 0.08},
        "MT": {"nome": "Mato Grosso", "irradiacao": 5.3, "fator_emissao": 0.07},
        "MS": {"nome": "Mato Grosso do Sul", "irradiacao": 5.2, "fator_emissao": 0.08},
        "MG": {"nome": "Minas Gerais", "irradiacao": 5.3, "fator_emissao": 0.10},
        "PA": {"nome": "Pará", "irradiacao": 4.9, "fator_emissao": 0.06},
        "PB": {"nome": "Paraíba", "irradiacao": 5.8, "fator_emissao": 0.12},
        "PR": {"nome": "Paraná", "irradiacao": 4.7, "fator_emissao": 0.14},
        "PE": {"nome": "Pernambuco", "irradiacao": 5.7, "fator_emissao": 0.12},
        "PI": {"nome": "Piauí", "irradiacao": 5.6, "fator_emissao": 0.11},
        "RJ": {"nome": "Rio de Janeiro", "irradiacao": 5.1, "fator_emissao": 0.15},
        "RN": {"nome": "Rio Grande do Norte", "irradiacao": 5.9, "fator_emissao": 0.13},
        "RS": {"nome": "Rio Grande do Sul", "irradiacao": 4.5, "fator_emissao": 0.16},
        "RO": {"nome": "Rondônia", "irradiacao": 5.0, "fator_emissao": 0.07},
        "RR": {"nome": "Roraima", "irradiacao": 5.1, "fator_emissao": 0.06},
        "SC": {"nome": "Santa Catarina", "irradiacao": 4.6, "fator_emissao": 0.15},
        "SP": {"nome": "São Paulo", "irradiacao": 4.9, "fator_emissao": 0.14},
        "SE": {"nome": "Sergipe", "irradiacao": 5.7, "fator_emissao": 0.12},
        "TO": {"nome": "Tocantins", "irradiacao": 5.4, "fator_emissao": 0.08}
    }

    # Equipamentos de mineração (dados baseados em fabricantes)
    # Fontes: Bitmain, MicroBT, Canaan, NVIDIA, AMD
    EQUIPAMENTOS = {
        "GPU": [
            {
                "modelo": "NVIDIA RTX 4090", 
                "consumo_w": 450, 
                "hashrate_th": 0.00012, 
                "custo_aproximado": 12000, 
                "fabricante": "NVIDIA",
                "tipo": "GPU"
            },
            {
                "modelo": "NVIDIA RTX 4080", 
                "consumo_w": 320, 
                "hashrate_th": 0.00009, 
                "custo_aproximado": 8500, 
                "fabricante": "NVIDIA",
                "tipo": "GPU"
            },
            {
                "modelo": "AMD RX 7900 XTX", 
                "consumo_w": 355, 
                "hashrate_th": 0.00008, 
                "custo_aproximado": 7500, 
                "fabricante": "AMD",
                "tipo": "GPU"
            },
        ],
        "ASIC": [
            {
                "modelo": "Bitmain Antminer S19 XP", 
                "consumo_w": 3010, 
                "hashrate_th": 140, 
                "custo_aproximado": 25000, 
                "fabricante": "Bitmain",
                "tipo": "ASIC"
            },
            {
                "modelo": "Bitmain Antminer S19 Pro", 
                "consumo_w": 3250, 
                "hashrate_th": 110, 
                "custo_aproximado": 18000, 
                "fabricante": "Bitmain",
                "tipo": "ASIC"
            },
            {
                "modelo": "MicroBT Whatsminer M50", 
                "consumo_w": 3300, 
                "hashrate_th": 118, 
                "custo_aproximado": 22000, 
                "fabricante": "MicroBT",
                "tipo": "ASIC"
            },
            {
                "modelo": "Canaan Avalon Miner 1246", 
                "consumo_w": 3420, 
                "hashrate_th": 90, 
                "custo_aproximado": 15000, 
                "fabricante": "Canaan",
                "tipo": "ASIC"
            },
        ]
    }

    @staticmethod
    def calcular_consumo_mensal(consumo_total_w):
        """
        Calcula consumo mensal em kWh
        Fórmula: Consumo Mensal = Soma(consumo componentes) × 24h × 30dias / 1000
        """
        return (consumo_total_w * 24 * 30) / 1000

    @staticmethod
    def calcular_geracao_solar(quantidade_paineis, potencia_painel_w, irradiacao, eficiencia=0.85):
        """
        Calcula geração solar mensal em kWh
        Fórmula: Geração Solar = Painéis × Potência × HorasSol/dia × 30dias × Eficiência
        """
        potencia_sistema_kw = (quantidade_paineis * potencia_painel_w) / 1000
        return potencia_sistema_kw * irradiacao * 30 * eficiencia

    @staticmethod
    def calcular_cobertura_solar(geracao_solar_kwh, consumo_mensal_kwh):
        """
        Calcula porcentagem de cobertura solar
        """
        if consumo_mensal_kwh == 0:
            return 0
        return min((geracao_solar_kwh / consumo_mensal_kwh) * 100, 100)

    @staticmethod
    def calcular_economia_mensal(geracao_solar_kwh, consumo_mensal_kwh, custo_energia_kwh):
        """
        Calcula economia mensal em R$
        Considera apenas a energia solar realmente utilizada
        """
        energia_utilizada = min(geracao_solar_kwh, consumo_mensal_kwh)
        return energia_utilizada * custo_energia_kwh

    @staticmethod
    def calcular_payback(investimento_total, economia_mensal, receita_mineracao_mensal=0, custos_operacionais_mensal=0):
        """
        Calcula tempo de retorno do investimento em meses
        Fórmula: Payback = investimento_total / (economia_mensal + receita_mineracao - custos_operacionais)
        """
        lucro_liquido_mensal = economia_mensal + receita_mineracao_mensal - custos_operacionais_mensal
        if lucro_liquido_mensal <= 0:
            return 999  # Indicador de nunca payback
        return investimento_total / lucro_liquido_mensal

    @staticmethod
    def calcular_co2_evitado(geracao_solar_kwh, fator_emissao_regional):
        """
        Calcula emissões de CO2 evitadas em kg/mês
        Fonte: Ministério do Meio Ambiente
        """
        return geracao_solar_kwh * fator_emissao_regional

    @staticmethod
    def calcular_receita_mineracao(hashrate_total_th, preco_bitcoin_brl, dificuldade_rede=None):
        """
        Calcula receita aproximada de mineração em R$/mês
        Fórmula simplificada baseada em dados de pools de mineração
        """
        # Fator de conversão aproximado (varia com dificuldade da rede)
        # Baseado em dados históricos de mineração
        fator_conversao = 0.0000001  # TH/s para BTC/dia (valor conservador)
        
        btc_dia = hashrate_total_th * fator_conversao
        btc_mes = btc_dia * 30
        return btc_mes * preco_bitcoin_brl

    @staticmethod
    def analisar_viabilidade(cobertura_solar, payback_meses):
        """
        Analisa viabilidade do projeto baseado em cobertura solar e payback
        Retorna análise qualitativa com cores e descrições
        """
        if cobertura_solar >= 80 and payback_meses <= 36:
            return {
                "status": "ALTAMENTE VIÁVEL",
                "cor": "#27ae60",
                "descricao": "🎉 Excelente! Projeto altamente sustentável com retorno rápido do investimento."
            }
        elif cobertura_solar >= 60 and payback_meses <= 60:
            return {
                "status": "VIÁVEL", 
                "cor": "#f39c12",
                "descricao": "👍 Bom! Projeto viável com bons retornos em médio prazo."
            }
        elif cobertura_solar >= 40:
            return {
                "status": "MODERADAMENTE VIÁVEL",
                "cor": "#e67e22", 
                "descricao": "⚠️ Razoável. Considere aumentar o sistema solar para melhorar viabilidade."
            }
        else:
            return {
                "status": "POUCO VIÁVEL",
                "cor": "#e74c3c",
                "descricao": "❌ Atenção. Cobertura solar insuficiente. Revisite o dimensionamento."
            }

    def get_equipamentos_por_tipo(self, tipo):
        """Retorna equipamentos filtrados por tipo"""
        return self.EQUIPAMENTOS.get(tipo, [])

    def get_dados_estado(self, estado):
        """Retorna dados completos de um estado"""
        return self.ESTADOS_BRASIL.get(estado)