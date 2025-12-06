"""
Módulo com toda a lógica de cálculos do projeto
"""

class CalculadoraBitcoin:
    """
    Classe principal para todos os cálculos do projeto
    """
    
    # Dados dos estados brasileiros com irradiação solar média (kWh/m²/dia)
    # Fonte: Atlas Solar Brasileiro (INPE) - Dados 2023

    IRRACIACAO_E_EMISSAO_POR_ESTADO = {
        "AC": {
                "nome": "Acre", 
                "irradiacao": 1.520, 
                "fator_emissao": 0.08
                },
        "AL": {
                "nome": "Alagoas", 
                "irradiacao": 1.990, 
                "fator_emissao": 0.097
                },
        "AP": {
                "nome": "Amapá", 
                "irradiacao": 1.590, 
                "fator_emissao": 0.355
                },
        "AM": {
                "nome": "Amazonas", 
                "irradiacao": 1.600, 
                "fator_emissao": 0.248
                },
        "BA": {
                "nome": "Bahia", 
                "irradiacao": 2.130, 
                "fator_emissao": 0.068
                },
        "CE": {
                "nome": "Ceará", 
                "irradiacao": 2.100, 
                "fator_emissao": 0.088
                },
        "DF": {
                "nome": "Distrito Federal", 
                "irradiacao": 1.970, 
                "fator_emissao": 0.087
                },
        "ES": {
                "nome": "Espírito Santo", 
                "irradiacao": 1.720, 
                "fator_emissao": 0.099
                },
        "GO": {
                "nome": "Goiás", 
                "irradiacao": 2.000, 
                "fator_emissao": 0.081
                },
        "MA": {
                "nome": "Maranhão", 
                "irradiacao": 1.910, 
                "fator_emissao": 0.118
                },
        "MT": {
                "nome": "Mato Grosso", 
                "irradiacao": 1.970, 
                "fator_emissao": 0.086
                },
        "MS": {
                "nome": "Mato Grosso do Sul", 
                "irradiacao": 1.860, 
                "fator_emissao": 0.078
                },
        "MG": {
                "nome": "Minas Gerais", 
                "irradiacao": 1.930, 
                "fator_emissao": 0.088
                },
        "PA": {
                "nome": "Pará", 
                "irradiacao": 1.640, 
                "fator_emissao": 0.195
                },
        "PB": {
                "nome": "Paraíba", 
                "irradiacao": 2.100, 
                "fator_emissao": 0.081
                },
        "PR": {
                "nome": "Paraná", 
                "irradiacao": 1.740, 
                "fator_emissao": 0.107
                },
        "PE": {
                "nome": "Pernambuco", 
                "irradiacao": 2.110, 
                "fator_emissao": 0.079
                },
        "PI": {
                "nome": "Piauí", 
                "irradiacao": 2.150, 
                "fator_emissao": 0.066
                },
        "RJ": {
                "nome": "Rio de Janeiro", 
                "irradiacao": 1.710, 
                "fator_emissao": 0.097
                },
        "RN": {
                "nome": "Rio Grande do Norte", 
                "irradiacao": 2.100, 
                "fator_emissao": 0.079
                },
        "RS": {
                "nome": "Rio Grande do Sul", 
                "irradiacao": 1.650, 
                "fator_emissao": 0.145
                },
        "RO": {
                "nome": "Rondônia", 
                "irradiacao": 1.600, 
                "fator_emissao": 0.095
                },
        "RR": {
                "nome": "Roraima", 
                "irradiacao": 1.900, 
                "fator_emissao": 0.425
                },
        "SC": {
                "nome": "Santa Catarina", 
                "irradiacao": 1.700, 
                "fator_emissao": 0.122
                },
        "SP": {
                "nome": "São Paulo", 
                "irradiacao": 1.780, 
                "fator_emissao": 0.089
                },
        "SE": {
                "nome": "Sergipe", 
                "irradiacao": 1.970, 
                "fator_emissao": 0.086
                },
        "TO": {
                "nome": "Tocantins", 
                "irradiacao": 2.020, 
                "fator_emissao": 0.096
                }
    }

    # Tarifas de energia entre os estados brasileiros
    # Fonte: Agência Nacional de Energia Elétrica (ANEEL) - Dados 2024
    
    TARIFAS_POR_ESTADO = {
        "AC": {
                "nome": "Acre", 
                "tarifa": 0.791
                },
        "AL": {
               
                "nome": "Alagoas", 
                "tarifa": 0.863
                },
        "AP": {
               
                "nome": "Amapá", 
                "tarifa": 0.808
                },
        "AM": {
               
                "nome": "Amazonas", 
                "tarifa": 0.857
                },
        "BA": {
               
                "nome": "Bahia", 
                "tarifa": 0.821
                },
        "CE": {
               
                "nome": "Ceará", 
                "tarifa": 0.722
                },
        "DF": {
               
                "nome": "Distrito Federal", 
                "tarifa": 0.743
                },
        "ES": {
               
                "nome": "Espírito Santo", 
                "tarifa": 0.682
                },
        "GO": {
               
                "nome": "Goiás", 
                "tarifa": 0.745
                },
        "MA": {
               
                "nome": "Maranhão", 
                "tarifa": 0.711
                },
        "MT": {
               
                "nome": "Mato Grosso", 
                "tarifa": 0.847
                },
        "MS": {
               
                "nome": "Mato Grosso do Sul", 
                "tarifa": 0.870
                },
        "MG": {
               
                "nome": "Minas Gerais", 
                "tarifa": 0.796
                },
        "PA": {
               
                "nome": "Pará", 
                "tarifa": 0.938
                },
        "PB": {
               
                "nome": "Paraíba", 
                "tarifa": 0.588
                },
        "PR": {
               
                "nome": "Paraná", 
                "tarifa": 0.629
                },
        "PE": {
               
                "nome": "Pernambuco", 
                "tarifa": 0.744
                },
        "PI": {
               
                "nome": "Piauí", 
                "tarifa": 0.829
                },
        "RJ": {
               
                "nome": "Rio de Janeiro", 
                "tarifa": 0.870
                },
        "RN": {
               
                "nome": "Rio Grande do Norte", 
                "tarifa": 0.722
                },
        "RS": {
               
                "nome": "Rio Grande do Sul", 
                "tarifa": 0.701
                },
        "RO": {
               
                "nome": "Rondônia", 
                "tarifa": 0.727
                },
        "RR": {
               
                "nome": "Roraima", 
                "tarifa": 0.661
                },
        "SC": {
               
                "nome": "Santa Catarina", 
                "tarifa": 0.618
                },
        "SP": {
               
                "nome": "São Paulo", 
                "tarifa": 0.671
                },
        "SE": {
               
                "nome": "Sergipe", 
                "tarifa": 0.666
                },
        "TO": {
               
                "nome": "Tocantins", 
                "tarifa": 0.823
                }
    }

    # Equipame
    # ntos de mineração
    EQUIPAMENTOS = {
        "GPU": [
            {
                "modelo": "NVIDIA RTX 4090",
                "consumo_w": 450,
                "hashrate_th": 0.00012,
                "custo_aproximado": 13000, 
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
                "custo_aproximado": 7000,
                "fabricante": "AMD",
                "tipo": "GPU"
            },
        ],
        "ASIC": [
            {
                "modelo": "Bitmain Antminer S23 Hyd 3U", 
                "consumo_w": 11020, 
                "hashrate_th": 1160,
                "custo_aproximado": 160000, 
                "fabricante": "Bitmain",
                "tipo": "ASIC"
            },
            {
                "modelo": "Bitmain Antminer S21e XP Hyd 3U", 
                "consumo_w": 11180,
                "hashrate_th": 860,
                "custo_aproximado": 82000,
                "fabricante": "Bitmain",
                "tipo": "ASIC"
            },
            {
                "modelo": "Bitmain Antminer S23 Immersion (442Th)", 
                "consumo_w": 11180, 
                "hashrate_th": 442,
                "custo_aproximado": 46400, 
                "fabricante": "Bitmain",
                "tipo": "ASIC"
            },
            {
                "modelo": "Bitdeer SealMiner A3 Pro Hydro", 
                "consumo_w": 8250, 
                "hashrate_th": 660,
                "custo_aproximado": 42600,
                "fabricante": "Bitdeer",
                "tipo": "ASIC"
            },
            {
                "modelo": "Proto Rig", 
                "consumo_w": 12000, 
                "hashrate_th": 819,
                "custo_aproximado": 43190,
                "fabricante": "Block",
                "tipo": "ASIC"
            },
            {
                "modelo": "Bitmain Antminer S21 XP Immersion (300Th)", 
                "consumo_w": 4050, 
                "hashrate_th": 300,
                "custo_aproximado": 18780,
                "fabricante": "Bitmain",
                "tipo": "ASIC"
            },
            {
                "modelo": "Canaan Avalon A16XP-300T", 
                "consumo_w": 3850, 
                "hashrate_th": 300,
                "custo_aproximado": 30130,
                "fabricante": "Canaan",
                "tipo": "ASIC"
            },
            {
                "modelo": "Fluminer T3", 
                "consumo_w": 1700, 
                "hashrate_th": 115,
                "custo_aproximado": 14380,
                "fabricante": "Fluminer",
                "tipo": "ASIC"
            },
            {
                "modelo": "Bitaxe Touch", 
                "consumo_w": 22, 
                "hashrate_th": 1.6,
                "custo_aproximado": 1800,
                "fabricante": "Canaan",
                "tipo": "ASIC"
            },
        ]
    }

    # Painéis Solares com dimensões adicionais
    PAINÉIS_SOLARES = [
        {
            "modelo": "Resun RSM-010P",
            "potencia_w": 10,
            "preco": 160.43,
            "tipo": "Policristalino",
            "custo_por_watt": 16.04,
            "largura_m": 0.35,
            "altura_m": 0.25,
            "eficiencia": 0.15
        },
        {
            "modelo": "Risen",
            "potencia_w": 20,
            "preco": 173.18,
            "tipo": "Policristalino",
            "custo_por_watt": 8.66,
            "largura_m": 0.50,
            "altura_m": 0.35,
            "eficiencia": 0.16
        },
        {
            "modelo": "Ztroon (ZTP-30M)",
            "potencia_w": 30,
            "preco": 129.76,
            "tipo": "Monocristalino",
            "custo_por_watt": 4.33,
            "largura_m": 0.58,
            "altura_m": 0.40,
            "eficiencia": 0.18
        },
        {
            "modelo": "Ztroon (ZTP-60M)",
            "potencia_w": 60,
            "preco": 199,
            "tipo": "Monocristalino",
            "custo_por_watt": 3.32,
            "largura_m": 0.68,
            "altura_m": 0.55,
            "eficiencia": 0.185
        },
        {
            "modelo": "Ztroon (ZTP-100MI)",
            "potencia_w": 100,
            "preco": 299,
            "tipo": "Monocristalino",
            "custo_por_watt": 2.99,
            "largura_m": 1.05,
            "altura_m": 0.70,
            "eficiencia": 0.19
        },
        {
            "modelo": "Resun (RS6E-150P)",
            "potencia_w": 150,
            "preco": 608.5,
            "tipo": "Policristalino",
            "custo_por_watt": 4.06,
            "largura_m": 1.48,
            "altura_m": 0.67,
            "eficiencia": 0.165
        },
        {
            "modelo": "Ztroon (ZTP-160M)",
            "potencia_w": 160,
            "preco": 369,
            "tipo": "Monocristalino",
            "custo_por_watt": 2.31,
            "largura_m": 1.64,
            "altura_m": 0.99,
            "eficiencia": 0.195
        },
        {
            "modelo": "ZTF-200M Flexível",
            "potencia_w": 200,
            "preco": 1740.96,
            "tipo": "Monocristalino",
            "custo_por_watt": 8.7,
            "largura_m": 1.60,
            "altura_m": 1.05,
            "eficiencia": 0.205
        },
        {
            "modelo": "Sinosola",
            "potencia_w": 280,
            "preco": 592.43,
            "tipo": "Policristalino",
            "custo_por_watt": 2.12,
            "largura_m": 1.65,
            "altura_m": 0.99,
            "eficiencia": 0.17
        },
        {
            "modelo": "Canadian (CS3U-300P)",
            "potencia_w": 300,
            "preco": 499.00,
            "tipo": "Policristalino",
            "custo_por_watt": 1.66,
            "largura_m": 1.96,
            "altura_m": 0.99,
            "eficiencia": 0.175
        },
        {
            "modelo": "Canadian Bifacial HalfCell",
            "potencia_w": 360,
            "preco": 729.14,
            "tipo": "Policristalino",
            "custo_por_watt": 2.03,
            "largura_m": 1.76,
            "altura_m": 1.05,
            "eficiencia": 0.195
        },
        {
            "modelo": "Canadian Half Cell Bi-Partida",
            "potencia_w": 365,
            "preco": 591.31,
            "tipo": "Policristalino",
            "custo_por_watt": 1.62,
            "largura_m": 1.76,
            "altura_m": 1.04,
            "eficiencia": 0.20
        },
        {
            "modelo": "Canadian Mono Bifacial",
            "potencia_w": 385,
            "preco": 619.38,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.61,
            "largura_m": 1.76,
            "altura_m": 1.04,
            "eficiencia": 0.21
        },
        {
            "modelo": "Canadian HiKu Bi-Partida",
            "potencia_w": 425,
            "preco": 502.20,
            "tipo": "Policristalino",
            "custo_por_watt": 1.18,
            "largura_m": 2.09,
            "altura_m": 1.04,
            "eficiencia": 0.205
        },
        {
            "modelo": "Canadian Mono HiKu Bi-Partida",
            "potencia_w": 450,
            "preco": 763.35,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.7,
            "largura_m": 2.09,
            "altura_m": 1.04,
            "eficiencia": 0.215
        },
        {
            "modelo": "JA Solar Mono",
            "potencia_w": 450,
            "preco": 985.18,
            "tipo": "Monocristalino",
            "custo_por_watt": 2.19,
            "largura_m": 2.10,
            "altura_m": 1.05,
            "eficiencia": 0.215
        },
        {
            "modelo": "Canadian Mono (CS3W-455MS)",
            "potencia_w": 455,
            "preco": 539.10,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.18,
            "largura_m": 2.09,
            "altura_m": 1.04,
            "eficiencia": 0.218
        },
        {
            "modelo": "Canadian Mono Bifacial",
            "potencia_w": 535,
            "preco": 776.31,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.45,
            "largura_m": 2.38,
            "altura_m": 1.30,
            "eficiencia": 0.206
        },
        {
            "modelo": "JA Solar Mono Bifacial",
            "potencia_w": 540,
            "preco": 711.45,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.32,
            "largura_m": 2.38,
            "altura_m": 1.30,
            "eficiencia": 0.208
        },
        {
            "modelo": "Canadian Bifacial TOPBiHiKu6",
            "potencia_w": 570,
            "preco": 689.00,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.21,
            "largura_m": 2.28,
            "altura_m": 1.13,
            "eficiencia": 0.220
        },
        {
            "modelo": "Renesola Mono",
            "potencia_w": 570,
            "preco": 494.10,
            "tipo": "Monocristalino",
            "custo_por_watt": 0.87,
            "largura_m": 2.28,
            "altura_m": 1.13,
            "eficiencia": 0.221
        },
        {
            "modelo": "Solar N Plus Bifacial TOPCon",
            "potencia_w": 580,
            "preco": 598.99,
            "tipo": "Monocristalino",
            "custo_por_watt": 1.03,
            "largura_m": 2.28,
            "altura_m": 1.13,
            "eficiencia": 0.225
        },
        {
            "modelo": "Znshine Mono Grafeno",
            "potencia_w": 595,
            "preco": 539.10,
            "tipo": "Monocristalino",
            "custo_por_watt": 0.91,
            "largura_m": 2.38,
            "altura_m": 1.30,
            "eficiencia": 0.210
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
        """
        if consumo_mensal_kwh <= 0:
            return 0
        cobertura = (geracao_solar_kwh / consumo_mensal_kwh) * 100
        return min(cobertura, 100)

    @staticmethod
    def calcular_economia_mensal(geracao_solar_kwh, consumo_mensal_kwh, custo_energia_kwh):
        """
        Calcula economia mensal em R$
        """
        energia_solar_utilizada = min(geracao_solar_kwh, consumo_mensal_kwh)
        return energia_solar_utilizada * custo_energia_kwh

    @staticmethod
    def calcular_payback(investimento_total, economia_mensal, receita_mineracao_mensal=0):
        """
        Calcula tempo de retorno do investimento em meses
        """
        custo_manutencao_mensal = investimento_total * 0.0042
        lucro_liquido_mensal = receita_mineracao_mensal + economia_mensal - custo_manutencao_mensal
        
        if lucro_liquido_mensal <= 0:
            return 999
        
        return investimento_total / lucro_liquido_mensal

    @staticmethod
    def calcular_co2_evitado(geracao_solar_kwh, fator_emissao_regional):
        """
        Calcula emissões de CO2 evitadas em kg/mês
        """
        return geracao_solar_kwh * fator_emissao_regional

    @staticmethod
    def calcular_receita_mineracao(hashrate_total_th, preco_bitcoin_brl):
        """
        Calcula receita aproximada de mineração em R$/mês
        """
        hashrate_rede_total_th = 500_000_000
        recompensa_por_bloco_btc = 3.125
        blocos_por_dia = 144
        recompensa_diaria_total_btc = recompensa_por_bloco_btc * blocos_por_dia
        
        participacao = hashrate_total_th / hashrate_rede_total_th
        sua_recompensa_diaria_btc = participacao * recompensa_diaria_total_btc
        sua_recompensa_mensal_btc = sua_recompensa_diaria_btc * 30
        receita_mensal_brl = sua_recompensa_mensal_btc * preco_bitcoin_brl
        
        return max(receita_mensal_brl, 0)

    @staticmethod
    def calcular_btc_mensal(hashrate_total_th):
        """
        Calcula quantidade de BTC minerada por mês
        """
        hashrate_rede_total_th = 500_000_000
        recompensa_por_bloco_btc = 3.125
        blocos_por_dia = 144
        recompensa_diaria_total_btc = recompensa_por_bloco_btc * blocos_por_dia
        
        participacao = hashrate_total_th / hashrate_rede_total_th
        sua_recompensa_diaria_btc = participacao * recompensa_diaria_total_btc
        sua_recompensa_mensal_btc = sua_recompensa_diaria_btc * 30
        
        return sua_recompensa_mensal_btc

    @staticmethod
    def calcular_area_total_paineis(quantidade_paineis, potencia_painel_w):
        """
        Calcula área total ocupada pelos painéis em m²
        Estimativa baseada em painéis padrão
        """
        # Área média por kWp: 6-7 m²/kWp para painéis modernos
        potencia_total_kw = (quantidade_paineis * potencia_painel_w) / 1000
        return potencia_total_kw * 6.5  # m²/kWp

    def get_equipamentos_por_tipo(self, tipo):
        """Retorna equipamentos filtrados por tipo"""
        return self.EQUIPAMENTOS.get(tipo, [])

    def get_dados_estado(self, estado):
        """Retorna dados completos de um estado"""
        return self.IRRACIACAO_E_EMISSAO_POR_ESTADO.get(estado)
    
    def get_tarifa_estado(self, estado):
        """Retorna tarifa de energia de um estado"""
        return self.TARIFAS_POR_ESTADO.get(estado, {"tarifa": 0.80})