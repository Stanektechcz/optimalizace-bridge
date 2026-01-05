import locale
locale.setlocale(locale.LC_TIME, 'czech')

import numpy as np
# import matplotlib.pyplot as plt

import matplotlib
# matplotlib.use('Qt5Agg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg
from matplotlib.figure import Figure


from matplotlib.widgets import CheckButtons, RadioButtons

import mplcyberpunk
# https://towardsdatascience.com/cyberpunking-your-matplotlib-self.figures-96f4d473185d


from matplotlib.collections import PatchCollection
from matplotlib.patches import Rectangle

from matplotlib.dates import AutoDateFormatter, AutoDateLocator, date2num as d2n



#%%
# styles = ['default', 'cyberpunk', 'seaborn-v0_8', 
#           'classic', 'ggplot', 'dark_background',
#           'Solarize_Light2', 'bmh', 'fivethirtyeight',
#           'seaborn-v0_8-bright', 'seaborn-v0_8-dark-palette', 
#           'seaborn-v0_8-dark-palette', 'seaborn-v0_8-pastel']


styles = ['default', 'seaborn-v0_8', 'cyberpunk']


styleColors = {'default':   {'cons' : 'tab:purple',
                             'prod' : 'tab:orange',
                             'batt' : 'tab:blue',
                             'sum'  : 'tab:green',
                             'price': 'tab:red',
                             'cost' : 'tab:cyan'},
               'cyberpunk': {'cons' : 'C1',
                             'prod' : 'C2',
                             'batt' : 'C0',
                             'sum'  : 'C3',
                             'price': 'tab:red',
                             'cost' : 'tab:cyan'},
               'another':   {'cons' : 'C3',
                             'prod' : 'C4',
                             'batt' : 'C0',
                             'sum'  : 'C1',
                             'price': 'tab:red',
                             'cost' : 'tab:cyan'}
               }

lwc = 1.5


locator = AutoDateLocator()
formatter = AutoDateFormatter(locator)

keys = sorted(formatter.scaled.keys())[::-1]
# No leading zero: # for windows; - for linux
# forms = ['%Y', '%#m.%Y', '%a %#d.%#m.%Y', '%a %#d.%#m. %#H:%M']
forms = ['%Y', '%#m.%Y', '%a %#d.%#m. %#H:%M', '%a %#d.%#m. %#H:%M']

for key, form in zip(keys[:len(forms)], forms):
    formatter.scaled[key] = form



#%%
def chartDay(dataRed, ind, styleid=1):
    style = styles[styleid]
    if style in styleColors.keys():
        colors = styleColors[style]
    else:
        colors = styleColors['another']

    
    price = dataRed['Kč/kWh'][ind].values
    cons  = dataRed['kWh'][ind].values
    supp  = dataRed['PVkWh'][ind].values
    batt  = dataRed['BkWh'][ind].values
    # batt = dataRed['BkWh_charge'][ind].values
    
    title = dataRed['DenNazev'][ind].values[0] + ' ' + \
             dataRed['Den'][ind].values[0].astype('datetime64[s]').item().strftime('%d.%m.%Y')

    with plt.style.context(style):
        fig, ax1 = plt.subplots()
        ax2 = ax1.twinx()
        # l11 = self.ax1.stairs(cons, color='r', lw=1.5, baseline=None)
        l11 = ax1.stairs(cons+supp+batt, color=colors['sum'], lw=lwc*1.5, baseline=None)
        # l12 = self.ax1.stairs(supp, color='g', lw=1.5, baseline=None)
        l13 = ax1.stairs(batt,  color=colors['batt'], lw=lwc*1.5, baseline=None)
        # l13 = self.ax1.stairs(np.cumsum(batt)+E0,  color='b', lw=1.5, baseline=None)
        l21 = ax2.stairs(price, color=colors['price'], lw=lwc*1.0, ls='--', baseline=None)
        ax1.grid(True)
        
        ax1.set_axisbelow(True)
        ax2.set_axisbelow(True)
        
        
        xticks = np.arange(0, 24+1, 1)
        ax1.set_xticks(xticks)
        ax1.set_xticklabels('')
        
        ax1.set_xticks((xticks[1:]+xticks[:-1])/2, minor=True)
        ax1.set_xticklabels(xticks[1:], minor=True)
        
        
        ax1.set_xlabel('Hodina')
        ax1.set_ylabel('Energie - kWh')
        ax2.set_ylabel('Cena - Kč/kWh')
        
        # plt.legend([l11, l12, l13, l21], ['Spotřeba', 'Výroba', 'Baterie', 'Cena'])
        plt.legend([l11, l13, l21], ['Suma spotřeby, výroby a baterie', 'Baterie', 'Cena'])
        plt.title(title)
        plt.show()


