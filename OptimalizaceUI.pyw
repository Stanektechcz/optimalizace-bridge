import os, sys, gc, csv, io
sys.argv += ['-platform', 'windows:darkmode=1']

from datetime import datetime, timedelta


from PySide6.QtWidgets import QApplication, QMainWindow, QListWidgetItem, QFileDialog, QHeaderView
from PySide6.QtWidgets import QWidget, QVBoxLayout, QSizePolicy
from PySide6.QtGui import QIntValidator, QDoubleValidator, QKeySequence
from PySide6.QtCore import QEvent, QDate


from libs.load import getFiles, loadData
from libs.config import readConfig, writeConfig

from libs.process import calculate
from libs.funsCost import batteryCycles, calculateCost, printCost, energyBalance

from libs.funsChart import ChartFull


# import matplotlib
# matplotlib.use('Qt5Agg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg, NavigationToolbar2QT as NavigationToolbar

# import matplotlib.pyplot as plt


def nowString():
    return datetime.now().time().strftime('%H:%M:%S,%f')[:-3]


#%%
uiCompiled = 1

if uiCompiled:
    from ui_design import Ui_MainWindow
else:
    from PySide6.QtUiTools import QUiLoader



#%%
conf = readConfig('settings.ini')

pathXls = conf['Obecne']['slozka_diagramy']
pathPkl = conf['Obecne']['slozka_zpracovane']


resultsType = 1
results = None


#%%
def test(w):
    print('test button')
    # plt.plot(range(10))
    # plt.show()
    
    
    if results is not None:
        # w.fullChartWindows.append(ChartWindow())
        # w.fullChartWindows[-1].show()
        w.fullChartWindows[0] = FullChartWindow(results['dataRed'], styleid=conf['Graf']['stylgrafu'])
        w.fullChartWindows[0].show()
    else:
        print('Nejdříve proveďte výpočet')


def getResults(w):
    global results
    
    w.infoConsole.insertPlainText(nowString() + '\n')
    w.labelCalc.setStyleSheet('QLabel { color : black; }');
    results = calculate(conf, w.progressCalc, w.labelCalc, w.infoConsole)
    showResults(w, results, resultsType)
    
    if any(results):
        w.toolFullChart.setEnabled(True)
        w.checkTimeRange.setEnabled(True)
        userDateRange(w)


def setResultsType(w, value):
    global resultsType
    # resultsType = value
    
    # print(w.groupResType.checkedId() == -2)
    # print(w.groupBilance.checkedId() == -3)
    # print(value)

    resultsType = 1 if w.groupResType.checkedId() == -2 else 0

    showResults(w, results, resultsType)


def atExit():
    writeConfig('settings.ini', conf)

def setConfig(w, param, value):
    if param[1] == 'vnutitrokspotreby':
        if type(value) is bool:
            if not value:
                conf[param[0]][param[1]] = None
                w.lineForceYear.setText('')
        else:
            conf[param[0]][param[1]] = value
                
    else:
        conf[param[0]][param[1]] = value
    
    if param[0] not in ['Export', 'Graf']:
        relevantParamsChanged(w)

def relevantParamsChanged(w):
    if w.progressCalc.value() > 0:
        w.progressCalc.setValue(0)
        w.labelCalc.setStyleSheet('QLabel { color : red; }');
        w.labelCalc.setText('Změna parametrů, výpočet není aktuální!')


def clearClosedCharts(): # To asi neni dobre
    if any(window.ui.fullChartWindows):
        for i in range(len(window.ui.fullChartWindows)):
            if window.ui.fullChartWindows[i] is not None:
                if not window.ui.fullChartWindows[i].isVisible():
                    window.ui.fullChartWindows[i].canvas.ax1.cla()
                    window.ui.fullChartWindows[i].canvas.ax2.cla()
                    window.ui.fullChartWindows[i].canvas.fig.clear()
                    del window.ui.fullChartWindows[i].canvas.ax1
                    del window.ui.fullChartWindows[i].canvas.ax2
                    del window.ui.fullChartWindows[i].canvas.fig
                    del window.ui.fullChartWindows[i].canvas
                    window.ui.fullChartWindows[i].destroy()
                    window.ui.fullChartWindows[i] = None
        gc.collect()
    

