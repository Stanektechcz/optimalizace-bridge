from configparser import ConfigParser


def str2val(string):
    val = None
    if string != 'None':
        if string.isdigit():
            val = int(string)
        elif string.replace('.','',1).isdigit():
            val = float(string)
            
        elif string.lower() == 'true':
            val = True
        elif string.lower() == 'false':
            val = False
        else:
            val = string
            
    return val


def config2dict(config):
    d = {s:dict(config.items(s)) for s in config.sections()}
    
    for sect in d.keys():
        d[sect] = {key:str2val(val) for key, val in d[sect].items()}
        
    return d

def dict2config(d):
    d2 = d.copy()
    for sect in d2.keys():
        d2[sect] = {key:str(val) for key, val in d2[sect].items()}

    config2 = ConfigParser()
    config2.read_dict(d2)
    return config2


def readConfig(file):
    config = ConfigParser()
    config.read(file)
    return config2dict(config)
    

def writeConfig(file, conf):
    config = dict2config(conf)
    with open(file, 'w') as configfile:
        config.write(configfile)


# conf = readConfig('settings.ini')

# writeConfig('settings2.ini', conf)