class ChartFull:
    def __init__(self, dataRed, dt=1, styleid=1, width=12.5, height=7.03125, dpi=100):
        # def unite_grids():
        #     l1 = self.ax1.get_ylim()
        #     t1 = self.ax1.get_yticks()
        #     l2 = self.ax2.get_ylim()
        #     l3 = self.ax3.get_ylim()
            
        #     t2 = (t1-l1[0])/(l1[1]-l1[0]) * (l2[1]-l2[0]) + l2[0]
        #     self.ax2.set_yticks(t2)
        #     self.ax2.set_ylim(l2)

        #     t3 = (t1-l1[0])/(l1[1]-l1[0]) * (l3[1]-l3[0]) + l3[0]
        #     self.ax3.set_yticks(t3)
        #     self.ax3.set_ylim(l3)

        # def unite_grids():
        #     lm1 = np.max(np.abs(self.ax1.get_ylim()))
        #     self.ax1.set_ylim([-lm1, lm1])
            
        #     t1 = self.ax1.get_yticks()
        #     for ax in [self.ax2, self.ax3]:
        #         lm = np.max(np.abs(ax.get_ylim()))
        #         ax.set_yticks([t*lm/lm1 for t in t1])
        #         ax.set_ylim([-lm, lm])

        def unite_grids():
            lms = []
            rats_dn = []
            rats_up = []
            for ax in [self.ax1, self.ax2, self.ax3]:
                lims = ax.get_ylim()
                lms.append(np.max(np.abs(lims)))
                rats_dn.append(-lims[0]/lms[-1])
                rats_up.append( lims[1]/lms[-1])
            rat_dn = np.max(rats_dn)
            rat_up = np.max(rats_up)


            self.ax1.set_ylim([-lms[0], lms[0]])
            t1 = self.ax1.get_yticks()
            for ax, lm in zip([self.ax2, self.ax3], lms[1:]):
                ax.set_yticks([t*lm/lms[0] for t in t1])
                ax.set_ylim([-lm, lm])


            for ax, lm in zip([self.ax1, self.ax2, self.ax3], lms):
                ax.set_ylim([-lm*rat_dn, lm*rat_up])
            
        
        def resety():
            for ax in [self.ax2, self.ax2, self.ax3]:
                ax.relim(True)
                ax.autoscale(axis='y')
                ax.autoscale_view(scalex=False)
            
            unite_grids()
        
        def getWeekends():
            t = dataRed['Den'].values[0]
            te = dataRed['Den'].values[-1] 
            
            if t.astype('M8[ms]').astype('O').isoweekday() in [6, 7]:
                t0 = [t]
            else:
                t0 = []
            
            while t <= te:
                t += np.timedelta64(1, 'D')

                day = t.astype('M8[ms]').astype('O').isoweekday()
                if day == 6:
                    t0.append(t)

            return t0
        
        
        style = styles[styleid]
        if style in styleColors.keys():
            colors = styleColors[style]
        else:
            colors = styleColors['another']
        
        
        tg = dataRed['t0'].values
        tg = np.append(tg, tg[-1] + np.timedelta64(int(dt*3600), 's'))
        
        pvr = dataRed['PVkWh']
        pvi = -dataRed['PVkWh']
        
        b1 = dataRed['BkWh']
        b2 = dataRed['BkWh_charge']
        
        s1 = dataRed['BkWh']+dataRed['kWh']+dataRed['PVkWh']
        s2 = dataRed['kWh']+dataRed['PVkWh']
        s3 = dataRed['BkWh']+dataRed['kWh']
        s4 = dataRed['BkWh']+dataRed['PVkWh']
        
        
        # with plt.style.context(style):
        with matplotlib.style.context(style):
            # self.fig, self.ax1 = plt.subplots()
            self.fig = Figure(figsize=(width, height), dpi=dpi)
            self.ax1 = self.fig.add_subplot()
            self.ax2 = self.ax1.twinx()

            self.ax3 = self.ax1.twinx()
            self.ax3.spines.right.set_position(("axes", 1.07))
            
            self.ax2.yaxis.label.set_color(colors['price'])
            self.ax3.yaxis.label.set_color(colors['cost'])
            
            # self.fig.set_facecolor((0.9176470588235294, 0.9176470588235294, 0.9490196078431372, 1.0))
    
    
            self.ax1.axhline(0, color='black', ls='-', lw=0.5)
            l11 = self.ax1.stairs(dataRed['kWh'], tg, color=colors['cons'], label='Spotřeba', lw=lwc*1.5, baseline=None)
            l12 = self.ax1.stairs(pvi, tg, color=colors['prod'], label='Výroba',  lw=lwc*1.0, baseline=None)
            l13 = self.ax1.stairs(b1,  tg, color=colors['batt'], label='Baterie', lw=lwc*1.0, baseline=None)
            l14 = self.ax1.stairs(s1,  tg, color=colors['sum'], label='Suma',    lw=lwc*1.5, baseline=None)
            
            l21 = self.ax2.stairs(dataRed['Kč/kWh'], tg, color=colors['price'], label='Cena', lw=lwc*1.0, ls='--', baseline=None)

            l31 = self.ax3.stairs(dataRed['SumaNaklady_Kc']/1000, tg, color=colors['cost'], label='Suma všeho - Náklady', lw=lwc*1.0, ls='-', baseline=None)
            
            
            lines = [l11, l12, l13, l14, l21, l31]
    
    
            weyr = np.max(np.abs(self.ax1.get_ylim()))
            weBoxes = [Rectangle((d2n(t0), -5*weyr), 2, 10*weyr) 
                       for t0 in getWeekends()]
            pc = PatchCollection(weBoxes, facecolor='grey', alpha=0.2,
                             edgecolor=None, zorder=0)
            self.ax1.add_collection(pc)
    
    
            self.ax1.grid(True)
    
            # Srovnání mřížek
            self.ax2.grid(False)
            self.ax3.grid(False)
            unite_grids()
    
    
            # self.ax1.set_zorder(1)
            # self.ax1.patch.set_visible(False)
            self.ax1.set_axisbelow(True)
            self.ax2.set_axisbelow(True)
            
            
            # self.ax1.set_xlabel('Čas')
            self.ax1.set_ylabel('Energie - kWh')
            self.ax2.set_ylabel('Cena - Kč/kWh')
            self.ax3.set_ylabel('Náklady - tis. Kč')
            
    
            self.ax1.xaxis.set_major_locator(locator)
            self.ax1.xaxis.set_major_formatter(formatter)
    
            
            self.ax1.legend(lines, [l.get_label() for l in lines],
                       loc = 'upper right',
                       frameon=True)
    
    
            self.fig.autofmt_xdate()
            
            self.fig.subplots_adjust(left=0.08)
            self.fig.subplots_adjust(right=0.75)
            self.fig.subplots_adjust(bottom=0.1)
        
        
        
        
            # Checkbuttons - visibility
            raxch1 = self.fig.add_axes([0.85, 0.68, 0.12, 0.15])
            raxch1.set_title('Zobrazit:', fontsize=11)
            labels = [str(line.get_label()) for line in lines]
            visibility = [line.get_visible() for line in lines]
            self.check1 = CheckButtons(raxch1, labels, visibility)
            
            def func1(label):
                index = labels.index(label)
                lines[index].set_visible(not lines[index].get_visible())
                
                resety()
                self.fig.canvas.draw()
                # plt.draw()
            
            self.check1.on_clicked(func1)
            
            
            # Checkbutton - inverse pv
            raxch2 = self.fig.add_axes([0.85, 0.58, 0.12, 0.1])
            # raxch.set_title('Zobrazit:', fontsize=11)
            self.check2 = CheckButtons(raxch2, ['Invertovat výrobu'])
            self.check2.set_active(0)
            def func2(label):
                if self.check2.get_status()[0]:
                    l12.set_data(pvi)
                else:
                    l12.set_data(pvr)
                    
                resety()
                self.fig.canvas.draw()
                # plt.draw()
            
            self.check2.on_clicked(func2)
            
            
            # Radiobuttons - sum
            raxr1 = self.fig.add_axes([0.85, 0.35, 0.12, 0.15])
            raxr1.set_title('Suma zahrnuje:', fontsize=11)
            self.radio1 = RadioButtons(raxr1, ('Všechno', 
                                               'Spotřeba a výroba', 
                                               'Spotřeba a baterie',
                                               'Výroba a baterie'),
                                       radio_props={'facecolor': ['C0', 'C0', 'C0', 'C0']}
                                       )
            
            # for circle in self.radio1.circles: # adjust radius here. The default is 0.05
            #     circle.set_radius(0.05)
            
            def hzfunc1(label):
                hzdict = {'Všechno': s1, 
                          'Spotřeba a výroba': s2, 
                          'Spotřeba a baterie': s3, 
                          'Výroba a baterie': s4}
                ydata = hzdict[label]
                l14.set_data(ydata)
                
                resety()
                self.fig.canvas.draw()
                # plt.draw()
            self.radio1.on_clicked(hzfunc1)
            
            
            # Radiobuttons - baterie
            raxr2 = self.fig.add_axes([0.85, 0.12, 0.12, 0.15])
            raxr2.set_title('Graf baterie:', fontsize=11)
            self.radio2 = RadioButtons(raxr2, ('Odběr / Dodávka', 
                                               'Energie v baterii'),
                                       radio_props={'facecolor': ['C0', 'C0']}
                                       )
            
            def hzfunc2(label):
                hzdict = {'Odběr / Dodávka': b1, 
                          'Energie v baterii': b2}
                ydata = hzdict[label]
                l13.set_data(ydata)
            
                resety()
                self.fig.canvas.draw()
                # plt.draw()
            self.radio2.on_clicked(hzfunc2)
    
    # def show(self):
    #     plt.show()