def showFullChart(w):
    if results is not None:
        w.fullChartWindows.append(FullChartWindow(results['dataRed'], styleid=conf['Graf']['stylgrafu']))
        w.fullChartWindows[-1].show()
        
    else:
        txt = 'Nejdříve proveďte výpočet'
        print(txt)
        w.infoConsole.insertPlainText(nowString() + '\n')
        w.infoConsole.insertPlainText(txt + '\n\n')
    
    

def initTablesRes(w):
    cols = ['Náklady\n(tis. Kč)', 'Rozdíl\n(tis. Kč)', 'Rozdíl\n(%)']
    rows = ['Pouze spotřeba', 'Spotřeba a FVE', 'Spotřeba, FVE, bat']
    
    w.tableResCost.setHorizontalHeaderLabels(cols)
    w.tableResCost.setVerticalHeaderLabels(rows)
    
    w.tableResCost.horizontalHeader().setSectionResizeMode(QHeaderView.Fixed)
    w.tableResCost.verticalHeader().setSectionResizeMode(QHeaderView.Fixed)
    
    
    cols = ['Suma odběr\n(MWh)', 'Suma dodávka\n(MWh)', 'Suma celkem\n(MWh)']
    rows = ['Pouze spotřeba', 'Pouze FVE', 'Pouze baterie', 'Spotřeba a FVE', 'Spotřeba, FVE, bat']
    
    w.tableResEnergy.setHorizontalHeaderLabels(cols)
    w.tableResEnergy.setVerticalHeaderLabels(rows)
    
    w.tableResEnergy.horizontalHeader().setSectionResizeMode(QHeaderView.Fixed)
    w.tableResEnergy.verticalHeader().setSectionResizeMode(QHeaderView.Fixed)


def fillTableCost(w, df):
    form = ['{:.3f}','{:.3f}','{:.2f}']
    rows = [0,1,3]
    cols = [1,2,3]
    for i, r in enumerate(rows):
        for j, c in enumerate(cols):
            w.tableResCost.item(i, j).setText(form[j].format(df.iat[r, c]).replace('.',','))

def fillTableEnergy(w, df):   
    form = ['{:.3f}','{:.3f}','{:.3f}']
    rows = [0,1,2,3,5]
    cols = [1,2,3]

    row_names = df[' '][rows].to_list()
    col_names = df.columns[cols].to_list()
    
    w.tableResEnergy.setVerticalHeaderLabels(row_names)
    w.tableResEnergy.setHorizontalHeaderLabels(col_names)
    
    w.tableResEnergy.horizontalHeader().setSectionResizeMode(QHeaderView.Fixed)
    w.tableResEnergy.verticalHeader().setSectionResizeMode(QHeaderView.Fixed)

    for i, r in enumerate(rows):
        for j, c in enumerate(cols):
            w.tableResEnergy.item(i, j).setText(form[j].format(df.iat[r, c]).replace('.',','))
    

def showResults(w, results, typ):
    if typ:
        suff = 'Year'
    else:
        suff = ''

    if results is not None:
        fillTableCost(w, results['dfCostForm'+suff])
        
        if w.groupBilance.checkedId() == -2:
            fillTableEnergy(w, results['dfEnergyForm'+suff])
        else:
            fillTableEnergy(w, results['dfFinanceForm'+suff])
        
        w.lineBattCycles.setText('{:.2f}'.format(results['battCycles'+suff]).replace('.',','))


def userDateRangeChecked(w):
    if w.checkTimeRange.isChecked():
        userDateRange(w)
    else:
        showResults(w, results, resultsType)
        
