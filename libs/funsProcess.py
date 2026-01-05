import numpy as np
from scipy.optimize import linprog

# https://www.researchgate.net/figure/Relationship-between-GHI-W-m-2-and-PV-Power-Watts-determined-at-NREL_fig1_331175630
# https://www.hukseflux.com/applications/solar-energy-pv-system-performance-monitoring/how-to-calculate-pv-performance-ratio
# http://www.fvepanel.cz/fotovoltaicky-panel-550-wp/
# https://entuzio.cz/nejvykonnejsi-fotovoltaicke-panely/
# PV performance ratio - 70 - 85%?



def checkTimeline(time, dt_norm):
    dtime = np.diff(time)/np.timedelta64(3600, 's')
    return np.all(dtime == dt_norm)



def getEpEnLimits(N, suma, Pmax, B_params, dt, conditions=None):
    _, _, _, B_effCharge,   B_effDischarge, \
             B_speedCharge, B_speedDischarge = B_params

    if conditions:
        allowBatt2Network, allowNet2Batt, allowPmaxOvershoot  = conditions
    else:
        allowBatt2Network, allowNet2Batt, allowPmaxOvershoot = True, True, True


    bXnHi = np.zeros(N)
    bXpLo = np.zeros(N)
    
    if allowBatt2Network and allowPmaxOvershoot:
        bXnLo = np.full((N), -B_speedDischarge*dt)
    elif allowBatt2Network:
        bXnLo = np.max(np.column_stack(((Pmax[0]*dt - suma)/B_effDischarge, 
                                         np.full(N, -B_speedDischarge*dt))), axis=1)
        # Spodní limit záporných proměnných nesmí být kladný
        # Musím nejdřív upravit spodní limit kladných prom., ale nesmím nad jejich horní limit (uplne na konci *)
        ind = bXnLo > 0.0
        if np.any(ind):
            bXpLo[ind] = bXnLo[ind]*B_effCharge*B_effDischarge
            bXnLo[ind] = 0.0

    else:
        sumalo = suma.copy()
        sumalo[sumalo < 0.0] = 0.0    
        bXnLo = np.max(np.column_stack((-sumalo/B_effDischarge, 
                                         np.full(N, -B_speedDischarge*dt))), axis=1)
        

    
    if allowNet2Batt and allowPmaxOvershoot:
        bXpHi = np.full((N), B_speedCharge*dt)
    elif allowNet2Batt:
        bXpHi = np.min(np.column_stack(((Pmax[1]*dt - suma)*B_effCharge, 
                                         np.full(N, B_speedCharge*dt))), axis=1)
        # Horní limit kladných proměnných nesmí být záporný
        # Musím nejdřív upravit horní limit záporných prom., ale nesmím pod jejich spodní limit
        ind = bXpHi < 0.0
        if np.any(ind):
            bXnHi[ind] = bXpHi[ind]/B_effCharge/B_effDischarge
            bXnHi[bXnHi<bXnLo] = bXnLo[bXnHi<bXnLo]
            bXpHi[ind] = 0.0
    else:
        sumahi = suma.copy()
        sumahi[sumahi > 0.0] = 0.0    
        bXpHi = np.min(np.column_stack((-sumahi*B_effCharge, 
                                         np.full(N, B_speedCharge*dt))), axis=1)
        
    
    
    # *) Spodní limit kladných proměnných nesmí nad jejich horní limit
    ind = bXpLo > bXpHi
    if np.any(ind):
        bXpLo[ind] = bXpHi[ind]
    
    
    return bXpLo, bXpHi, bXnLo, bXnHi




