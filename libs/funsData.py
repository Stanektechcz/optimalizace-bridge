import pandas as pd
import numpy as np


#%%
def intersect(dataPath, remove_incomplete_days=True, save=True, consumption_year=None):
    frames = [pd.read_pickle(dataPath + 'prices.pkl'),
              pd.read_pickle(dataPath + 'weather.pkl'),
              pd.read_pickle(dataPath + 'consumption.pkl')]
    
    
    if consumption_year is not None:
        # print(frames[2]['Den'][5])
        years = [t.year  for t in frames[2]['Den']]
        
        values, counts = np.unique(years, return_counts=True)
        
        dy = consumption_year - values[np.argmax(counts)]
        if dy != 0:
            frames[2]['Den'] = frames[2]['Den'] + np.timedelta64(int(np.round((365*dy)/7))*7, 'D')
            # print(frames[2]['Den'][5])
        
    
    #%
    ids = [(f['Den'].astype(str) + '_' +  f['Hodina'].astype(str)).to_numpy() for f in frames]
    
    
    monolith = np.concatenate(ids)
    unq, counts = np.unique(monolith, return_counts=True)
    subset = unq[counts == len(ids)]
    
    
    inds = [np.intersect1d(idi, subset, return_indices=True)[1] for idi in ids]
    # _, x_ind, _ = np.intersect1d(ids[0], subset, return_indices=True)
    
    
    
    #%
    merged = frames[0].iloc[inds[0]].reset_index(drop=True)
    
    for i in range(1, len(ids)):
        merged = pd.merge(merged, frames[i].iloc[inds[i]].reset_index(drop=True), how = "inner")
    
    
    days = merged['Den'].values
    deltas = np.array([pd.Timedelta(hours=h-1) for h in merged['Hodina']])
    
    time = [day+delta for day, delta in zip(days, deltas)]
    
    # merged['t0'] = time
    merged.insert(0, 't0', time)
    
    merged = merged.sort_values(by='t0').reset_index(drop=True)
    
    # Add date-related columns required by process.py
    import locale
    try:
        locale.setlocale(locale.LC_TIME, 'cs_CZ.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_TIME, 'Czech_Czechia.1250')
        except:
            pass  # Use default locale
    
    # DenNazev - day name (Po, Út, St, Čt, Pá, So, Ne)
    merged['DenNazev'] = pd.to_datetime(merged['Den']).dt.strftime('%a')
    
    # DenTyden - day of week (1=Monday, 7=Sunday)
    merged['DenTyden'] = pd.to_datetime(merged['Den']).dt.dayofweek + 1
    
    # DenRok - day of year (1-366)
    merged['DenRok'] = pd.to_datetime(merged['Den']).dt.dayofyear
    
    # ISOtyden - ISO week number (1-53)
    merged['ISOtyden'] = pd.to_datetime(merged['Den']).dt.isocalendar().week
    
    # Svatek - holiday flag (0=workday, 1=holiday)
    # For now, set weekends as holidays (can be extended with Czech holidays)
    merged['Svatek'] = (merged['DenTyden'] >= 6).astype(int)
    
    # Reorder columns to match expected order
    cols = ['t0', 'Den', 'DenNazev', 'DenTyden', 'DenRok', 'ISOtyden', 'Svatek', 'Hodina']
    other_cols = [c for c in merged.columns if c not in cols]
    merged = merged[cols + other_cols]
    
    
    #% Remove incomplete days
    if remove_incomplete_days:
        udays = np.unique(days)
        for day in udays:
            inds = merged['Den'] == day
            if np.sum(inds) != 24:
                merged = merged[~inds].reset_index(drop=True)
    
    
    #%
    if save:
        merged.to_pickle(dataPath + '_intersected.pkl')
    
        time = merged['Den'].values
        form = '%d.%m.%Y'
        if any(time):
            t0 = time[ 0].astype('datetime64[s]').item().strftime(form)
            t1 = time[-1].astype('datetime64[s]').item().strftime(form)
            timeStr = ';'.join([t0, t1, str(len(time))])
        else:
            timeStr = ';'.join(['', '', '0'])
    
        with open(dataPath + 'info_intersection.txt', 'w') as f:
            f.write(timeStr)
    
    
    return merged


def readExcel(dataFile):
    data = pd.read_excel(dataFile, decimal=',')
    data = data.dropna(how='any')
    
    rename = {'Čas':'Cas',
              'Datum':'Cas',
              'Datum a čas':'Cas'
              # '+A/84000591 [kW]':'kW',
              # 'Profil +A [kW]':'kW',
              # 'Činná spotřeba (kW)':'kW'
              }
    
    data.rename(columns = rename, inplace = True)
    
    
    nkWh = [n for n in data.columns if 'kwh' in n.lower()]
    nkW  = [n for n in data.columns if 'kw' in n.lower()]
    
    if any(nkWh):
        if len(nkWh) > 1:
            print('')
            print('POZOR: Nalezeno více sloupců s jednotkou "kWh" v názvu!')
            print('Zpracovává se první v pořadí')
        data.rename(columns = {nkWh[0]: 'kWh'}, inplace = True)
    elif any(nkW):
        if len(nkW) > 1:
            print('')
            print('POZOR: Nalezeno více sloupců s jednotkou "kW" v názvu!')
            print('Zpracovává se první v pořadí')
        data.rename(columns = {nkW[0]: 'kW'}, inplace = True)
    else:
        raise Exception('Nenalezen žádný sloupec s jednotkou "kWh" nebo "kW" v názvu')
        
    
    if data['Cas'].dtype == 'object':
        try:
            data['Cas'] = pd.to_datetime(data['Cas'], format='%d.%m.%Y %H:%M')
        except ValueError:
            raise ValueError('Špatný formát času')
    
    
    # To CET time without DST
    dt = np.diff(data['Cas'].values)/np.timedelta64(60, 's')
    # dts = np.unique(dt)
    
    dtm = int(np.round(dt.mean()))
    
    if dtm == 15:
        isummer = np.where(dt ==  75)[0]
    elif dtm == 60:
        isummer = np.where(dt ==  120)[0]
    
    if np.any(isummer):
        isummer = isummer[0]
    else:
        isummer = 0
    
    
    if dtm == 15:
        iwinter = np.where(dt == -45)[0]
    elif dtm == 60:
        iwinter = np.where(dt == 0)[0]

    if np.any(iwinter):
        iwinter = iwinter[0]
    else:
        iwinter = len(dt)-1
    
    t = data['Cas'].values
    t[isummer+1:iwinter+1] = t[isummer+1:iwinter+1] - np.timedelta64(3600, 's')
    
    data['Cas'] = t
    
    dt = np.diff(data['Cas'].values)/np.timedelta64(60, 's')
    # dts = np.unique(dt)
    
    
    
    data['Datum'] = (data['Cas'] - pd.Timedelta(1, 's')).dt.date
    # data['Datum'] = [tim.date() for tim in (data['Cas'] - pd.Timedelta(1, 's'))]
    data['Datum'] = pd.to_datetime(data['Datum'])
    data['Hodina'] = [tim.hour+1 for tim in (data['Cas'] - pd.Timedelta(1, 's'))]
    
    
    
    #%
    agregated = pd.DataFrame()
    days = np.unique(data['Datum'].to_numpy())
    
    sumORmean = 1 if 'kWh' in data.columns else 0
    
    for day in days:
        sub = data[data['Datum'] == day].reset_index(drop=True)
        hours = np.unique(data['Hodina'].to_numpy()) # nemá být sub['Hodina']? viz KOWAC
        
        if sumORmean:
            energy = [np.sum(sub['kWh'][sub['Hodina'] == h]) for h in hours]
        else:
            energy = [np.mean(sub['kW'][sub['Hodina'] == h]) for h in hours]
    
        dummy = pd.DataFrame()
        dummy['kWh'] = energy
        dummy['Hodina'] = hours
        dummy['Den'] = day
        
        dummy = dummy[['Den', 'Hodina', 'kWh']]
        
        agregated = pd.concat([agregated, dummy]).reset_index(drop=True)
    
    
        
    #% Remove days with NaNs
    nans = np.isnan(agregated['kWh'].values)
    while np.any(nans):
        nansi = np.where(nans)[0]
        agregated = agregated.drop(agregated.index[agregated['Den']==agregated['Den'][nansi[0]]])
        agregated = agregated.reset_index(drop=True)
        nans = np.isnan(agregated['kWh'].values)
    
    return agregated