def userDateRange(w):
    d0 = w.dateRange0.date().toPython()
    d1 = w.dateRange1.date().toPython()
    
    ddates = results['dataRed']['Den'].values.astype('M8[D]').astype('O')
    
    if d0 < ddates[0]:
        d0 = ddates[0]
        w.dateRange0.setDate(QDate(*d0.timetuple()[:3]))
    
    if d1 > ddates[-1] + timedelta(days=1):
        d1 = ddates[-1] + timedelta(days=1)
        w.dateRange1.setDate(QDate(*d1.timetuple()[:3]))
    elif d1 <= d0:
        d1 = d0 + timedelta(days=1)
        w.dateRange1.setDate(QDate(*d1.timetuple()[:3]))
    
    
    if w.checkTimeRange.isChecked():
        ind = (ddates >= d0) & (ddates < d1)
        
        
        fees = (conf['Ceny']['feedistribution'] + conf['Ceny']['feetrader'], 
                -conf['Ceny']['feetrader'])
        
        dfCost, _, _ = calculateCost(results['dataRed'], fees, dt=1, ind=ind)
        dfCostForm = printCost(dfCost, False)
        fillTableCost(w, dfCostForm)

        
        dfEnergyForm, _ = energyBalance(results['dataRed'], dt=1, ind=ind)
        fillTableEnergy(w, dfEnergyForm)

    
        battCycles, _    = batteryCycles(results['dataRed'], conf['Baterie']['b_cap'], dt=1, ind=ind)
        w.lineBattCycles.setText('{:.2f}'.format(battCycles).replace('.',','))
    
    

def saveUserSettings(w):
    global conf

    fileDialog = QFileDialog(w)

    fileDialog.setFileMode(QFileDialog.AnyFile)
    fileDialog.setAcceptMode(QFileDialog.AcceptSave)
    fileDialog.setDefaultSuffix('ini')

    fileDialog.setNameFilters(['Konfigurační nastavení (*.ini)'])
    fileDialog.selectNameFilter('Konfigurační nastavení (*.ini)')

    fileDialog.setDirectory(os.getcwd() + '\\user_settings')
    
    fileDialog.exec()
    
    files = fileDialog.selectedFiles()
    if any(files):
        writeConfig(files[0], conf)

def loadUserSettings(w):
    global conf, pathXls, pathPkl

    fileDialog = QFileDialog(w)

    fileDialog.setFileMode(QFileDialog.ExistingFile)
    fileDialog.setAcceptMode(QFileDialog.AcceptOpen)

    fileDialog.setNameFilters(['Konfigurační nastavení (*.ini)'])
    fileDialog.selectNameFilter('Konfigurační nastavení (*.ini)')

    fileDialog.setDirectory(os.getcwd() + '\\user_settings')
    
    fileDialog.exec()
    
    files = fileDialog.selectedFiles()
    if any(files):
        conf = readConfig(files[0])
        pathXls = conf['Obecne']['slozka_diagramy']
        pathPkl = conf['Obecne']['slozka_zpracovane']
        
        config2widgets(w)


def showTimeRange(w):
    with open(pathPkl + 'info_intersection.txt', 'r') as f:
        info = f.readline().split(';')
        info[2] = int(info[2])//24
    
    if info[2] > 0:
        w.labelTimeRange.setStyleSheet('QLabel { color : black; }');
        w.labelTimeRange.setText('Rozsah dat: {} - {} ({} dní)'.format(*info))
        w.buttCalculate.setEnabled(True)
    else:
        w.labelTimeRange.setStyleSheet('QLabel { color : red; }');
        w.labelTimeRange.setText('Vybraná data nemají časový průnik!'.format(*info))
        w.buttCalculate.setEnabled(False)
        

