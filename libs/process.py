# Version 1.10 28.06.2023

import numpy as np
import pandas as pd

from libs.progress import Progress

from libs.funsData import intersect

from libs.funsProcess import battOptPriceLosses, batteryRealityLosses
from libs.funsProcess import battOptPeaksLosses
from libs.funsProcess import battOptAbsPeaksLosses#, battOptSumAbsPeaksLosses
from libs.funsProcess import battOptSumEnergyLosses
from libs.funsProcess import checkTimeline


from libs.funsProcessGEKKO import battOptPriceLossesAPOPT


from libs.funsCost import calculateCost, printCost, batteryCycles, energyBalance, financialBalance, costArray

from libs.funsChart import chartDay, ChartFull


# import matplotlib.pyplot as plt



def calculate(conf, progressBar, textLabel, infoConsole):
    #%% Data
    dt = 1 #hod - interval dat

    dataPath = conf['Obecne']['slozka_zpracovane']
    
    vnutitRokSpotreby = conf['Optimalizace']['vnutitrokspotreby']
    
    
    # data = pd.read_pickle(dataPath + '_intersected.pkl')
    data = intersect(dataPath, False, False, vnutitRokSpotreby)
    
    
    
    #%% Parametry optimalizace
    export = conf['Export']['export']
    exportFile = conf['Export']['exportfile']
    
    
    # Typ optimalizace baterie:
    optimizationType = conf['Optimalizace']['optimizationtype']
        # 0 - minimalizovat náklady 
        # 1 - minimalizovat špičky spotřeby
        # 2 - minimalizovat špičky spotřeby i dodávky
    
    
    # Podmínky optimalizace:
    povolitDodavkyDoSiteZBaterie = conf['Optimalizace']['povolitdodavkydositezbaterie']
    povolitOdberZeSiteDoBaterie  = conf['Optimalizace']['povolitodberzesitedobaterie']
    povolitPrekroceniPmax        = conf['Optimalizace']['povolitprekrocenipmax']
    
    
    # Další parametry:
    vynulovatSpotrebniDiagram    = conf['Optimalizace']['vynulovatspotrebnidiagram']
        # True  - vynuluje data spotřeby, pracuje se jen s baterií a případně s výrobou 
        # False - optimalizace včetně dat spotřeby
        
    pouzitFixniCenu              = conf['Optimalizace']['pouzitfixnicenu']
        # True  - použije fixní cenu nastavenou v sekci niže (Korekce ceny, poplatky)
        # False - použije spotové ceny
    
    pouzitPredikciSpotreby       = conf['Optimalizace']['pouzitpredikcispotreby']
        # True  - pro optimalizaci se použijí data stejného dne z předcházejícího týdne
        # False - použijí se skutečná data spotřeby (ve skutečnosti nebudou známá)
    
    simulaceSkutecnehoProvozu    = conf['Optimalizace']['simulaceskutecnehoprovozu']
        # Nechat False, simulace neni doladěná a nefunguje dobře
    
    automatickyZobrazitDenniGraf = conf['Graf']['automatickyzobrazitdennigraf']
    
    
    stylGrafu                    = conf['Graf']['stylgrafu']
        #0 - default, 1 - seaborn-v0_8, 2 - cyberpunk
    
    
    
    
    # Poznámky:
    # Při simulaci skutečného provozu, přepočítávat optimalizaci každou hodinu,
    # můžou se zlepšit výsledky 
    #    - teď je to s krokem 24 hodin, vždycky od 13 hod do konce
    #      dalšího dne (36 hodin - je známá cena)
    
    
    
    #%% Korekce ceny, poplatky
    priceFix        = conf['Ceny']['pricefix'] #Kč/kWh - musí být výše povoleno a potom přepíše ceny na tuto konstatní hodnotu
    
    feeDistribution = conf['Ceny']['feedistribution'] #Kč/kWh
    feeTrader       = conf['Ceny']['feetrader'] #Kč/kWh
    
    
    feeCons = feeDistribution + feeTrader
    feeSupp = -feeTrader
    fees = (feeCons, feeSupp)
    
    
    
    #%% Omezení výkonu
    PmaxOdber   = conf['Pmax']['pmaxodber'] #kW
    PmaxDodavka = conf['Pmax']['pmaxdodavka'] #kW
    
    
    Pmax = (-PmaxDodavka, PmaxOdber)
    
    
    
    #%% Parametry baterie
    B_cap  = conf['Baterie']['b_cap'] #kWh
    B_max  = conf['Baterie']['b_max']
    B_min  = conf['Baterie']['b_min']
    
    B_effCharge    = conf['Baterie']['b_effcharge']
    B_effDischarge = conf['Baterie']['b_effdischarge']
    
    B_speedCharge    = conf['Baterie']['b_speedcharge'] #kWh/h
    B_speedDischarge = conf['Baterie']['b_speeddischarge'] #kwh/h
    
    
    B_params = (B_cap, B_max, B_min, B_effCharge, B_effDischarge, B_speedCharge, B_speedDischarge)
    
    
    
    #%% Parametry fotovoltaiky
    PV_powerNom = conf['FVE']['pv_powernom']
    
    PV_power1 = conf['FVE']['pv_power1']
    PV_area1  = conf['FVE']['pv_area1']
    PV_eff    = conf['FVE']['pv_eff']
    
    
    PV_tempEffCoef = conf['FVE']['pv_tempeffcoef'] # -/K
    PV_tempRef     = conf['FVE']['pv_tempref']
    
    PV_effConverter = conf['FVE']['pv_effconverter']
    
    
    predRandCoef = conf['FVE']['predrandcoef']
    
    
    #%% Výkon FVE do tabulky
    PV_coef = PV_effConverter*PV_eff * PV_area1*np.round(PV_powerNom/PV_power1)
    PV_tempCoef = 1.0 - (data['Tamb'].values - PV_tempRef)*PV_tempEffCoef
    # Jake je otepleni panelu vykonem?
    PV_power = -data['GHI'].values*PV_coef*PV_tempCoef
    data['PVkWh'] = PV_power * dt
    
    
    PmaxFVE = conf['FVE']['pmaxfve']
    data.loc[data['PVkWh'] < -PmaxFVE, 'PVkWh'] = -PmaxFVE
    
    
    
    #%% Simulace
    if vynulovatSpotrebniDiagram:
        data['kWh'] = 0.0
    
    if pouzitFixniCenu:
        data['Kč/kWh'] = priceFix
    
    
    data['BkWh'] = np.nan
    data['BkWh_charge'] = np.nan
    Ldata = len(data)
    
    E0 = B_cap*B_min
    
    Nhours = 36
    
    ih13 = np.where(data['Hodina'] == 13)[0]
    
    progress = Progress(progressBar=progressBar, textLabel=textLabel)
    steps = range(len(ih13))
    succ = []
    print('')
    for i0, step in zip(ih13, steps):
    
        i0week = data['ISOtyden'][i0]
        i0day  = data['DenTyden'][i0]
        if pouzitPredikciSpotreby:
            i0last = (data['ISOtyden'] == i0week-1) & (data['DenTyden'] == i0day) & (data['Hodina'] == 13)
        else:
            i0last = (data['ISOtyden'] == i0week) & (data['DenTyden'] == i0day) & (data['Hodina'] == 13)
    
        if ~np.any(i0last):
            Ebat = E0
            progress.update((step+1)/len(steps))
            continue
        else:
            i0last = np.where(i0last)[0][0]
        
        indCurr = range(i0    , i0+Nhours)
        indLast = range(i0last, i0last+Nhours)
    
        if indCurr[-1]+1 > Ldata:
            progress.update((step+1)/len(steps))
            continue
        
        tCurr = data['t0'][indCurr].to_numpy()
        tLast = data['t0'][indLast].to_numpy()
        if (len(tCurr) != Nhours) or (len(tLast) != Nhours):
            Ebat = E0
            progress.update((step+1)/len(steps))
            continue
        
        if not checkTimeline(tCurr, dt) or not checkTimeline(tLast, dt):
            Ebat = E0
            progress.update((step+1)/len(steps))
            continue
        
        
        # Aktuální uroveň 
        Ebat = data['BkWh_charge'][i0-1]
        if np.isnan(Ebat):
            Ebat = E0
        
        # Ceny energie
        price = data['Kč/kWh'][indCurr].values
    
    
        # Predikce spotřeby a výroby
        consPred  =   data['kWh'][indLast].values
        suppPred  = data['PVkWh'][indCurr].values
        if predRandCoef > 0.0:
            suppPred *= 1 + predRandCoef*(2*(np.random.rand(len(suppPred))-0.5))
    
    
        # Plán využití baterie podle predikce
        if optimizationType == 0:
            battPred, success = battOptPriceLosses(price, consPred, suppPred, 
                                                   Pmax, Ebat, B_params, dt,
                                                   fees,
                                                   (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))
        elif optimizationType == 1:
            battPred, success = battOptPeaksLosses(consPred, suppPred, 
                                                   Pmax, Ebat, B_params, dt, 
                                                   (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))
        elif optimizationType == 2:
            battPred, success = battOptAbsPeaksLosses(consPred, suppPred, 
                                                      Pmax, Ebat, B_params, dt, 
                                                      (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))

        elif optimizationType == 3:
            battPred, success = battOptPriceLossesAPOPT(price, consPred, suppPred, 
                                                        Pmax, Ebat, B_params, dt,
                                                        fees,
                                                        (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))

        # elif optimizationType == 3:
        #     battPred, success = battOptSumEnergyLosses(consPred, suppPred, 
        #                                                Pmax, Ebat, B_params, dt,
        #                                                0,
        #                                                (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))
            
        # elif optimizationType == 4:
        #     battPred, success = battOptSumEnergyLosses(consPred, suppPred, 
        #                                                Pmax, Ebat, B_params, dt,
        #                                                1,
        #                                                (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))

        # elif optimizationType == 5:
        #     battPred, success = battOptSumEnergyLosses(consPred, suppPred, 
        #                                                Pmax, Ebat, B_params, dt,
        #                                                2,
        #                                                (povolitDodavkyDoSiteZBaterie, povolitOdberZeSiteDoBaterie, povolitPrekroceniPmax))

        else:
            txt = 'Neznámý typ optimalizace!'
            print(txt)
            infoConsole.insertPlainText(txt+'\n\n')
            break
        
        succ.append(success)
        
        
        # Využití baterie ve skutečnosti
        if simulaceSkutecnehoProvozu:
            # Skutečná výroba a spotřeba
            consReal =   data['kWh'][indCurr].values
            suppReal = data['PVkWh'][indCurr].values
            battReal, battRestCharge = batteryRealityLosses(battPred, consReal, suppReal, Pmax, Ebat, B_params, dt)
        else:
            battRestCharge = Ebat + np.cumsum(battPred)
            battReal = battPred.copy()
            battReal[battReal>0.0] = battReal[battReal>0.0]/B_effCharge
            battReal[battReal<0.0] = battReal[battReal<0.0]*B_effDischarge
    
        
        # Zápis do tabulky
        data.loc[indCurr, 'BkWh'] = battReal
        data.loc[indCurr, 'BkWh_charge'] = battRestCharge 
        
        # Zobraz progres
        progress.update((step+1)/len(steps))
        
    
    succ = np.array(succ)
    txt = 'Úpěšně zpracováno ' + '{:.1f}'.format(100*succ.sum()/len(succ)).replace('.',',') + '% optimalizačních výpočtů'
    print(txt)
    infoConsole.insertPlainText(txt+'\n\n')
    
    if not np.all(succ):
        txt1 = 'Pro ' + str(np.sum(~succ)) + ' ze ' + str(len(succ)) + ' výpočtů nebylo za nastavených podmínek nalezeno řešení'
        txt2 = '(pravděpodobně nelze splnit podmínku Pmax)'
        print(txt1)
        print(txt2)
        infoConsole.insertPlainText(txt1 + ' ' + txt2 + '\n\n')
    print(' ')    
    
    
    
    #%% Vyhodnocení
    dataRed = data[~np.isnan(data['BkWh'])].reset_index(drop=True)
    
    dfCost, dfCostYear, dftimeStr = calculateCost(dataRed, fees, dt=dt)
    battCycles, battCyclesYear    = batteryCycles(dataRed, B_cap, E0=E0, dt=dt)
    
    print(' ')
    print(dftimeStr)
    dfCostForm = printCost(dfCost)
    print(' ')
    print('Počet cyklů baterie: ' + '{:.2f}'.format(battCycles))
    
    print(' ')
    print(' ')
    print('Statisticky za rok:')
    dfCostFormYear = printCost(dfCostYear)
    print(' ')
    print('Počet cyklů baterie: ' + '{:.2f}'.format(battCyclesYear))
    
    
    results = dataRed[['Den', 'DenNazev','DenTyden','DenRok','ISOtyden','Svatek']][::24]
    results = results.reset_index(drop=True)
    
    days = results['Den'].values
    res = np.zeros((len(days), 4))
    
    for i in range(len(days)):
        dfcost, _, _ = calculateCost(dataRed, fees, ind=dataRed['Den']==days[i])
        res[i, :] = dfcost['Náklady (Kč)'].values
    
    results['Kč_spotřeba']         = res[:, 0]
    results['Kč_spotřeba,FVE']     = res[:, 1]
    results['Kč_spotřeba,baterie'] = res[:, 2]
    results['Kč_spotřeba,FVE,bat'] = res[:, 3]
    
    
    # Bilance energie
    dataRed['SumaNaklady_Kc'] = costArray((dataRed['BkWh']+dataRed['kWh']+dataRed['PVkWh']).values, dataRed['Kč/kWh'].values, fees)
    
    dfEnergyForm, dfEnergyFormYear = energyBalance(dataRed, dt)
    dfFinanceForm, dfFinanceFormYear = financialBalance(dataRed, fees, dt)
    
    print(' ')
    print(' ')
    print('Bilance energie statisticky za rok:')
    print(dfEnergyFormYear)
    print(' ')
    
    print(' ')
    print(' ')
    print('Bilance financí statisticky za rok:')
    print(dfFinanceFormYear)
    print(' ')

    
    #%% Export
    if export:
        with pd.ExcelWriter(exportFile) as writer:  
            results.to_excel(writer, sheet_name='Po dnech', index=False)
            dataRed.to_excel(writer, sheet_name='Po hodinách', index=False)
    
    
    return {'data':               data, 
            'dataRed':            dataRed, 
            'battCycles':         battCycles, 
            'battCyclesYear':     battCyclesYear, 
            'timeString':         dftimeStr, 
            'dfCostForm':         dfCostForm, 
            'dfCostFormYear':     dfCostFormYear, 
            'dfEnergyForm':       dfEnergyForm,
            'dfEnergyFormYear':   dfEnergyFormYear,
            'dfFinanceForm':      dfFinanceForm,
            'dfFinanceFormYear':  dfFinanceFormYear
            }



