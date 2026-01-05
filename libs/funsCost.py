import numpy as np
import pandas as pd



def batteryCycles(data, B_cap, E0=0, dt=1, ind=None):
    if ind is not None:
        # dBatt = np.diff(data['BkWh_charge'][ind], prepend=E0)
        dBatt = data['BkWh'][ind].values
    else:
        # dBatt = np.diff(data['BkWh_charge'], prepend=E0)
        dBatt = data['BkWh'].values

    Ncycles = np.sum(np.abs(dBatt))/B_cap/2
    
    NcyclesYear = Ncycles * 365/(len(dBatt)*dt/24)
    
    return Ncycles, NcyclesYear
    


def calculateCost(data, fees, dt=1, ind=None):
    feeCons, feeSupp = fees
    
    # amortizace fve a bat??
    
    def realCost(ener):
        ip = ener >= 0.0
        im = ener <  0.0
        cost = np.sum((price[ip]+feeCons)*ener[ip]) + np.sum((price[im]+feeSupp)*ener[im])
        return cost
    
    
    if ind is not None:
        days  = data['Den'][ind].values
        price = data['Kč/kWh'][ind].values
        cons  = data['kWh'][ind].values
        supp  = data['PVkWh'][ind].values
        batt  = data['BkWh'][ind].values
    else:
        days  = data['Den'].values
        price = data['Kč/kWh'].values
        cons  = data['kWh'].values
        supp  = data['PVkWh'].values
        batt  = data['BkWh'].values
    
    cC   = realCost(cons)
    cCS  = realCost(cons+supp)
    cCB  = realCost(cons+batt)
    cCSB = realCost(cons+supp+batt)

    sCS  = cCS-cC
    sCB  = cCB-cC
    sCSB = cCSB-cC
    
    if cC > 0.0:
        srCS  = 100.0*sCS/cC
        srCB  = 100.0*sCB/cC
        srCSB = 100.0*sCSB/cC
    else:
        srCS  = np.nan
        srCB  = np.nan
        srCSB = np.nan


    cost = pd.DataFrame()
    cost[' '] = ['Pouze spotřeba', 'Spotřeba a FVE', 'Spotřeba a baterie', 'Spotřeba, FVE, bat']
    cost['Náklady (Kč)'] = [cC,  cCS,  cCB,  cCSB]
    cost['Rozdíl (Kč)']  = [ 0,  sCS,  sCB,  sCSB]
    cost['Rozdíl (%)']   = [ 0, srCS, srCB, srCSB]

    
    const = len(price)*dt/24
    costYear = cost.copy()
    costYear['Náklady (Kč)'] = costYear['Náklady (Kč)']*365/const
    costYear['Rozdíl (Kč)']  = costYear['Rozdíl (Kč)']*365/const


    t0 = days[0].astype('datetime64[s]').item().strftime('%d-%m-%Y')
    t1 = days[-1].astype('datetime64[s]').item().strftime('%d-%m-%Y')
    if t0 == t1:
        timeStr = 'Za den ' + t0 + ':'
    else:
        timeStr = 'Od ' + t0 + ' do ' + t1 + ' (' + str(int(const)) + ' dní):'


    return cost, costYear, timeStr



def printCost(dfcost, show=True):
    df = dfcost.copy()
    
    df.rename(columns = {'Náklady (Kč)' : 'Náklady (tis. Kč)', 
                         'Rozdíl (Kč)' : 'Rozdíl (tis. Kč)'}, inplace = True)

    df['Náklady (tis. Kč)'] = np.round(df['Náklady (tis. Kč)']/1000, 3)
    df['Rozdíl (tis. Kč)'] = np.round(df['Rozdíl (tis. Kč)']/1000, 3)
    df['Rozdíl (%)'] = np.round(df['Rozdíl (%)'], 2)
    
    if show:
        print(df)
    
    return df