def listFiles(w):
    with open(pathPkl + 'info_files.txt', 'r', encoding='utf8') as f:
        filesLoaded = f.readlines()[1:]

    w.listFilesSel.clear()
    for i, name in enumerate(filesLoaded):
        item = QListWidgetItem(name.split('.')[0][3:], w.listFilesSel)
        item.setData(3, name)
        w.listFilesSel.addItem(item)
    
    showTimeRange(w)


    files = getFiles(pathXls)

    w.listFilesAll.clear()
    for i, name in enumerate(files):
        item = QListWidgetItem(name.split('.')[0][3:], w.listFilesAll)
        item.setData(3, name)
        w.listFilesAll.addItem(item)


def selectFiles(w):
    sel = [item.data(3) for item in w.listFilesAll.selectedItems()]
    
    if any(sel):
        w.listFilesSel.clear()
        for i, name in enumerate(sel):
            item = QListWidgetItem(name.split('.')[0][3:], w.listFilesSel)
            item.setData(3, name)
            w.listFilesSel.addItem(item)
        
        loadData(sel, pathXls, pathPkl, progressBar=w.progressLoad)
        showTimeRange(w)
        relevantParamsChanged(w)


def config2widgets(w):
    validYear = QIntValidator()
    # validYear.setRange(2010, 2030)
    validFloat = QDoubleValidator()
    

    if conf['Optimalizace']['vnutitrokspotreby'] is not None:
        w.checkForceYear.setChecked(True)
        w.lineForceYear.setText(str(conf['Optimalizace']['vnutitrokspotreby']))
    else:
        w.checkForceYear.setChecked(False)
        w.lineForceYear.setText('')

    w.checkForceYear.toggled.connect(lambda state: setConfig(w, ['Optimalizace','vnutitrokspotreby'], state))

    w.lineForceYear.setValidator(validYear)
    w.lineForceYear.editingFinished.connect(lambda: setConfig(w, ['Optimalizace','vnutitrokspotreby'], int(w.lineForceYear.text())))

        
    # optType = [w.radioOptType0, w.radioOptType1, w.radioOptType2]
    # optType[conf['Optimalizace']['optimizationtype']].setChecked(True)
    # w.groupOptType.buttonToggled.connect(lambda butt, togg: setConfig(w, ['Optimalizace','optimizationtype'], int(butt.objectName()[-1])) if togg else None)


    w.comboOptType.setCurrentIndex(conf['Optimalizace']['optimizationtype'])
    w.comboOptType.currentIndexChanged.connect(lambda index: setConfig(w, ['Optimalizace','optimizationtype'], index))

    
    w.checkBattToGrid.setChecked(conf['Optimalizace']['povolitdodavkydositezbaterie'])
    w.checkBattToGrid.toggled.connect(lambda state: setConfig(w, ['Optimalizace','povolitdodavkydositezbaterie'], state))
    
    w.checkBattFromGrid.setChecked(conf['Optimalizace']['povolitodberzesitedobaterie'])
    w.checkBattFromGrid.toggled.connect(lambda state: setConfig(w, ['Optimalizace','povolitodberzesitedobaterie'], state))

    w.checkAllowOverPmax.setChecked(conf['Optimalizace']['povolitprekrocenipmax'])
    w.checkAllowOverPmax.toggled.connect(lambda state: setConfig(w, ['Optimalizace','povolitprekrocenipmax'], state))

    w.checkZeroDiagram.setChecked(conf['Optimalizace']['vynulovatspotrebnidiagram'])
    w.checkZeroDiagram.toggled.connect(lambda state: setConfig(w, ['Optimalizace','vynulovatspotrebnidiagram'], state))

    w.checkUseSuppPrediction.setChecked(conf['Optimalizace']['pouzitpredikcispotreby'])
    w.checkUseSuppPrediction.toggled.connect(lambda state: setConfig(w, ['Optimalizace','pouzitpredikcispotreby'], state))

    w.checkSimulation.setChecked(conf['Optimalizace']['simulaceskutecnehoprovozu'])
    w.checkSimulation.toggled.connect(lambda state: setConfig(w, ['Optimalizace','simulaceskutecnehoprovozu'], state))

    w.checkUseFixPrice.setChecked(conf['Optimalizace']['pouzitfixnicenu'])
    w.checkUseFixPrice.toggled.connect(lambda state: setConfig(w, ['Optimalizace','pouzitfixnicenu'], state))
    
    
    
    w.lineFixPrice.setText(str(conf['Ceny']['pricefix']).replace('.',','))
    w.lineFixPrice.setValidator(validFloat)
    w.lineFixPrice.editingFinished.connect(lambda: setConfig(w, ['Ceny','pricefix'], float(w.lineFixPrice.text().replace(',','.'))))
    
    w.lineFeeDistribution.setText(str(conf['Ceny']['feedistribution']).replace('.',','))
    w.lineFeeDistribution.setValidator(validFloat)
    w.lineFeeDistribution.editingFinished.connect(lambda: setConfig(w, ['Ceny','feedistribution'], float(w.lineFeeDistribution.text().replace(',','.'))))

    w.lineFeeTrader.setText(str(conf['Ceny']['feetrader']).replace('.',','))
    w.lineFeeTrader.setValidator(validFloat)
    w.lineFeeTrader.editingFinished.connect(lambda: setConfig(w, ['Ceny','feetrader'], float(w.lineFeeTrader.text().replace(',','.'))))



    w.lineBcap.setText(str(conf['Baterie']['b_cap']).replace('.',','))
    w.lineBcap.setValidator(validFloat)
    w.lineBcap.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_cap'], float(w.lineBcap.text().replace(',','.'))))

    w.lineBeffCharge.setText(str(100*conf['Baterie']['b_effcharge']).replace('.',','))
    w.lineBeffCharge.setValidator(validFloat)
    w.lineBeffCharge.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_effcharge'], float(w.lineBeffCharge.text().replace(',','.'))/100.0))

    w.lineBeffDischarge.setText(str(100*conf['Baterie']['b_effdischarge']).replace('.',','))
    w.lineBeffDischarge.setValidator(validFloat)
    w.lineBeffDischarge.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_effdischarge'], float(w.lineBeffDischarge.text().replace(',','.'))/100.0))

    w.lineBmax.setText(str(100*conf['Baterie']['b_max']).replace('.',','))
    w.lineBmax.setValidator(validFloat)
    w.lineBmax.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_max'], float(w.lineBmax.text().replace(',','.'))/100.0))

    w.lineBmin.setText(str(100*conf['Baterie']['b_min']).replace('.',','))
    w.lineBmin.setValidator(validFloat)
    w.lineBmin.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_min'], float(w.lineBmin.text().replace(',','.'))/100.0))

    w.lineBspeedCharge.setText(str(conf['Baterie']['b_speedcharge']).replace('.',','))
    w.lineBspeedCharge.setValidator(validFloat)
    w.lineBspeedCharge.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_speedcharge'], float(w.lineBspeedCharge.text().replace(',','.'))))

    w.lineBspeedDischarge.setText(str(conf['Baterie']['b_speeddischarge']).replace('.',','))
    w.lineBspeedDischarge.setValidator(validFloat)
    w.lineBspeedDischarge.editingFinished.connect(lambda: setConfig(w, ['Baterie','b_speeddischarge'], float(w.lineBspeedDischarge.text().replace(',','.'))))



    w.linePVpowernom.setText(str(conf['FVE']['pv_powernom']).replace('.',','))
    w.linePVpowernom.setValidator(validFloat)
    w.linePVpowernom.editingFinished.connect(lambda: setConfig(w, ['FVE','pv_powernom'], float(w.linePVpowernom.text().replace(',','.'))))

    w.linePVeffConv.setText(str(100*conf['FVE']['pv_effconverter']).replace('.',','))
    w.linePVeffConv.setValidator(validFloat)
    w.linePVeffConv.editingFinished.connect(lambda: setConfig(w, ['FVE','pv_effconverter'], float(w.linePVeffConv.text().replace(',','.'))/100.0))

    w.linePVPmax.setText(str(conf['FVE']['pmaxfve']).replace('.',','))
    w.linePVPmax.setValidator(validFloat)
    w.linePVPmax.editingFinished.connect(lambda: setConfig(w, ['FVE','pmaxfve'], float(w.linePVPmax.text().replace(',','.'))))



    w.linePmaxSupp.setText(str(conf['Pmax']['pmaxdodavka']).replace('.',','))
    w.linePmaxSupp.setValidator(validFloat)
    w.linePmaxSupp.editingFinished.connect(lambda: setConfig(w, ['Pmax','pmaxdodavka'], float(w.linePmaxSupp.text().replace(',','.'))))

    w.linePmaxCons.setText(str(conf['Pmax']['pmaxodber']).replace('.',','))
    w.linePmaxCons.setValidator(validFloat)
    w.linePmaxCons.editingFinished.connect(lambda: setConfig(w, ['Pmax','pmaxodber'], float(w.linePmaxCons.text().replace(',','.'))))

    

    chartType = [w.radioChartStyle0, w.radioChartStyle1, w.radioChartStyle2]
    chartType[conf['Graf']['stylgrafu']].setChecked(True)
    w.groupChartStyle.buttonToggled.connect(lambda butt, togg: setConfig(w, ['Graf','stylgrafu'], int(butt.objectName()[-1])) if togg else None)
    
    w.checkExport.setChecked(conf['Export']['export'])
    w.checkExport.toggled.connect(lambda state: setConfig(w, ['Export','export'], state))
    