#%% Optimalizace průběhu baterie
def battOptPriceLosses(price, cons, supp, Pmax, E0, B_params, dt, fees=None, conditions=None):
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params

    if fees:
        feeCons, feeSupp  = fees
    else:
        feeCons, feeSupp = 0.0, 0.0


    N = len(price)
    if B_cap <= 0.0:
        return np.zeros((N,)), False

    cp = price + feeCons
    cn = price + feeSupp
    suma = cons+supp
    
    
    lp = 1/B_effCharge
    ln = B_effDischarge

    c = np.zeros(5*N)
    c[-N:] = 1
    suma = cons+supp
    
    I = np.eye(N)
    Z = np.zeros((N,N))
    T = np.tri(N)
    Dcp = np.diag(cp)
    Dcn = np.diag(cn)

    
    bub1 =  np.full((N,), B_cap*B_max - E0)
    bub2 = -np.full((N,), B_cap*B_min - E0)
    
    Aub = np.vstack((np.column_stack(( T,  T, Z, Z, Z)), 
                     np.column_stack((-T, -T, Z, Z, Z))))
    bub = np.concatenate((bub1, bub2))
    
    
    Aeq = np.vstack((np.column_stack((lp*I, ln*I,  -I,  -I,  Z)), 
                     np.column_stack((   Z,    Z, Dcp, Dcn, -I))))
    beq = np.concatenate((-suma, np.zeros(N)))
    
    

    lims = getEpEnLimits(N, suma, Pmax, B_params, dt, conditions)
    bXpLo, bXpHi, bXnLo, bXnHi = lims
    
    bXlo =  list(bXpLo)
    bXlo += list(bXnLo)
    bXlo += [0] * N
    bXlo += [None] * N
    bXlo += [None] * N

    bXhi =  list(bXpHi)
    bXhi += list(bXnHi)
    bXhi += [None] * N
    bXhi += [0] * N
    bXhi += [None] * N
    
    bX = [(lo, hi) for lo, hi in zip(bXlo, bXhi)]
    
    
    res = linprog(c, A_ub=Aub, b_ub=bub, A_eq=Aeq, b_eq=beq, bounds=bX)

    
    success = res.success
    if success:
        battOpt = res.x[:N] + res.x[N:2*N]
    else:
        battOpt = np.zeros((N,))
    
    return battOpt, success



def battOptPeaksLosses(consPred, suppPred, Pmax, E0, B_params, dt, conditions=None):
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params

    N = len(consPred)
    if B_cap <= 0.0:
        return np.zeros((N,)), False


    lp = 1/B_effCharge
    ln = B_effDischarge

    c = np.zeros(2*N+1)
    c[-1] = 1
    suma = consPred+suppPred

    I = np.eye(N)
    # Z = np.zeros((N,N))
    T = np.tri(N)


    b0 = -suma
    b1 =  np.full((N,), B_cap*B_max - E0)
    b2 = -np.full((N,), B_cap*B_min - E0)
    
    Aub = np.vstack((np.column_stack(( lp*I,   ln*I, -np.ones(N))), 
                     np.column_stack((    T,      T,  np.zeros(N))), 
                     np.column_stack((   -T,     -T,  np.zeros(N)))))
    bub = np.concatenate((b0, b1, b2))

    

    lims = getEpEnLimits(N, suma, Pmax, B_params, dt, conditions)
    bXpLo, bXpHi, bXnLo, bXnHi = lims

    
    bXlo =  list(bXpLo)
    bXlo += list(bXnLo)
    bXlo.append(0)

    bXhi =  list(bXpHi)
    bXhi += list(bXnHi)
    bXhi.append(None)
    
    bX = [(lo, hi) for lo, hi in zip(bXlo, bXhi)]
    
    res = linprog(c, A_ub=Aub, b_ub=bub, bounds=bX)
    
    success = res.success
    if success:
        battOpt = res.x[:N] + res.x[N:2*N]
    else:
        battOpt = np.zeros((N,))
    
    return battOpt, success



