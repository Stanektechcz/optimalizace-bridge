#%% Popis
#
# Dokáže načíst excelové soubor xls, nebo xlsx
# Název souboru musí být ve formátu 'odberovy_diagram_xxx.xlxs', kde xxx může být cokoliv
# Soubor musí být v nastavené složce, defaultně 'data_input/'
# Načítá pouze první list v excelu, který musí mít minimálně dva sloupce:
#    - časová data s 15 minutovým intervalem ve formátu 'den.měsíc.rok hodina:minuta'
#      hlavička sloupce musí být buď 'Čas', 'Datum', nebo 'Datum a čas'
#    - data činné spotřeby v kWh nebo kW
#      hlavička sloupce musí být obsahovat "kWh" nebo "kW"
#
# 230513 - lze zadat více čísel diagramů oddělených čárkou, mezerou nebo středníkem
#          vybrané diagramy se sečtou do jednoho
# 230615 - po hodině to nějak nefakčí dobře, viz KOWAC


#%%
import pandas as pd
import numpy as np

from os import listdir
from os.path import isfile

from libs.funsData import intersect, readExcel



#%%

def getFiles(dataPath = 'data_input/'):
    files = [f for f in listdir(dataPath) if isfile(dataPath+f)]
    files = [f for f in files if f.split('.')[-1] in ['xls', 'xlsx']]
    files = [f for f in files if f[:3].lower() == 'od_']
    return files
    

def loadData(sel, dataPath = 'data_input/', outpPath = 'data_ready/', progressBar=None):
    if progressBar != None: progressBar.setValue(10)
    
    frames = [None for i in range(len(sel))]
    print(' ')
    for i, file in enumerate(sel):
        print('Zpracovává se soubor : ' + file)
        
        frames[i] = readExcel(dataPath + file)
        
        if progressBar != None: progressBar.setValue(int(np.round(90*((i+1)/len(sel) + 0.1)/1.1)))
    
    
    #%%
    if len(frames) == 1:
        data = frames[0]
    else:
        print(' ')
        print('Vytváří se součet diagramů v časovém průniku')
        
    
        ids = [None for i in range(len(frames))]
        for i in range(len(ids)):
            ids[i] = [(d + pd.Timedelta(h-1, 'h')).strftime('%Y%m%d%H') for d, h in zip(frames[i]['Den'], frames[i]['Hodina'])]
    
        
        monolith = np.concatenate(ids)
        unq, counts = np.unique(monolith, return_counts=True)
        subset = unq[counts == len(ids)]
        
        inds = [np.intersect1d(idi, subset, return_indices=True)[1] for idi in ids]
        
        
        for i, frame in enumerate(frames):
            frames[i] = frame.iloc[inds[i]].reset_index(drop=True)
        
        
        data = frames[0].copy()
        for i in range(1, len(frames)):
            data['kWh'] += frames[i]['kWh']
    
        if progressBar != None: progressBar.setValue(95)

    
    
    #%% Save
    data.to_pickle(outpPath + 'consumption.pkl')
    
    time = data['Den'].values
    form = '%d.%m.%Y'
    if any(time):
        t0 = time[ 0].astype('datetime64[s]').item().strftime(form)
        t1 = time[-1].astype('datetime64[s]').item().strftime(form)
        timeStr = ';'.join([t0, t1, str(len(time))])
    else:
        timeStr = ';'.join(['', '', '0'])

    with open(outpPath + 'info_files.txt', 'w' ,encoding='utf8') as f:
        f.write(timeStr + '\n' + '\n'.join(sel))
    
    
    #%% Intersect price, weather, consuption
    intersect(outpPath)
    
    if progressBar != None: progressBar.setValue(100)
    
    print(' ')    
    print('Data úspěšně zpracována')    
    