#%%
def mainwindow_setup(w):
    w.setWindowTitle('Optimalizace')

    # Save/load settings
    w.ui.toolSaveSettings.clicked.connect(lambda: saveUserSettings(w))
    w.ui.toolLoadSettings.clicked.connect(lambda: loadUserSettings(w))
    
   
    w.ui.listFilesAll.clear()
    w.ui.listFilesSel.clear()
    w.ui.toolFullChart.setEnabled(False)
    
    w.ui.checkTimeRange.setEnabled(False)

    
    if uiCompiled:
        w.ui.testButton.setEnabled(False)
        w.ui.testButton.setVisible(False)
    

def connectWidgets(w):
    w.testButton.clicked.connect(lambda: test(w))

    # Lists of files
    listFiles(w)
    
    w.buttFilesSelect.clicked.connect(lambda: selectFiles(w))
    w.listFilesAll.itemSelectionChanged.connect(lambda: w.progressLoad.setValue(0))
    
    # Config widgets
    config2widgets(w)

    # Calculate
    w.buttCalculate.clicked.connect(lambda: getResults(w))
    
    # # Save/load settings
    # w.toolSaveSettings.clicked.connect(lambda: saveUserSettings(w))
    # w.toolLoadSettings.clicked.connect(lambda: loadUserSettings(w))
    
    
    # Result tables
    initTablesRes(w)

    # Results switch
    w.groupResType.buttonToggled.connect(lambda butt, togg: setResultsType(w, int(butt.objectName()[-1])) if togg else None)

    # Bilance switch
    w.groupBilance.buttonToggled.connect(lambda butt, togg: setResultsType(w, int(butt.objectName()[-1])) if togg else None)

    # Chart button
    w.toolFullChart.clicked.connect(lambda: showFullChart(w))
    
    #Info console
    w.infoConsole.textChanged.connect(lambda: w.infoConsole.verticalScrollBar().setValue(
                                                w.infoConsole.verticalScrollBar().maximum()-2))
    
    # Table events
    # tableEventFilter = TableEventFilter(w.tableResCost)
    w.tableResCost.installEventFilter(TableEventFilter(w.tableResCost))
    w.tableResEnergy.installEventFilter(TableEventFilter(w.tableResEnergy))
    
    
    # User date range
    w.checkTimeRange.stateChanged.connect(lambda: userDateRangeChecked(w))
    w.dateRange0.dateChanged.connect(lambda: userDateRange(w))
    w.dateRange1.dateChanged.connect(lambda: userDateRange(w))
    
    
    
    
    
