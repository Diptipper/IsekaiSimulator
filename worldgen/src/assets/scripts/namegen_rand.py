
import numpy as np

module_seed = 0

def set_seed(number):
    global module_seed
    module_seed = number
    pass

def seed():
    return module_seed
    
def change_seed():
    global module_seed
    module_seed += 1
    pass

# randomize a number between 0 and 1 with specified precision
def rand():
    change_seed()
    x = (int(np.sin(module_seed)*1e10)%int(1e8))/1e8
    return x

def randrange(a,b=None):
    if b==None:
        return int(rand()*a)
    else:
        return a+int(rand()*(b-a))

def choice(a_list):
    return a_list[randrange(len(a_list))]

def shuffle(a_list):
    ret = []
    while len(ret)<len(a_list):
        sampling_list = [ elem for elem in a_list if elem not in ret ]
        ret += [choice(sampling_list)]
    return ret

def in_circle(circ_triplet):
    cx,cy,radius = circ_triplet
    xmin = cx-radius
    ymin = cy-radius
    while True:
        xret = xmin+2*radius*rand()
        yret = ymin+2*radius*rand()
        if (xret-cx)**2+(yret-cy)**2 < radius**2 :
            return xret,yret
