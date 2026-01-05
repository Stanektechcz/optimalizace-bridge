import numpy as np
from gekko import GEKKO

# https://www.researchgate.net/figure/Relationship-between-GHI-W-m-2-and-PV-Power-Watts-determined-at-NREL_fig1_331175630
# https://www.hukseflux.com/applications/solar-energy-pv-system-performance-monitoring/how-to-calculate-pv-performance-ratio
# http://www.fvepanel.cz/fotovoltaicky-panel-550-wp/
# https://entuzio.cz/nejvykonnejsi-fotovoltaicke-panely/
# PV performance ratio - 70 - 85%?



def getBounds(N, suma, Pmax, B_params, dt, conditions=None):
    _, _, _, B_effCharge,   B_effDischarge, \
             B_speedCharge, B_speedDischarge = B_params

    if conditions:
        allowBatt2Network, allowNet2Batt, allowPmaxOvershoot  = conditions
    else:
        allowBatt2Network, allowNet2Batt, allowPmaxOvershoot = True, True, True


    
    if allowBatt2Network and allowPmaxOvershoot:
        bLo = np.full((N), -B_speedDischarge*dt)
    elif allowBatt2Network:
        bLo = np.max(np.column_stack(((Pmax[0]*dt - suma)/B_effDischarge, 
                                         np.full(N, -B_speedDischarge*dt))), axis=1)

        ind = bLo > 0.0
        if np.any(ind):
            bLo[ind] = 0.0

    else:
        sumalo = suma.copy()
        sumalo[sumalo < 0.0] = 0.0    
        bLo = np.max(np.column_stack((-sumalo/B_effDischarge, 
                                       np.full(N, -B_speedDischarge*dt))), axis=1)
        

    
    if allowNet2Batt and allowPmaxOvershoot:
        bHi = np.full((N), B_speedCharge*dt)
    elif allowNet2Batt:
        bHi = np.min(np.column_stack(((Pmax[1]*dt - suma)*B_effCharge, 
                                       np.full(N, B_speedCharge*dt))), axis=1)

        ind = bHi < 0.0
        if np.any(ind):
            bHi[ind] = 0.0
    else:
        sumahi = suma.copy()
        sumahi[sumahi > 0.0] = 0.0    
        bHi = np.min(np.column_stack((-sumahi*B_effCharge, 
                                       np.full(N, B_speedCharge*dt))), axis=1)
        
    return bLo, bHi




#%% Optimalizace průběhu baterie
def battOptPriceLossesAPOPT(price, cons, supp, Pmax, E0, B_params, dt, fees=None, conditions=None):
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params

    suma = cons+supp

    N = len(suma)

    if B_cap <= 0.0:
        return np.zeros((N,)), False

    if fees:
        feeCons, feeSupp  = fees
    else:
        feeCons, feeSupp = 0.0, 0.0
    
    lp = 1/B_effCharge
    ln = B_effDischarge

    print(price, cons+supp, fees, E0, B_params)

    boundsLower, boundsUpper = getBounds(N, suma, Pmax, B_params, dt, conditions)

    # Initialize Model
    m = GEKKO(remote=False) # use local solver
    
    #Set global options
    m.options.SOLVER = 1 #APOPT
    
    # Init battery changes array
    dB = m.Array(m.Var, (N,))
    for i in range(N):
        dB[i].value = 0.0
        dB[i].lower = boundsLower[i]
        dB[i].upper = boundsUpper[i]
    
    # Constrains for battery min and max capacity
    for i in range(N):
        m.Equation(m.sum(dB[:i+1]) <= B_cap*B_max - E0)
        m.Equation(m.sum(dB[:i+1]) >= B_cap*B_min - E0)
    
    # Energy sum with sign dependent losses
    switchLoss = [m.if3(dB[i], ln, lp) for i in range(N)]
    Esum = [m.Intermediate(switchLoss[i]*dB[i] + suma[i]) for i in range(N)]
    
    # Costs with sign dependent fees
    switchFee = [m.if3(Esum[i], feeSupp, feeCons) for i in range(N)]
    costs = [m.Intermediate((switchFee[i]+price[i])*Esum[i]) for i in range(N)]
    
    #Objective
    m.Minimize(m.sum(costs))
    
    #Solve simulation
    m.solve(disp=True, debug=False)
    
    res = m.options.SOLVESTATUS
    
    battOpt = np.array([v[0] for v in dB.tolist()])

    
    return battOpt, res