#%%
class TableEventFilter(QWidget):
    def eventFilter(self, widget, event):
        if event.type() == QEvent.KeyPress and event.matches(QKeySequence.Copy):
            self.copySelection(widget)
            return True

        elif event.type() == QEvent.FocusOut:
            self.unselectAll(widget)
            return True

        else:
            # print(event.type())
            return False

    def copySelection(self, widget):
        selection = widget.selectedIndexes()
        if selection:
            rows = sorted(index.row() for index in selection)
            columns = sorted(index.column() for index in selection)
            
            rowcount = rows[-1] - rows[0] + 1
            colcount = columns[-1] - columns[0] + 1
            
            table = [[''] * colcount for _ in range(rowcount)]
            for index in selection:
                row = index.row() - rows[0]
                column = index.column() - columns[0]
                table[row][column] = index.data()
                
            stream = io.StringIO()
            csv.writer(stream, delimiter=';', quoting=csv.QUOTE_NONE).writerows(table)
            clipboard.setText(stream.getvalue())

    def unselectAll(self, widget):
        widget.setCurrentItem(None)


#%%
class MplCanvas(ChartFull, FigureCanvasQTAgg):
    def __init__(self, data, dt=1, styleid=0, width=12.5, height=7.03125, dpi=100, parent=None):
        # ChartFull.__init__(self, data, dt=dt, styleid=styleid, width=width, height=height, dpi=dpi)
        super().__init__(data, dt=dt, styleid=styleid, width=width, height=height, dpi=dpi)
        
        # self.fig = plt.Figure()
        # self.ax1 = self.fig.add_subplot(111)
        # self.ax2 = self.ax1.twinx()
        
        # self.ax1.plot(range(6))
        # self.ax1.plot(range(2,8))
        
        FigureCanvasQTAgg.__init__(self, self.fig)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.updateGeometry()


