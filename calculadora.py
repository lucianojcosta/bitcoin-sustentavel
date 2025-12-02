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
    # Dados de 2023
    
    ESTADOS_BRASIL = {
        "AC": {"nome": "Acre", "irradiacao": 1.520, "fator_emissao": 0.08},
        "AL": {"nome": "Alagoas", "irradiacao": 1.990, "fator_emissao": 0.097},
        "AP": {"nome": "Amapá", "irradiacao": 1.590, "fator_emissao": 0.355},
        "AM": {"nome": "Amazonas", "irradiacao": 1.600, "fator_emissao": 0.248},
        "BA": {"nome": "Bahia", "irradiacao": 2.130, "fator_emissao": 0.068},
        "CE": {"nome": "Ceará", "irradiacao": 2.100, "fator_emissao": 0.088},
        "DF": {"nome": "Distrito Federal", "irradiacao": 1.970, "fator_emissao": 0.087},
        "ES": {"nome": "Espírito Santo", "irradiacao": 1.720, "fator_emissao": 0.099},
        "GO": {"nome": "Goiás", "irradiacao": 2.000, "fator_emissao": 0.081},
        "MA": {"nome": "Maranhão", "irradiacao": 1.910, "fator_emissao": 0.118},
        "MT": {"nome": "Mato Grosso", "irradiacao": 1.970, "fator_emissao": 0.086},
        "MS": {"nome": "Mato Grosso do Sul", "irradiacao": 1.860, "fator_emissao": 0.078},
        "MG": {"nome": "Minas Gerais", "irradiacao": 1.930, "fator_emissao": 0.088},
        "PA": {"nome": "Pará", "irradiacao": 1.640, "fator_emissao": 0.195},
        "PB": {"nome": "Paraíba", "irradiacao": 2.100, "fator_emissao": 0.081},
        "PR": {"nome": "Paraná", "irradiacao": 1.740, "fator_emissao": 0.107},
        "PE": {"nome": "Pernambuco", "irradiacao": 2.110, "fator_emissao": 0.079},
        "PI": {"nome": "Piauí", "irradiacao": 2.150, "fator_emissao": 0.066},
        "RJ": {"nome": "Rio de Janeiro", "irradiacao": 1.710, "fator_emissao": 0.097},
        "RN": {"nome": "Rio Grande do Norte", "irradiacao": 2.100, "fator_emissao": 0.079},
        "RS": {"nome": "Rio Grande do Sul", "irradiacao": 1.650, "fator_emissao": 0.145},
        "RO": {"nome": "Rondônia", "irradiacao": 1.600, "fator_emissao": 0.095},
        "RR": {"nome": "Roraima", "irradiacao": 1.900, "fator_emissao": 0.425},
        "SC": {"nome": "Santa Catarina", "irradiacao": 1.700, "fator_emissao": 0.122},
        "SP": {"nome": "São Paulo", "irradiacao": 1.780, "fator_emissao": 0.089},
        "SE": {"nome": "Sergipe", "irradiacao": 1.970, "fator_emissao": 0.086},
        "TO": {"nome": "Tocantins", "irradiacao": 2.020, "fator_emissao": 0.096}
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


    PAINÉIS_SOLARES = [
        {
            "modelo": "Resun RSM-010P",
            "potencia_w": 10,
            "preco": 160.43,
            "tipo": "Policristalino",
            "custo_por_watt": 16.04
        },
        {
            "modelo": "Canadian Solar CS6K-280M",
            "potencia_w": 280,
            "preco": 420.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.50
        },
        {
            "modelo": "Jinko Solar Tiger Pro 540W",
            "potencia_w": 540,
            "preco": 810.00,
            "tipo": "Monocristalino N-Type",
            "custo_por_watt": 1.50
        },
        {
            "modelo": "Trina Solar Vertex S 440W",
            "potencia_w": 440,
            "preco": 660.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.50
        },
        {
            "modelo": "LONGi Hi-MO 5m 550W",
            "potencia_w": 550,
            "preco": 825.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.50
        },
        {
            "modelo": "JA Solar JAM72S30 530/MR",
            "potencia_w": 530,
            "preco": 795.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.50
        },
        {
            "modelo": "Risen Energy RSM110-8-550M",
            "potencia_w": 550,
            "preco": 825.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.50
        },
        {
            "modelo": "BYD 460W Mono PERC",
            "potencia_w": 460,
            "preco": 690.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.50
        }
    ]

    @staticmethod
    def get_paineis_solares():
        """Retorna lista de painéis solares disponíveis"""
        return CalculadoraBitcoin.PAINÉIS_SOLARES

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
        CORREÇÃO: Se geração > consumo, mostra 100% (não pode passar)
        """
        if consumo_mensal_kwh <= 0:
            return 0
        cobertura = (geracao_solar_kwh / consumo_mensal_kwh) * 100
        return min(cobertura, 100)  # Máximo 100%

    @staticmethod
    def calcular_economia_mensal(geracao_solar_kwh, consumo_mensal_kwh, custo_energia_kwh):
        """
        Calcula economia mensal em R$
        CORREÇÃO: Economia apenas sobre a energia solar utilizada
        """
        # A energia solar utilizada é o mínimo entre geração e consumo
        energia_solar_utilizada = min(geracao_solar_kwh, consumo_mensal_kwh)
        return energia_solar_utilizada * custo_energia_kwh

    @staticmethod
    def calcular_payback(investimento_total, economia_mensal, receita_mineracao_mensal=0):
        """
        Calcula tempo de retorno do investimento em meses
        CORREÇÃO: Considera custos operacionais de manutenção
        """
        # Custo operacional estimado: 5% do investimento por ano = ~0.42% por mês
        custo_manutencao_mensal = investimento_total * 0.0042
        
        # Custo de energia não coberta pelo solar (se houver déficit)
        
        lucro_liquido_mensal = receita_mineracao_mensal + economia_mensal - custo_manutencao_mensal
        
        if lucro_liquido_mensal <= 0:
            return 999  # Nunca terá payback
        
        return investimento_total / lucro_liquido_mensal

    @staticmethod
    def calcular_co2_evitado(geracao_solar_kwh, fator_emissao_regional):
        """
        Calcula emissões de CO2 evitadas em kg/mês
        Fonte: Ministério do Meio Ambiente - Fator médio Brasil: 0.1 kg CO2/kWh
        """
        # A energia solar evitada é a que realmente foi utilizada
        return geracao_solar_kwh * fator_emissao_regional

    @staticmethod
    def calcular_receita_mineracao(hashrate_total_th, preco_bitcoin_brl, dificuldade_rede=None):
        """
        Calcula receita aproximada de mineração em R$/mês
        Fórmula mais realista baseada em dados atuais
        """
        # Dados atuais (novembro 2024):
        # - Dificuldade da rede Bitcoin: ~100 T
        # - Recompensa por bloco: 3.125 BTC
        # - Blocks por dia: ~144
        # - Hashrate total da rede: ~500 EH/s = 500,000,000 TH/s
        
        # Fórmula: (seu hashrate / hashrate total da rede) * recompensa diária * preço
        hashrate_rede_total_th = 500_000_000  # 500 EH/s em TH/s
        
        # Recompensa diária em BTC
        recompensa_por_bloco_btc = 3.125
        blocos_por_dia = 144
        recompensa_diaria_total_btc = recompensa_por_bloco_btc * blocos_por_dia
        
        # Participação na rede
        participacao = hashrate_total_th / hashrate_rede_total_th
        
        # Receita diária em BTC
        sua_recompensa_diaria_btc = participacao * recompensa_diaria_total_btc
        
        # Receita mensal em R$
        sua_recompensa_mensal_btc = sua_recompensa_diaria_btc * 30
        receita_mensal_brl = sua_recompensa_mensal_btc * preco_bitcoin_brl
        
        return max(receita_mensal_brl, 0)

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