#%% Bilance energie
def energyBalance(data, dt=1, ind=None):
    const = len(data)*dt/24
    
    if ind is not None:
        cons  = data['kWh'][ind].values
        supp  = data['PVkWh'][ind].values
        batt  = data['BkWh'][ind].values
    else:
        cons  = data['kWh'].values
        supp  = data['PVkWh'].values
        batt  = data['BkWh'].values
    
    cs  = cons+supp
    cb  = cons+batt
    csb = cons+supp+batt
    
    
    df = pd.DataFrame()
    df[' '] = ['Pouze spotřeba', 'Pouze FVE', 'Pouze baterie', 'Spotřeba a FVE', 'Spotřeba a baterie', 'Spotřeba, FVE, bat']
    df['Suma odběr\n(MWh)']    = [np.sum(cons[cons > 0.0]),
                                  np.sum(supp[supp > 0.0]),
                                  np.sum(batt[batt > 0.0]),
                                  np.sum( cs[cs  > 0.0]),
                                  np.sum( cb[cb  > 0.0]),
                                  np.sum(csb[csb > 0.0])]
    df['Suma dodávka\n(MWh)']  = [np.sum(cons[cons < 0.0]),
                                  np.sum(supp[supp < 0.0]),
                                  np.sum(batt[batt < 0.0]),
                                  np.sum( cs[cs  < 0.0]),
                                  np.sum( cb[cb  < 0.0]),
                                  np.sum(csb[csb < 0.0])]
    df['Suma celkem\n(MWh)']   = [np.sum(cons),
                                  np.sum(supp),
                                  np.sum(batt),
                                  np.sum(cs),
                                  np.sum(cb),
                                  np.sum(csb)]
    
    # Převod na kWh na MWh
    df.loc[:, df.columns != ' '] = np.round(df.loc[:, df.columns != ' '] / 1000, 3)


    dfYear = df.copy()
    dfYear.loc[:, dfYear.columns != ' '] = np.round(dfYear.loc[:, dfYear.columns != ' '] * 365/const, 3)

    return df, dfYear


def costArray(ener, price, fees):
    feeCons, feeSupp = fees
    
    ip = ener >= 0.0
    im = ener <  0.0

    cost = np.zeros_like(ener)
    cost[ip] = (price[ip]+feeCons)*ener[ip]
    cost[im] = (price[im]+feeSupp)*ener[im]
    
    return cost

def financialBalance(data, fees, dt=1, ind=None):
    feeCons, feeSupp = fees
    
    
    const = len(data)*dt/24
    
    if ind is not None:
        price = data['Kč/kWh'][ind].values
        cons  = data['kWh'][ind].values
        supp  = data['PVkWh'][ind].values
        batt  = data['BkWh'][ind].values
    else:
        price = data['Kč/kWh'].values
        cons  = data['kWh'].values
        supp  = data['PVkWh'].values
        batt  = data['BkWh'].values
    
    c   = cons
    s   = supp
    b   = batt
    cs  = c+s
    cb  = c+b
    csb = c+s+b
    
    c_cost   = costArray(c,   price, fees)
    s_cost   = costArray(s,   price, fees)
    b_cost   = costArray(b,   price, fees)
    cs_cost  = costArray(cs,  price, fees)
    cb_cost  = costArray(cb,  price, fees)
    csb_cost = costArray(csb, price, fees)
    
    
    unit = 'tis. Kč'
    df = pd.DataFrame()
    df[' '] = ['Pouze spotřeba', 'Pouze FVE', 'Pouze baterie', 'Spotřeba a FVE', 'Spotřeba a baterie', 'Spotřeba, FVE, bat']
    df[f'Suma odběr\n({unit})']    = [np.sum(  c_cost[c   > 0.0]),
                                      np.sum(  s_cost[s   > 0.0]),
                                      np.sum(  b_cost[b   > 0.0]),
                                      np.sum( cs_cost[cs  > 0.0]),
                                      np.sum( cb_cost[cb  > 0.0]),
                                      np.sum(csb_cost[csb > 0.0])]
    df[f'Suma dodávka\n({unit})']  = [np.sum(  c_cost[c   < 0.0]),
                                      np.sum(  s_cost[s   < 0.0]),
                                      np.sum(  b_cost[b   < 0.0]),
                                      np.sum( cs_cost[cs  < 0.0]),
                                      np.sum( cb_cost[cb  < 0.0]),
                                      np.sum(csb_cost[csb < 0.0])]
    df[f'Suma celkem\n({unit})']   = [np.sum(c_cost),
                                      np.sum(s_cost),
                                      np.sum(b_cost),
                                      np.sum(cs_cost),
                                      np.sum(cb_cost),
                                      np.sum(csb_cost)]
    
    
    # Převod na Kč na tis. Kč
    df.loc[:, df.columns != ' '] = np.round(df.loc[:, df.columns != ' '] / 1000, 3)


    dfYear = df.copy()
    dfYear.loc[:, dfYear.columns != ' '] = np.round(dfYear.loc[:, dfYear.columns != ' '] * 365/const, 3)

    return df, dfYear