class FullChartWindow(QWidget):
    def __init__(self, data, dt=1, styleid=0, width=12.5, height=7.03125, dpi=100, parent=None):
        QWidget.__init__(self, parent)
        
        self.canvas = MplCanvas(data, dt=dt, styleid=styleid, width=width, height=height, dpi=dpi, parent=parent)
        
        self.layout = QVBoxLayout()
        self.layout.addWidget(self.canvas)
        self.setLayout(self.layout)
        
        self.setWindowTitle('Celkový graf')

        toolbar = NavigationToolbar(self.canvas, self)
        self.layout.addWidget(toolbar)
        
    def closeEvent(self, event):
        clearClosedCharts()
        event.accept()
        # event.ignore()


#%%
if uiCompiled:
    class MainWindow(QMainWindow):
        def __init__(self):
            super(MainWindow, self).__init__()

            self.ui = Ui_MainWindow()
            self.ui.setupUi(self)
            
            self.setFixedSize(self.geometry().width(), self.geometry().height())
            
            self.ui.fullChartWindows = []
            
else:
    class MainWindow(QMainWindow):
        def __init__(self):
            super(MainWindow, self).__init__()

            self.ui = QUiLoader().load('ui_design.ui', None)
            self.ui.setParent(self)
            self.resize(self.ui.size())
    
            self.setFixedSize(self.geometry().width(), self.geometry().height())
            
            self.ui.fullChartWindows = []


#%%
if __name__ == "__main__":
    app = QApplication.instance()
    if app == None:
        app = QApplication(sys.argv)
    app.setStyle('windowsvista')
    app.aboutToQuit.connect(atExit)
    
    clipboard=app.clipboard()

    window = MainWindow()
    mainwindow_setup(window)
    connectWidgets(window.ui)
    

    window.show()
    sys.exit(app.exec())


