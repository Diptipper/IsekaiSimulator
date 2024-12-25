
import namegen_rand as rand

'''
# ============================================================================ #
#   How to access the data                                                     #
# ============================================================================ #

Use global_nation_data (a dictionary).
The structure is
    global_nation_data = {
                            <str: language>:[
                                            <str: nation name>,
                                            <str: nation name with title>,
                                            <list of str: town names>
                                            ],
                            ...
                            }
To get the name of the leader for each town, use name_of
    name_of[<str: town name>] = [<str: name>, <str: name with title>, <str: gender>]
'''

# caching the name files
get_name_cache = {}

# for easy global access
global_nation_data={}
# for uniqueness of the names
global_nation_list=[]
global_town_list=[]
global_noble_list=[]
# to check who is the lord of the nation/town
lord_of={}

# chance of having the same name as something existing
loop_break_chance = 0.01

def set_seed(num):
    rand.set_seed(num)

def reset():
    global get_name_cache
    global global_nation_data
    global global_nation_list
    global global_town_list
    global global_noble_list
    global lord_of
    get_name_cache = {}
    global_nation_data={}
    global_nation_list=[]
    global_town_list=[]
    global_noble_list=[]
    lord_of={}

def append_nation(Language_str,town_num=[3,4],tags=[]):

    global global_nation_data,global_nation_list,global_town_list,global_noble_list,lord_of
    
    # In Godot, Language is a node, but it's a string here.
    Language = Language_str
    titles = get_titles(Language)
    
    # Nation's name
    nation_name = append_nation_name(Language)
    decorated_nation_name = rand.choice(titles["sovereignty"])

    while decorated_nation_name.count("*")>0:
        decorated_nation_name = decorated_nation_name.replace("*",nation_name)
    
    # Generate its towns' names
    ntowns = rand.randrange(town_num[0],town_num[1]+1)
    town_list = []
    for itown in range(ntowns):
        town_name = append_town_name(Language)
        town_list+=[town_name]


    # Lords of each towns
    for town in [nation_name]+town_list:
        lord_of[town] = append_noble_name(Language)
        # note that lord_of[town] has two components at this point
        # which are (name,gender)
        # we will add more metadata below

    for key in lord_of.keys():
        if len(lord_of[key])==3:
            # Skip because the entry is already modified
            continue
        decorated_name = ""
        noblename = lord_of[key][0]
        gender = lord_of[key][1]
        if key==nation_name :
            # The King
            if gender == "male":
                decorated_name = rand.choice(titles["male_leader"])
            else:
                decorated_name = rand.choice(titles["female_leader"])
        else:
            # Town lords
            if gender == "male":
                decorated_name = rand.choice(titles["male_lord"])
            else:
                decorated_name = rand.choice(titles["female_lord"])
        while decorated_name.count("*"):
            decorated_name = decorated_name.replace("*",noblename)
            
        # replace the element 
        lord_of[key] = [noblename,decorated_name,gender]
    
    if Language not in global_nation_data.keys():
        global_nation_data[Language] = [[nation_name, decorated_nation_name, town_list, tags]]
    else:
        global_nation_data[Language] += [[nation_name, decorated_nation_name, town_list, tags]]

# Generate names while making sure that the names are unique (99% sure) --------

def append_nation_name(Language):
    global global_nation_list
    nationname = fetch_place(Language+"/nations")
    while nationname in global_nation_list:
        if rand.rand()<loop_break_chance:
            break
        nationname = fetch_place(Language+"/nations")
    if nationname not in global_nation_list:
        global_nation_list += [nationname]
    return nationname

def append_town_name(Language):
    global global_town_list
    townname = fetch_place(Language+"/towns")
    while townname in global_town_list:
        if rand.rand()<loop_break_chance:
            break
        townname = fetch_place(Language+"/towns")
    if townname not in global_town_list:
        global_town_list += [townname]
    return townname

def append_noble_name(Language,gender="mixed",cache=True):
    global global_noble_list
    noblename = fetch_person(Language+"/nobles",gender,cache)
    while noblename in global_noble_list:
        if rand.rand()<loop_break_chance:
            break
        noblename = fetch_person(Language+"/nobles",gender,cache)
    if noblename not in global_noble_list:
        global_noble_list += [noblename]
    return noblename

# Below here are general fetch functions ---------------------------------------

def fetch_place(folder,cache=True):

    global get_name_cache

    # Enter the name of the folder containing the following files
    #    - prefix
    #    - suffix
    #    - exception
    # The folder should be inside assets/names/

    if folder not in get_name_cache.keys() :

        directory = "assets/names/"+folder+"/"
        prefixes = []
        with open(directory+"prefix","r", encoding='utf-8') as file:
            for line in file:
                line = line.replace("\n","")
                if len(line)==0 or line[0]=="#":
                    continue
                prefixes += [line.lower()]
        suffixes = []
        with open(directory+"suffix","r", encoding='utf-8') as file:
            for line in file:
                line = line.replace("\n","")
                if len(line)==0 or line[0]=="#":
                    continue
                suffixes += [line.lower()]
        exceptions = []
        with open(directory+"exception","r", encoding='utf-8') as file:
            for line in file:
                line = line.replace("\n","")
                if len(line)==0 or line[0]=="#":
                    continue
                item1,item2 = line.split("=")
                exceptions += [(item1.lower(),item2.lower())]

        if cache :
            get_name_cache[folder] = (prefixes,suffixes,exceptions)
    else:
        prefixes,suffixes,exceptions = get_name_cache[folder]

    placename = ""
    while placename=="" :
        prefix = rand.choice(prefixes)
        suffix = rand.choice(suffixes)
        placename = prefix+suffix
        replace_count=1
        while replace_count>0:
            replace_count=0
            for exception in exceptions:
                if placename.count(exception[0])>0:
                    placename = placename.replace(exception[0],exception[1])
                    replace_count+=1
    return placename.capitalize()

def fetch_person(folder,gender=None,cache=True):

    global get_name_cache

    # Enter the name of the folder containing the following files
    #    - male
    #    - female
    # The folder should be inside assets/names/

    if folder not in get_name_cache.keys() :

        directory = "assets/names/"+folder+"/"
        males = []
        with open(directory+"male","r", encoding='utf-8') as file:
            for line in file:
                line = line.replace("\n","")
                if len(line)==0 or line[0]=="#":
                    continue
                males += [line.lower()]
        females = []
        with open(directory+"female","r", encoding='utf-8') as file:
            for line in file:
                line = line.replace("\n","")
                if len(line)==0 or line[0]=="#":
                    continue
                females += [line.lower()]

        if cache :
            get_name_cache[folder] = (males,females)
    else:
        males,females = get_name_cache[folder]

    if gender == "mixed" :
        gender = rand.choice(["male","female"])
    
    if gender == "male":
        return [rand.choice(males).capitalize(),"male"]
    else:
        return [rand.choice(females).capitalize(),"female"]

def get_titles(Language):
    directory = "assets/names/"+Language+"/"
    titles = {}
    with open(directory+"titles","r") as file:
        for line in file:
            line = line.replace("\n","")
            if len(line)==0 or line[0]=="#":
                continue
            while line.count(" :")>0:
                line = line.replace(" :",":")
            while line.count("    :")>0:
                line = line.replace("    :",":")
            while line.count(": ")>0:
                line = line.replace(": ",":")
            while line.count(":    ")>0:
                line = line.replace(":    ",":")
            key,value = line.split(":")
            if key.lower() in titles:
                titles[key.lower()] += [value]
            else:
                titles[key.lower()] = [value]
    return titles