def battOptAbsPeaksLosses(cons, supp, Pmax, E0, B_params, dt, conditions=None):
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params
    
    N = len(cons)
    if B_cap <= 0.0:
        return np.zeros((N,)), False

    lp = 1/B_effCharge
    ln = B_effDischarge

    c = np.zeros(2*N+1)
    c[-1] = 1
    suma = cons+supp
    
    I = np.eye(N)
    # Z = np.zeros((N,N))
    T = np.tri(N)

    
    bub0 = suma
    bub1 =  np.full((N,), B_cap*B_max - E0)
    bub2 = -np.full((N,), B_cap*B_min - E0)
    
    Aub = np.vstack((np.column_stack(( lp*I,   ln*I, -np.ones(N))), 
                     np.column_stack((-lp*I,  -ln*I, -np.ones(N))), 
                     np.column_stack((    T,      T,  np.zeros(N))), 
                     np.column_stack((   -T,     -T,  np.zeros(N)))))
    bub = np.concatenate((-bub0, bub0, bub1, bub2))

    

    lims = getEpEnLimits(N, suma, Pmax, B_params, dt, conditions)
    bXpLo, bXpHi, bXnLo, bXnHi = lims

    
    bXlo =  list(bXpLo)
    bXlo += list(bXnLo)
    bXlo.append(0)

    bXhi =  list(bXpHi)
    bXhi += list(bXnHi)
    bXhi.append(None)
    
    bX = [(lo, hi) for lo, hi in zip(bXlo, bXhi)]
    
    
    res = linprog(c, A_ub=Aub, b_ub=bub, bounds=bX)
    
    success = res.success
    if success:
        battOpt = res.x[:N] + res.x[N:2*N]
    else:
        battOpt = np.zeros((N,))
    
    return battOpt, success


def battOptSumAbsPeaksLosses(cons, supp, Pmax, E0, B_params, dt, conditions=None):
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params
    
    N = len(cons)
    if B_cap <= 0.0:
        return np.zeros((N,)), False

    lp = 1/B_effCharge
    ln = B_effDischarge

    c = np.zeros(3*N)
    c[-N:] = 1
    suma = cons+supp
    
    I = np.eye(N)
    Z = np.zeros((N,N))
    T = np.tri(N)

    
    bub0 = suma
    bub1 =  np.full((N,), B_cap*B_max - E0)
    bub2 = -np.full((N,), B_cap*B_min - E0)
    
    Aub = np.vstack((np.column_stack(( lp*I,   ln*I, -I)), 
                     np.column_stack((-lp*I,  -ln*I, -I)), 
                     np.column_stack((    T,      T,  Z)), 
                     np.column_stack((   -T,     -T,  Z))))
    bub = np.concatenate((-bub0, bub0, bub1, bub2))

    

    lims = getEpEnLimits(N, suma, Pmax, B_params, dt, conditions)
    bXpLo, bXpHi, bXnLo, bXnHi = lims

    
    bXlo =  list(bXpLo)
    bXlo += list(bXnLo)
    bXlo += [0]*N

    bXhi =  list(bXpHi)
    bXhi += list(bXnHi)
    bXhi += [None]*N
    
    bX = [(lo, hi) for lo, hi in zip(bXlo, bXhi)]
    
    
    res = linprog(c, A_ub=Aub, b_ub=bub, bounds=bX)
    
    success = res.success
    if success:
        battOpt = res.x[:N] + res.x[N:2*N]
    else:
        battOpt = np.zeros((N,))
    
    return battOpt, success



def battOptSumEnergyLosses(cons, supp, Pmax, E0, B_params, dt, typ=0, conditions=None):
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params


    suma = cons+supp
    N = len(suma)

    if B_cap <= 0.0:
        return np.zeros((N,)), False


    cC = 1
    cS = 1
    if typ == 1:
        cS = 0
    elif typ == 2:
        cC = 0
        
    
    lp = 1/B_effCharge
    ln = B_effDischarge

    c = np.zeros(5*N)
    c[-N:] = 1
    suma = cons+supp
    
    I = np.eye(N)
    Z = np.zeros((N,N))
    T = np.tri(N)
    
    bub1 =  np.full((N,), B_cap*B_max - E0)
    bub2 = -np.full((N,), B_cap*B_min - E0)
    
    Aub = np.vstack((np.column_stack(( T,  T, Z, Z, Z)), 
                     np.column_stack((-T, -T, Z, Z, Z))))
    bub = np.concatenate((bub1, bub2))
    
    
    Aeq = np.vstack((np.column_stack((lp*I, ln*I, -I,    -I,     Z)), 
                     np.column_stack((   Z,    Z,  I*cC, -I*cS, -I))))
    beq = np.concatenate((-suma, np.zeros(N)))
    
    

    lims = getEpEnLimits(N, suma, Pmax, B_params, dt, conditions)
    bXpLo, bXpHi, bXnLo, bXnHi = lims
    
    bXlo =  list(bXpLo)
    bXlo += list(bXnLo)
    bXlo += [0] * N
    bXlo += [None] * N
    bXlo += [None] * N

    bXhi =  list(bXpHi)
    bXhi += list(bXnHi)
    bXhi += [None] * N
    bXhi += [0] * N
    bXhi += [None] * N
    
    bX = [(lo, hi) for lo, hi in zip(bXlo, bXhi)]
    
    
    res = linprog(c, A_ub=Aub, b_ub=bub, A_eq=Aeq, b_eq=beq, bounds=bX)

    
    success = res.success
    if success:
        battOpt = res.x[:N] + res.x[N:2*N]
    else:
        battOpt = np.zeros((N,))
    
    return battOpt, success




