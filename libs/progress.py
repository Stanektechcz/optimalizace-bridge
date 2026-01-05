from timeit import default_timer as timer
# progress = Progress(zira)
# In some loop:
#     progress.show(actualLoopStep/numberOfLoopSteps)


class Progress():
    def __init__(self, assistant=None, toConsole=True, progressBar=None, textLabel=None):
        self.t0 = timer()
        self.assistant = assistant
        self.toConsole = toConsole
        self.progressBar = progressBar
        self.textLabel = textLabel
        
        self.steps = 1000
        self.step2show  = 0
        
        self.etaNotifyAt = int(3.0 *self.steps/100.0)
        self.etaNotified = False

    def update(self, doneRatio):
        eta = (timer() - self.t0) * (1.0 - doneRatio) / doneRatio
        etaMin = int(eta/60.0)
        etaSec = eta-etaMin*60.0
        
        if int(doneRatio*self.steps) >= self.step2show:
            self.step2show = int(doneRatio*self.steps) + 1
            
            # txt = 'Status:' + '{:6.1f}'.format(doneRatio*100.0) + ' %' + \
            #       '  -  ETA = ' + '{:3d}'.format(etaMin) + ':' + \
            #                    '{:04.1f}'.format(etaSec) + ' [min:sec]'

            txt = '{:6.1f}'.format(doneRatio*100.0) + ' %' + \
                  '  -  ' + '{:3d}'.format(etaMin) + ':' + \
                               '{:04.1f}'.format(etaSec) + ' [min:sec]'
            
            if self.progressBar is not None:
                self.progressBar.setValue(int(round(doneRatio*1000)))
            
            if self.textLabel is not None:
                self.textLabel.setText(txt)
            
            if self.toConsole:
                print('\r'+txt+'    ', end='')
        
        if self.step2show == (self.steps + 1):
            if self.textLabel is not None:
                self.textLabel.setText('Hotovo')

            if self.toConsole:
                print('\n')

        if self.assistant:
            if not self.etaNotified:            
                if int(doneRatio*self.steps) >= self.etaNotifyAt:
                    if bool(etaMin) or bool(int(etaSec)) and (eta > 10.0):
                        msgMin = str(etaMin)      + ' minute' + 's'*bool(etaMin - 1)
                        msgSec = str(int(etaSec)) + ' second' + 's'*bool(int(etaSec) - 1)
    
                        msg = 'ETA' + (' ' + msgMin*bool(etaMin)) + (' ' + msgSec)*bool(int(etaSec))
    
                        self.assistant.say(msg)
                    
                    self.etaNotified = True