#%% Simulace reálného provozu
def batteryReality(battPred, consReal, suppReal, E0, B_params):
    decisionLimit = 0.01
    
    B_cap, B_max, B_min, B_effCharge,   B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params


    battReal = np.zeros_like(battPred)
    battRestCharge = np.zeros_like(battPred)

    charge = E0
    for i in range(len(battReal)):
        if   battPred[i] >=  decisionLimit*B_cap:
            if battPred[i] + charge <= B_cap*B_max:
                battReal[i] = battPred[i]
            else:
                battReal[i] = B_cap*B_max - charge
                
        elif battPred[i] <= -decisionLimit*B_cap:
            if battPred[i] >= -(consReal[i]+suppReal[i]):
                battReal[i] = battPred[i]
            else:
                battReal[i] = -(consReal[i]+suppReal[i])
            
            # Můžu dodat maximálně to co je v baterii minus rezerva
            if battReal[i] < -(charge - B_cap*B_min):
                battReal[i] = -(charge - B_cap*B_min)
        
        charge += battReal[i]
        battRestCharge[i] = charge

    return battReal, battRestCharge


def batteryRealityLosses(battPred, consReal, suppReal, Pmax15, E0, B_params, dt):
    decisionLimit = 0.001
    
    B_cap, B_max, B_min, B_effCharge, B_effDischarge, \
                         B_speedCharge, B_speedDischarge = B_params

    
    battReal = np.zeros_like(battPred)
    battRestCharge = np.zeros_like(battPred)

    charge = E0
    for i in range(len(battReal)):
        if   battPred[i] >= decisionLimit*B_cap:
            if battPred[i] + charge <= B_cap*B_max:
                toBatt = battPred[i]
            else:
                toBatt = B_cap*B_max - charge

            
            # Nesmím překročit Pmax
            if toBatt/B_effCharge + consReal[i]+suppReal[i] > Pmax15*dt:
                toBatt = (Pmax15*dt - consReal[i]+suppReal[i])*B_effCharge

                # Pokusí se redukovat max, i když podle plánu měl právě sosat
                if toBatt/B_effDischarge < B_cap*B_min - charge: 
                    toBatt = B_cap*B_min - charge

            # Nesmím překročit kapacitu baterie
            if toBatt + charge > B_cap*B_max:
                toBatt = B_cap*B_max - charge
            
            if toBatt >= 0.0:
                battReal[i] = toBatt/B_effCharge
            else:
                battReal[i] = toBatt/B_effDischarge
            charge += toBatt
                
        elif battPred[i] <= -decisionLimit*B_cap:
            if battPred[i] >= (consReal[i]+suppReal[i]):
                fromBatt = battPred[i]
            else:
                fromBatt = -(consReal[i]+suppReal[i])
                
            fromBattLoss = fromBatt/B_effDischarge

            # Nesmím se dostat pod rezervu
            if (charge + fromBattLoss) < B_cap*B_min:
                battReal[i] = -(charge - B_cap*B_min)*B_effDischarge
                charge = B_cap*B_min
            else:
                charge += fromBattLoss
                battReal[i] = fromBatt

        battRestCharge[i] = charge
        
    return battReal,  battRestCharge



