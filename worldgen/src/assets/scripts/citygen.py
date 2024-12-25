
import os
import sys
import numpy as np
import citygen_rand as rand
import time
import copy

#os.system("clear")

Ngrid = 18
river_shift_ratio = 3/9

debug_on = False

def generate_tile(exit_options="24",river_exit_options="24",seed=-1,used_seeds=[],river_out="",lift_out=""):

    if seed == -1:
        seed = int(time.time()*100)
    rand.set_seed(seed)

    nexits = sum([ 1 if str(i) in exit_options else 0 for i in range(1,7) ])
    
    # parameters ------------------------------------------
    N = Ngrid     # grid size (must be even!)
    # construct the grid ----------------------------------
    grange = [ i for i in range(-N,N+1) ]
    igrid = [ (x,y) for x in grange for y in grange if x+y<=N and -N<=x+y ]
    
    road_tiles = []
    
    # connect the road to the tile exit ===================
    corners = [ (0,N), (N,0), (N,-N), (0,-N), (-N,0), (-N,N), (0,N) ]

    exits = []
    for x in exit_options:
        if int(x) not in exits:
            exits += [int(x)]
    rexits = []
    for x in river_exit_options:
        if int(x) not in rexits:
            rexits += [int(x)]
            
    if len(exit_options)>0:
        tile_exits = []
        for i in range(len(corners)):
            if i+1 in exits :
                x1,y1 = corners[i]
                x2,y2 = corners[i+1]
                tile_exits += [(int((x1+x2)/2),int((y1+y2)/2))]
        # pick the tile center
        u1 = sum([ np.array(v) for v in tile_exits ])/len(tile_exits)
        u2 = sum([ np.array(v) * (0.2*rand.rand()) for v in corners ])
        center = tuple([ int(a) for a in u1+u2 ])
        if center not in igrid:
            center = tuple([ int(a) for a in u1 ])
        exit_pairs = []
        for tile_exit in tile_exits:
                exit_pairs += [ (center,tile_exit) ]
        # connect the pairs
        exit_roads = []
        for p1,p2 in exit_pairs:
            exit_roads += [connect_dots(p1,p2,N)]
        # convert to normalized real coordinates
        exit_roads = [ get_rgrid(road,N) for road in exit_roads ]
        # turn exit_roads to segments

        road_segmented = []
        road_system = exit_roads
        segments = []
        for road in road_system:
            coords = [ (x,y) for x,y in zip(*road)]
            for j in range(len(coords)-1):
                if canonical_order((coords[j],coords[j+1])) not in segments:
                    segments += [canonical_order((coords[j],coords[j+1]))]
        road_segmented += segments
    else:
        road_segmented = []
    
    exit_road_tiles = []
    for v1,v2 in road_segmented:
        if v1 not in exit_road_tiles:
            exit_road_tiles+=[v1]
        if v2 not in exit_road_tiles:
            exit_road_tiles+=[v2]
    exit_road_tiles = get_icoords(exit_road_tiles,Ngrid)

    # rivers ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    if len(river_exit_options)>0:
        river_exits = []
        for i in range(len(corners)):
            if i+1 in rexits :

                cornerA = corners[i]
                cornerB = corners[i+1]
                yA = get_rcoords([cornerA],Ngrid)[0][1]
                yB = get_rcoords([cornerB],Ngrid)[0][1]
                if yB >= yA :
                    cornerA = corners[i+1]
                    cornerB = corners[i]

                x1,y1 = cornerA
                x2,y2 = cornerB
                c1 = river_shift_ratio
                c2 = 1-river_shift_ratio
                river_exits += [(int(c1*x1+c2*x2),int(c1*y1+c2*y2))]
        
        # pick the tile center
        # center is one of the exits
        if len(river_exit_options)>1:
            if river_out!="":
                icenter = river_exit_options.index(river_out)
                center = river_exits[icenter]
            else:
                center = rand.choice(river_exits)
        else:
            center = rand.choice([ p for p in get_nb((0,0)) if p not in exit_road_tiles ])
        exit_pairs = []
        for river_exit in river_exits:
                if len(river_exit_options)>1 :
                    if river_exits.index(river_exit)==river_exits.index(center):
                        continue
                    exit_pairs += [ (river_exit,center) ]
                else :
                    exit_pairs += [ (center,river_exit) ]
        # connect the pairs
        exit_rivers = []
        for p1,p2 in exit_pairs:
            exit_rivers += [connect_dots(p1,p2,N,[],
                                preferred_tiles=sum(exit_rivers,[]),
                                crossing_tiles=exit_road_tiles)]
        # convert to normalized real coordinates
        exit_rivers = [ get_rgrid(river,N) for river in exit_rivers ]
        
        def contain_segment(segment_set,segment):
            canonical_set = [ canonical_order(s) for s in segment_set ]
            return canonical_order(segment) in canonical_set
        
        river_segmented = []
        river_system = exit_rivers
        segments = []
        for road in river_system:
            coords = [ (x,y) for x,y in zip(*road)]
            for j in range(len(coords)-1):
                if not contain_segment(segments,(coords[j],coords[j+1])):
                    segments += [(coords[j],coords[j+1])]
        river_segmented += segments
    else:
        river_segmented = []
    # :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    
    corners = get_rgrid(corners,N)
    coords = [ (x,y) for x,y in zip(*corners)]
    segmented_corners = []
    for j in range(len(coords)-1):
        if canonical_order((coords[j],coords[j+1])) not in segmented_corners:
            segmented_corners += [canonical_order((coords[j],coords[j+1]))]
    
    return (road_segmented,river_segmented,segmented_corners), seed

def generate_city(exit_options="24",river_exit_options="24",smaller=False,seed=-1,used_seeds=[],citytags=[],river_out="",lift_out=""):
    
    dark_district_ratio = 0.2
    shopping_district_ratio = 0.2
    adventurer_district_ratio = 0.2
    
    dark_district_chance = 0.2 # chance to have dark district in smaller cities
    

    if seed == -1:
        seed = int(time.time()*100)
    
    output = (0,)
    attempts = 0
    while True :
    
        seed += attempts
        rand.set_seed(seed)
        
        rand.set_seed(seed)
        output = generate_city_base(exit_options,river_exit_options,smaller,river_out)
        attempts +=1

        if len(output)!=1 and seed not in used_seeds:
            break


    # 0 castle_roads
    # 1 inner_roads
    # 2 outer_roads
    # 3 exit_roads
    # 4 castle_walls
    # 5 inner_walls
    # 6 outer_walls
    # 7 grid_corners
    # 8 rivers

    road_inner = output[1]
    road_outer = output[2]


    if smaller :
        road_outer += road_inner

    walls = [output[4],output[5],output[6]]
    rivers = output[8]

    bd_output_inner = assign_building_loc(road_inner,walls)
    bd_output_outer = assign_building_loc(road_outer,walls)

    buildings_inner = bd_output_inner[0]
    buildings_inner_end = bd_output_inner[1]
    intersection_inner = bd_output_inner[2]
    buildings_outer = bd_output_outer[0]
    buildings_outer_end = bd_output_outer[1]
    intersection_outer = bd_output_outer[2]

    if smaller :
        buildings_inner = []
        buildings_inner_end = []

    buildings_inner_size = []
    for segment in buildings_inner:
        v1,v2=segment
        dv = np.sqrt( (v1[0]-v2[0])**2 + (v1[1]-v2[1])**2 )
        # small building has dv*Ngrid = 0.25
        # large building has dv*Ngrid = 0.80
        buildings_inner_size += [ "l" if dv*Ngrid>0.5 else "s" ]

    buildings_outer_size = []
    for segment in buildings_outer:
        v1,v2=segment
        dv = np.sqrt( (v1[0]-v2[0])**2 + (v1[1]-v2[1])**2 )
        # small building has dv*Ngrid = 0.25
        # large building has dv*Ngrid = 0.80
        buildings_outer_size += [ "l" if dv*Ngrid>0.5 else "s" ]

    buildings = (buildings_inner,buildings_inner_end,intersection_inner,
                buildings_outer,buildings_outer_end,intersection_outer,
                buildings_inner_size,buildings_outer_size)

    # turn the first 8 outputs to segments
    output_segmented = []
    for i in range(0,3+1):
        road_system = output[i]
        segments = []
        for road in road_system:
            coords = [ (x,y) for x,y in zip(*road)]
            for j in range(len(coords)-1):
                if canonical_order((coords[j],coords[j+1])) not in segments:
                    segments += [canonical_order((coords[j],coords[j+1]))]
        output_segmented += [segments]

    for i in range(4,7+1):
        wall = output[i]
        coords = [ (x,y) for x,y in zip(*wall)]
        segments = []
        for j in range(len(coords)-1):
            if canonical_order((coords[j],coords[j+1])) not in segments:
                segments += [canonical_order((coords[j],coords[j+1]))]
        output_segmented += [segments]
    


    # dark district ---------------------------------------------------        
    if not smaller or rand.rand()<dark_district_chance:
        iwall_segs = output_segmented[4]+output_segmented[5]
        owall_segs = output_segmented[6]
        xroad_segs = output_segmented[3]
        dd_center = get_dark_district_center(iwall_segs,owall_segs,xroad_segs)

        dds_num = snap(np.ceil(dark_district_ratio*len(buildings_outer)))
        ddn_num = snap(np.ceil(dark_district_ratio*len(buildings_outer_end)))
        ob_regtype = get_dark_buildings(buildings_outer,buildings_outer_end,dds_num,ddn_num,dd_center)
    else:
        ob_regtype = ( ["base"]*len(buildings_outer),["base"]*len(buildings_outer_end) )
    
    # Adverturer
    bs_num = snap(np.ceil(adventurer_district_ratio*len(buildings_outer)))
    bn_num = snap(np.ceil(adventurer_district_ratio*len(buildings_outer_end)))
    ob_regtype = get_district("adv",buildings_outer,buildings_outer_end,bs_num,bn_num,ob_regtype)
    
    # Shopping
    bs_num = snap(np.ceil(shopping_district_ratio*len(buildings_outer)))
    bn_num = snap(np.ceil(shopping_district_ratio*len(buildings_outer_end)))
    ob_regtype = get_district("shp",buildings_outer,buildings_outer_end,bs_num,bn_num,ob_regtype)
    
    # building assignment ---------------------------------------------
    # i = inner, o = outer
    # b = building
    # s = segments, n = node2
    # z = size
    ibs_size = buildings_inner_size
    obs_size = buildings_outer_size
    ibn_num  = len(buildings_inner_end)
    building_types = get_building_type(ibs_size,obs_size,ibn_num,*ob_regtype)
    
    # compile the number of buildings
    obs_regtype, obn_regtype = ob_regtype
    ib_num = len(ibs_size)+ibn_num
    ob_num = len(obs_size)+len(obn_regtype)
    db_num = len([elem for elem in obs_regtype+obn_regtype if elem=="dark"])
    bb_num = len([elem for elem in obs_regtype+obn_regtype if elem=="base"])
    
    output = (*output_segmented,buildings,ob_regtype,building_types,rivers)

    return output, seed

def generate_city_base(exit_options="24",river_exit_options="24",smaller=False,river_out="",lift_out=""):
    
    nexits = sum([ 1 if str(i) in exit_options else 0 for i in range(1,7) ])
    
    # parameters ------------------------------------------
    N = Ngrid     # grid size (must be even!)
    N_outer = 14  # size of the outer city
    N_inner = 6   # size of the inner city
    
    # castle config
    Nr_castle = 1
    lr_castle = (1,1)
    # inner config
    Nr_inner = 5
    lr_inner = (2,6)
    # outer config
    Nr_outer = 30
    lr_outer = (6,10)
    
    if smaller:
        Nr_inner = 1
        lr_inner = (1,1)
        Nr_outer = 15
        lr_outer = (6,10)
        
    
    # construct the grid ----------------------------------
    
    grange = [ i for i in range(-N,N+1) ]
    igrid = [ (x,y) for x in grange for y in grange if x+y<=N and -N<=x+y ]
    
    rexits = []
    for x in river_exit_options:
        if int(x) not in rexits:
            rexits += [int(x)]
    road_tiles = []
    wall_tiles = []
    
    # The citadel =========================================
    castle_roads = grow_roads((0,0),nroad=Nr_castle,lenrange=lr_castle,grid_size=N_inner)
    for road in castle_roads:
        road_tiles += road
    castle_exits, castle_walls, castle_inside = get_walls(castle_roads,"1",grid_size=N)
    wall_tiles += castle_walls
    
    inner_roads = []
    for castle_exit in castle_exits:
        if castle_exit == None :
            continue
        sub_road_system = grow_roads(castle_exit,road_tiles,wall_tiles,nroad=Nr_inner,lenrange=lr_inner,grid_size=N_inner)
        if sub_road_system == [] :
            #print("Fail to generate outer roads.")
            return (2,)
        inner_roads += sub_road_system
        road_tiles += sum(sub_road_system,[])
    v = inner_roads+[castle_walls]
    inner_exits, inner_walls, inner_inside = get_walls(inner_roads+[castle_walls],exit_options[0],grid_size=N)
    if inner_exits == [] :
        #print("Some exit is blocked.")
        return (1,)
    if smaller:
        inner_walls = [inner_walls[0],inner_walls[0]]
    wall_tiles += inner_walls
    
    #plt.scatter(*get_rgrid(road_tiles,N),color="b",marker="x",s=50)
    
    outer_roads = []
    for inner_exit in inner_exits:
        if inner_exit == None :
            continue
        sub_road_system = grow_roads(inner_exit,road_tiles,wall_tiles,nroad=Nr_outer,lenrange=lr_outer,grid_size=N_outer)
        if sub_road_system == [] :
            #print("Fail to generate outer roads.")
            return (2,)
        outer_roads += sub_road_system
        road_tiles += sum(sub_road_system,[])
    
    outer_exits, outer_walls, outer_inside = get_walls(outer_roads+[inner_walls]+[castle_walls],exit_options,grid_size=N)
    if outer_walls == [] :
        #print("Some exit is blocked.")
        return (3,)
    wall_tiles += outer_walls
    
    # Extend some roads to close the gap
    road_nodes = sum(outer_roads,[])
    for road in outer_roads:
        # get the extending vector
        if len(road)<2:
            continue
        x1,y1 = road[-1]
        x2,y2 = road[-2]
        next_node = (2*x1-x2,2*y1-y2)
        if next_node in road_nodes:
            road += [next_node]
    
    # relocate every point to the center ==================
    rX,rY = get_rgrid(outer_walls,N)
    rcX = (max(rX)+min(rX))*0.5
    rcY = (max(rY)+min(rY))*0.5
    
    c1 = np.sqrt(3)/2; c2 = 0.5
    cX = int(rcX*N/c1); cY = int(rcY*N-cX*c2)
    #plt.scatter(*get_rgrid([(cX,cY)],N),color="k",marker="x",zorder=3)
    
    # shift stuffs
    #----------------------------------------------------------
    shifted_road = castle_roads
    for iroad in range(len(shifted_road)):
        for inode in range(len(shifted_road[iroad])):
            x,y = shifted_road[iroad][inode]
            shifted_road[iroad][inode] = (x-cX,y-cY)
    shifted_road = inner_roads
    for iroad in range(len(shifted_road)):
        for inode in range(len(shifted_road[iroad])):
            x,y = shifted_road[iroad][inode]
            shifted_road[iroad][inode] = (x-cX,y-cY)
    shifted_road = outer_roads
    for iroad in range(len(shifted_road)):
        for inode in range(len(shifted_road[iroad])):
            x,y = shifted_road[iroad][inode]
            shifted_road[iroad][inode] = (x-cX,y-cY)
    #----------------------------------------------------------
    shifted_walls = castle_walls
    for inode in range(len(shifted_walls)):
        x,y = shifted_walls[inode]
        shifted_walls[inode] = (x-cX,y-cY)
    shifted_walls = inner_walls
    for inode in range(len(shifted_walls)):
        x,y = shifted_walls[inode]
        shifted_walls[inode] = (x-cX,y-cY)
    shifted_walls = outer_walls
    for inode in range(len(shifted_walls)):
        x,y = shifted_walls[inode]
        shifted_walls[inode] = (x-cX,y-cY)
    #----------------------------------------------------------
    shifted_exits = castle_exits
    for inode in range(len(shifted_exits)):
        if shifted_exits[inode]==None:
            continue
        x,y = shifted_exits[inode]
        shifted_exits[inode] = (x-cX,y-cY)
    shifted_exits = inner_exits
    for inode in range(len(shifted_exits)):
        if shifted_exits[inode]==None:
            continue
        x,y = shifted_exits[inode]
        shifted_exits[inode] = (x-cX,y-cY)
    shifted_exits = outer_exits
    for inode in range(len(shifted_exits)):
        if shifted_exits[inode]==None:
            continue
        x,y = shifted_exits[inode]
        shifted_exits[inode] = (x-cX,y-cY)
    
    # connect the road to the tile exit ===================
    exit_pairs = []
    exit_color = ["r","b","orange","cyan","magenta","lime"]
    corners = [ (0,N), (N,0), (N,-N), (0,-N), (-N,0), (-N,N), (0,N) ]
    for i,outer_exit in enumerate(outer_exits):
        if outer_exit != None:
            x1,y1 = corners[i]
            x2,y2 = corners[i+1]
            tile_exit = (int((x1+x2)/2),int((y1+y2)/2))
            exit_pairs += [ (outer_exit,tile_exit) ]
    
    # connect the pairs
    exit_roads = []
    for p1,p2 in exit_pairs:
        exit_roads += [connect_dots(p1,p2,N,outer_walls)]
    
    exit_road_tiles = sum(exit_roads,[])
    
    
    # rivers ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    if len(river_exit_options)>0:
        river_exits = []
        for i in range(len(corners)):
            if i+1 in rexits :

                cornerA = corners[i]
                cornerB = corners[i+1]
                yA = get_rcoords([cornerA],Ngrid)[0][1]
                yB = get_rcoords([cornerB],Ngrid)[0][1]
                if yB >= yA :
                    cornerA = corners[i+1]
                    cornerB = corners[i]
                    
                x1,y1 = cornerA
                x2,y2 = cornerB
                c1 = river_shift_ratio
                c2 = 1-river_shift_ratio
                river_exits += [(int(c1*x1+c2*x2),int(c1*y1+c2*y2))]
        
        # pick the tile center
        # center is one of the exits
        if len(river_exit_options)>1:
            if river_out!="":
                icenter = river_exit_options.index(river_out)
                center = river_exits[icenter]
            else:
                center = rand.choice(river_exits)
        else:
            center = rand.choice([ p for p in get_nb((0,0)) if p not in exit_road_tiles ])
        exit_pairs = []
        for river_exit in river_exits:
                if len(river_exit_options)>1 :
                    if river_exits.index(river_exit)==river_exits.index(center):
                        continue
                    exit_pairs += [ (river_exit,center) ]
                else :
                    exit_pairs += [ (center,river_exit) ]
        # connect the pairs
        exit_rivers = []
        for p1,p2 in exit_pairs:
            exit_rivers += [connect_dots(p1,p2,N,outer_walls,
                                preferred_tiles=sum(exit_rivers,[]),
                                crossing_tiles=exit_road_tiles)]
        # convert to normalized real coordinates
        exit_rivers = [ get_rgrid(river,N) for river in exit_rivers ]
        
        def contain_segment(segment_set,segment):
            canonical_set = [ canonical_order(s) for s in segment_set ]
            return canonical_order(segment) in canonical_set
        
        river_segmented = []
        river_system = exit_rivers
        segments = []
        for road in river_system:
            coords = [ (x,y) for x,y in zip(*road)]
            for j in range(len(coords)-1):
                if not contain_segment(segments,(coords[j],coords[j+1])):
                    segments += [(coords[j],coords[j+1])]
        river_segmented += segments
    else:
        river_segmented = []
    # :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    
    
    # convert to normalized real coordinates
    
    road_systems = []
    for road_system in [castle_roads,inner_roads,outer_roads,exit_roads]:
        rs_temp = [ get_rgrid(road,N) for road in road_system ]
        road_systems += [rs_temp]
    walls = []
    for wall in [castle_walls,inner_walls,outer_walls,corners]:
        walls += [ get_rgrid(wall,N) ]
    
    return (*road_systems,*walls,river_segmented)

def get_district(regtype_name,segments,nodes,segment_num,node_num,regtypes):
    segment_regtype, node_regtype = regtypes
    
    # randomly pick the region center
    center_pool = []
    for segment,regtype in zip(segments,segment_regtype):
        if regtype!="base":
            continue
        v1,v2 = segment
        center_pool += [ (np.array(v1)+np.array(v2))/2 ]
    for v,regtype in zip(nodes,node_regtype):
        if regtype!="base":
            continue
        center_pool += [ np.array(v) ]
    center = rand.choice(center_pool)
    
    def seg_pt_dist(seg,pt):
        return np.linalg.norm( np.array(pt)-(np.array(seg[0])+np.array(seg[1]))*0.5 )
    def node2_pt_dist(node2,pt):
        return np.linalg.norm( np.array(pt)-np.array(node2[0]) )
    
    seg_dist = [ seg_pt_dist(seg,center) for seg in segments ]
    node2_dist = [ node2_pt_dist(node2,center) for node2 in nodes ]
    seg_index = [ i for i in range(len(seg_dist))]
    node2_index = [ i for i in range(len(node2_dist))]
    seg_dindex = [ (dist,index) for dist,index,regtype in sorted(zip(seg_dist,seg_index,segment_regtype)) if regtype=="base" ]
    node2_dindex = [ (dist,index) for dist,index,regtype in sorted(zip(node2_dist,node2_index,node_regtype)) if regtype=="base" ]
    
    seg_dindex = sorted( seg_dindex )
    node2_dindex = sorted( node2_dindex )
    if len(seg_dindex)>segment_num:
        seg_dindex = seg_dindex[:segment_num]
    if len(node2_dindex)>node_num:
        node2_dindex = node2_dindex[:node_num]
    seg_dindex = [ index for dist,index in seg_dindex ]
    node2_dindex = [ index for dist,index in node2_dindex ]
    
    for i in seg_dindex:
        segment_regtype[i] = regtype_name
    for i in node2_dindex:
        node_regtype[i]    = regtype_name
    
    return segment_regtype, node_regtype

def get_building_type(ibs_size,obs_size,ibn_num,obs_regtype,obn_regtype):
    # ibs_size = [ inner building segments is "l" or "s" ]
    # obs_size = [ outer building segments is "l" or "s" ]
    # obs_isd  = [ outer building segments is dark or not ]
    # obn_isd  = [ outer building node2    is dark or not ]

    # Three types of buildings:
    #   sl = long segment
    #   ss = short segment
    #   n  = end node

    # five districts:
    #   i = inner
    #   o = base outer
    #   d = dark
    #   a = adventurer
    #   s = shopping

    # generic cities
    # (The first one is the default)
    # (add * at the end to make that building unique in its region)
    ibsl_typepool = ["mansion"]
    ibss_typepool = ["mansion"]
    ibn_typepool  = ["barrack","church*"]
    
    # base
    obsl_typepool = ["tavern","inn^","inn","bathhouse","crypt*","library*"]
    obss_typepool = ["house","restaurant","barber","church","security_post","park"]
    obn_typepool  = ["barrack","academy","cathedral*","airship_terminal*"]
    
    # dark
    dbsl_typepool = ["tavern","inn","brothel","nightclub","slave_market*"]
    dbss_typepool = ["house","house","drug_den","thief_guild*","slave_market*"]
    dbn_typepool  = ["slave_market*","casino"]

    # adventurer
    absl_typepool = ["tavern","adventurer_guild^","merchant_guild*","pet_shop*"]
    abss_typepool = ["house","armor_smith","weapon_smith","alchemist","relics_shop"]
    abn_typepool  = ["barrack","airship_terminal*","auction_house*"]
    
    # shopping
    sbsl_typepool = ["high-end_cloth_shop","merchant_guild*"] + ["high-end_restaurant"]*2
    sbss_typepool = ["house"] + ["restaurant","cloth_shop","accessory_shop","food_stall","security_post"]
    sbn_typepool  = ["barrack","airship_terminal*","academy*","auction_house*"]
    
    all_pool = [
                ibsl_typepool,ibss_typepool,ibn_typepool,
                obsl_typepool,obss_typepool,obn_typepool,
                dbsl_typepool,dbss_typepool,dbn_typepool,
                absl_typepool,abss_typepool,abn_typepool,
                sbsl_typepool,sbss_typepool,sbn_typepool
                ]
    
    default_chance = 0.5
    
    obs_isd = [ elem=="dark" for elem in obs_regtype ]
    obn_isd = [ elem=="dark" for elem in obn_regtype ]
    
    def get_pool(poolset):
        # check if there is "^"
        priority_set = [ elem for elem in poolset if elem[-1]=="^" ]
        if len(priority_set)>0:
            return rand.choice(priority_set)
        else:
            if len(poolset)>1:
                return rand.choice(poolset[1:])
            else:
                return poolset[0]
    def contains_up(poolset):
        for elem in poolset:
            if elem[-1]=="^":
                return True
        return False
    
    ibs_type = []
    for size in ibs_size:
        if size == "l" :
            if rand.rand()<default_chance and not contains_up(ibsl_typepool):
                ibs_type += [ibsl_typepool[0]]
            else:
                selected_type = get_pool(ibsl_typepool)
                if selected_type[-1] in ["*","^"]:
                    for pool in all_pool:
                        if selected_type in pool:pool.remove(selected_type)
                    selected_type = selected_type[:-1]
                ibs_type += [selected_type]
        else:
            if rand.rand()<default_chance and not contains_up(ibss_typepool):
                ibs_type += [ibss_typepool[0]]
            else:
                selected_type = get_pool(ibss_typepool)
                if selected_type[-1] in ["*","^"]:
                    for pool in all_pool:
                        if selected_type in pool:pool.remove(selected_type)
                    selected_type = selected_type[:-1]
                ibs_type += [selected_type]

    ibn_type = []
    for i in range(ibn_num):
        if rand.rand()<default_chance and not contains_up(ibn_typepool):
            ibn_type += [ibn_typepool[0]]
        else:
            selected_type = get_pool(ibn_typepool)
            if selected_type[-1] in ["*","^"]:
                for pool in all_pool:
                    if selected_type in pool:pool.remove(selected_type)
                selected_type = selected_type[:-1]
            ibn_type += [selected_type]

    obs_type = []
    for size, regtype in zip(obs_size,obs_regtype):
        if regtype=="dark":
            ltypepool = dbsl_typepool
            stypepool = dbss_typepool
            if size == "l" :
                if rand.rand()<default_chance and not contains_up(ltypepool):
                    obs_type += [ltypepool[0]]
                else:
                    selected_type = get_pool(ltypepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
            else:
                if rand.rand()<default_chance and not contains_up(stypepool):
                    obs_type += [stypepool[0]]
                else:
                    selected_type = get_pool(stypepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
        elif regtype=="adv":
            ltypepool = absl_typepool
            stypepool = abss_typepool
            if size == "l" :
                if rand.rand()<default_chance and not contains_up(ltypepool):
                    obs_type += [ltypepool[0]]
                else:
                    selected_type = get_pool(ltypepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
            else:
                if rand.rand()<default_chance and not contains_up(stypepool):
                    obs_type += [stypepool[0]]
                else:
                    selected_type = get_pool(stypepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
        elif regtype=="shp":
            ltypepool = sbsl_typepool
            stypepool = sbss_typepool
            if size == "l" :
                if rand.rand()<default_chance and not contains_up(ltypepool):
                    obs_type += [ltypepool[0]]
                else:
                    selected_type = get_pool(ltypepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
            else:
                if rand.rand()<default_chance and not contains_up(stypepool):
                    obs_type += [stypepool[0]]
                else:
                    selected_type = get_pool(stypepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
        else :
            if size == "l" :
                if rand.rand()<default_chance and not contains_up(obsl_typepool):
                    obs_type += [obsl_typepool[0]]
                else:
                    selected_type = get_pool(obsl_typepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
            else:
                if rand.rand()<default_chance and not contains_up(obss_typepool):
                    obs_type += [obss_typepool[0]]
                else:
                    selected_type = get_pool(obss_typepool)
                    if selected_type[-1] in ["*","^"]:
                        for pool in all_pool:
                            if selected_type in pool:pool.remove(selected_type)
                        selected_type = selected_type[:-1]
                    obs_type += [selected_type]
    
    obn_type = []
    for regtype in obn_regtype:
        if regtype=="dark":
            ltypepool = dbn_typepool
            if rand.rand()<default_chance and not contains_up(ltypepool):
                obn_type += [ltypepool[0]]
            else:
                selected_type = get_pool(ltypepool)
                if selected_type[-1] in ["*","^"]:
                    for pool in all_pool:
                        if selected_type in pool:pool.remove(selected_type)
                    selected_type = selected_type[:-1]
                obn_type += [selected_type]
        elif regtype=="adv":
            ltypepool = abn_typepool
            if rand.rand()<default_chance and not contains_up(ltypepool):
                obn_type += [ltypepool[0]]
            else:
                selected_type = get_pool(ltypepool)
                if selected_type[-1] in ["*","^"]:
                    for pool in all_pool:
                        if selected_type in pool:pool.remove(selected_type)
                    selected_type = selected_type[:-1]
                obn_type += [selected_type]
        elif regtype=="shp":
            ltypepool = sbn_typepool
            if rand.rand()<default_chance and not contains_up(ltypepool):
                obn_type += [ltypepool[0]]
            else:
                selected_type = get_pool(ltypepool)
                if selected_type[-1] in ["*","^"]:
                    for pool in all_pool:
                        if selected_type in pool:pool.remove(selected_type)
                    selected_type = selected_type[:-1]
                obn_type += [selected_type]
        else:
            if rand.rand()<default_chance and not contains_up(obn_typepool):
                obn_type += [obn_typepool[0]]
            else:
                selected_type = get_pool(obn_typepool)
                if selected_type[-1] in ["*","^"]:
                    for pool in all_pool:
                        if selected_type in pool:pool.remove(selected_type)
                    selected_type = selected_type[:-1]
                obn_type += [selected_type]

    return ibs_type, ibn_type, obs_type, obn_type

def get_dark_buildings(building_segs,building_node2,dds_num,ddn_num,dd_center):
    # return a list of bool [is_dark_building]

    # segs  = (node1,node2)
    # node2 = (node,direction)


    def seg_pt_dist(seg,pt):
        return np.linalg.norm( np.array(pt)-(np.array(seg[0])+np.array(seg[1]))*0.5 )
    def node2_pt_dist(node2,pt):
        return np.linalg.norm( np.array(pt)-np.array(node2[0]) )
    seg_dist = [ seg_pt_dist(seg,dd_center) for seg in building_segs ]
    node2_dist = [ node2_pt_dist(node2,dd_center) for node2 in building_node2 ]

    seg_index = [ i for i in range(len(seg_dist))]
    node2_index = [ i for i in range(len(node2_dist))]

    seg_dindex = [ (dist,index) for dist,index in sorted(zip(seg_dist,seg_index)) ]
    node2_dindex = [ (dist,index) for dist,index in sorted(zip(node2_dist,node2_index)) ]
    
    
    seg_dindex = sorted( seg_dindex )
    if len(seg_dindex)>dds_num:
        seg_dindex = seg_dindex[:dds_num]
    node2_dindex = sorted( node2_dindex )
    if len(node2_dindex)>ddn_num:
        node2_dindex = node2_dindex[:ddn_num]

    seg_dindex = [ index for dist,index in seg_dindex ]
    node2_dindex = [ index for dist,index in node2_dindex ]

    bd_seg_dtag = [ "dark" if (i in seg_dindex) else "base" for i in range(len(building_segs)) ]
    bd_node2_dtag = [ "dark" if (i in node2_dindex) else "base" for i in range(len(building_node2)) ]

    return bd_seg_dtag,bd_node2_dtag

def get_dark_district_center(iwall_segs,owall_segs,xroad_segs):
    iwall_nodes = list(set(sum( [ list(segment) for segment in iwall_segs ] ,[] )))
    owall_nodes = list(set(sum( [ list(segment) for segment in owall_segs ] ,[] )))
    xroad_nodes = list(set(sum( [ list(segment) for segment in xroad_segs ] ,[] )))

    exit_points = [ node for node in owall_nodes if node in xroad_nodes ]

    def distance(tuple1,tuple2):
        return np.linalg.norm( np.array(tuple1)-np.array(tuple2) )

    # for each point on owall, calculate the closest distance to one of iwall/exit
    # then get the maximum point
    dd_dist = -1
    dd_node = None
    for onode in owall_nodes:
        mindist = -1
        for inode in iwall_nodes+exit_points:
            dist = distance(onode,inode)
            if (mindist < 0) or (mindist>=0 and dist<mindist) :
                mindist = dist
        if mindist > dd_dist :
            dd_dist = mindist
            dd_node = onode

    return dd_node

def assign_building_loc(xy_roads,xy_walls):

    # convert each road segment to double segment (and scale by 2)
    xy_roads_temp = []
    for roadx,roady in xy_roads:
        roadx2 = []
        roady2 = []
        for i in range(len(roadx)-1):
            roadx2 += [roadx[i]*2]
            roady2 += [roady[i]*2]
            roadx2 += [roadx[i]+roadx[i+1]]
            roady2 += [roady[i]+roady[i+1]]
        roadx2 += [roadx[-1]*2]
        roady2 += [roady[-1]*2]
        xy_roads_temp += [[roadx2,roady2]]
    xy_roads = xy_roads_temp
    
    # scale wall by 2
    xy_walls_temp = []
    for wallx,wally in xy_walls:
        wallx2 = []
        wally2 = []
        for i in range(len(wallx)-1):
            wallx2 += [wallx[i]*2]
            wally2 += [wally[i]*2]
            wallx2 += [wallx[i]+wallx[i+1]]
            wally2 += [wally[i]+wally[i+1]]
        wallx2 += [wallx[-1]*2]
        wally2 += [wally[-1]*2]
        xy_walls_temp += [[wallx2,wally2]]
    xy_walls = xy_walls_temp
    
    shift_from_road = 0.5
    min_intsec_dist = 1.0
    min_build_dist = 0.5
    min_endseg_dist = 1.0

    intersection_minlegs = 3

    endseg_chance = 0.5
    intsec_chance = 0.02
    twoseg_chance = 0.5
    oneseg_chance = 1.0

    # convert roads and walls to list of coords
    def xy_to_coords(xy_list):
        ret = []
        for sublist in xy_list:
            temp = get_icoords([ (x,y) for x,y in zip(*sublist) ],Ngrid)
            ret += [temp]
        return ret
        
    roads = rand.shuffle(xy_to_coords(xy_roads))
    walls = rand.shuffle(xy_to_coords(xy_walls))
    # These two are now a list of chains
    # (chain = list of coords)

    road_nodes = sum(roads,[])
    wall_nodes = sum(walls,[])

    # get the road segments
    road_segments = []
    for road in roads:
        for i in range(len(road)-1):
            # single segment
            segment = canonical_order( road[i:i+2] )
            if segment not in road_segments:
                road_segments += [segment]
            
            # double segment
            #node1 = road[i]
            #node3 = road[i+1]
            #node2 = tuple(0.5*(np.array(node1)+np.array(node3)))
            #segment1 = canonical_order( [node1,node2] )
            #segment2 = canonical_order( [node2,node3] )
            #if segment1 not in road_segments:
            #    road_segments += [segment1]
            #if segment2 not in road_segments:
            #    road_segments += [segment2]
            
            
    wall_segments = []
    for wall in walls:
        for i in range(len(wall)-1):

            # define the canonical order
            segment = canonical_order( wall[i:i+2] )
            if segment not in wall_segments:
                wall_segments += [segment]

    building_list = []
    building_nodes = []

    # The idea is to get a list of roads satisfying
    # certain conditions, then assign buildings

    # ----------------------------------------------
    # End-segment:
    #                 ══════x
    # ----------------------------------------------

    road_end_nodes = []
    for road in roads:
        end_node = road[-1]

        if end_node in wall_nodes:
            continue

        segment0 = (end_node,(end_node[0]+1,end_node[1]))
        nroad = 0
        for i in range(6):
            if segment_rot(segment0,i) in road_segments:
                segment1 = segment_rot(segment0,i+3)
                nroad+=1
        # check if it is close to other end nodes
        dist_endseg_limit = min_endseg_dist/Ngrid*2
        # x2 because two end nodes should be
        # twice further apart

        if segment1[0] == end_node:
            other_end_node = segment1[1]
        else:
            other_end_node = segment1[0]

        w1 = np.array(get_rcoords([end_node],Ngrid)[0])
        w2 = np.array(get_rcoords([other_end_node],Ngrid)[0])
        dw = w1-w2

        is_ok = True
        for rnode in road_end_nodes:
            w0 = np.array(rnode[0])
            if (np.linalg.norm(w1-w0)<dist_endseg_limit):
                is_ok = False
                break
        if nroad==1 and is_ok and rand.rand()<endseg_chance:
            road_end_nodes += [(tuple(w1),tuple(dw))]

    # ----------------------------------------------
    # Intersection:
    #                       ║
    #                 ══════x══════
    #                       ║
    # ----------------------------------------------

    intersection_nodes = []
    for node in road_nodes:
        segment0 = (node,(node[0]+1,node[1]))
        nroad = 0
        for i in range(6):
            if segment_rot(segment0,i) in road_segments:
                nroad+=1

        if nroad>=intersection_minlegs and rand.rand()<intsec_chance:
            intersection_nodes += [node]
    intersection_nodes_int = intersection_nodes
    intersection_nodes = get_rcoords(intersection_nodes,Ngrid)

    # ----------------------------------------------
    # Two-segment:
    #                 ══════x══════
    # ----------------------------------------------

    two_segments = []
    for segment in road_segments:
        v1 = np.array(segment[0])
        v2 = np.array(segment[1])
        dv = v2-v1
        v0 = v1-dv
        v3 = v2+dv

        u0 = tuple(v0)
        u1 = tuple(v1)
        u2 = tuple(v2)
        u3 = tuple(v3)

        pre_segment = canonical_order( (u0,u1) )
        pst_segment = canonical_order( (u2,u3) )

        twoseg_candidates = []
        if pre_segment in road_segments:
            if (u0,u1,u2) not in two_segments:
                twoseg_candidates += [(u0,u1,u2)]
        if pst_segment in road_segments:
            if (u1,u2,u3) not in two_segments:
                twoseg_candidates += [(u1,u2,u3)]

        # check if there are any road cutting through
        for u1,u2,u3 in twoseg_candidates:
            if u2 in wall_nodes+intersection_nodes_int:
                break
            if not (segment_rot((u2,u3),1) in road_segments
                or segment_rot((u2,u3),2) in road_segments):
                 two_segments+=[ (u1,u2,u3) ]
            if not (segment_rot((u2,u3),4) in road_segments
                or segment_rot((u2,u3),5) in road_segments):
                 two_segments+=[ (u3,u2,u1) ]


    # randomly place the two-segment buildings
    bd_twoseg = []
    bd_nodes_twoseg = []
    for u1,u2,u3 in two_segments:

        # skip if it is near a sharp intersection
        roadwall_segments = road_segments+wall_segments
        if ( False
            or segment_rot((u1,u2),1) in roadwall_segments
            or segment_rot((u3,u2),5) in roadwall_segments
            ):
            continue

        ua = 0.5*(np.array(u1)+np.array(u2))
        ub = 0.5*(np.array(u2)+np.array(u3))
        va,vb = get_rcoords([ua,ub],Ngrid)
        va = np.array(va)
        vb = np.array(vb)

        dv = va-vb
        pv = np.array([dv[1],-dv[0]])*shift_from_road
        dist_limit = np.linalg.norm(dv)*min_build_dist
        dist_endseg_limit = np.linalg.norm(dv)*min_endseg_dist
        dist_intsec_limit = np.linalg.norm(dv)*min_intsec_dist

        if rand.rand() < twoseg_chance :
            wa = va+pv
            wb = vb+pv

            # check if wa or wb is too close to existing nodes
            all_nodes = building_nodes+bd_nodes_twoseg
            is_ok = True
            for node in all_nodes:
                w_test = np.array(node)
                if (np.linalg.norm(wa-w_test)<dist_limit
                    or np.linalg.norm(wb-w_test)<dist_limit):
                    is_ok = False
                    break
            for node in road_end_nodes:
                w_test = np.array(node[0])
                if (np.linalg.norm(wa-w_test)<dist_endseg_limit
                    or np.linalg.norm(wb-w_test)<dist_endseg_limit):
                    is_ok = False
                    break
            for node in intersection_nodes:
                w_test = np.array(node)
                if (np.linalg.norm(wa-w_test)<dist_intsec_limit
                    or np.linalg.norm(wb-w_test)<dist_intsec_limit):
                    is_ok = False
                    break
            if is_ok:
                #wx = [wa[0],wb[0]]
                #wy = [wa[1],wb[1]]
                #bd_twoseg += [ [wx,wy] ]
                bd_twoseg += [ (wa,wb) ]
                bd_nodes_twoseg += [ tuple(wa), tuple(wb) ]

                # add midpoints as a node as well
                wc1 = tuple(0.25*(3*wa+wb))
                wc2 = tuple(0.25*(wa+3*wb))
                wc3 = tuple(0.5*(wa+wb))
                bd_nodes_twoseg += [ tuple(wc1) ]
                bd_nodes_twoseg += [ tuple(wc2) ]
                bd_nodes_twoseg += [ tuple(wc3) ]

    building_list += bd_twoseg
    building_nodes += bd_nodes_twoseg

    # ----------------------------------------------
    # One-segment:
    #                 ══════
    # ----------------------------------------------

    one_segments = []
    for u1,u2 in road_segments:
        one_segments += [ ( u1,u2 ), (u2,u1) ]

    bd_oneseg = []
    bd_nodes_oneseg = []
    for u1,u2 in one_segments:

        # skip if it is near a sharp intersection
        roadwall_segments = road_segments+wall_segments
        if ( False
            or segment_rot((u1,u2),5) in roadwall_segments
            or segment_rot((u2,u1),1) in roadwall_segments
            ):
            continue

        v1,v2 = get_rcoords([u1,u2],Ngrid)
        v1 = np.array(v1)
        v2 = np.array(v2)

        vc = 0.5*(v1+v2)
        dv = v2-v1

        building_length_ratio = 0.5
        va = vc-dv*building_length_ratio*0.5
        vb = vc+dv*building_length_ratio*0.5
        pv = np.array([dv[1],-dv[0]])*shift_from_road
        dist_limit = np.linalg.norm(dv)*min_build_dist
        dist_endseg_limit = np.linalg.norm(dv)*min_endseg_dist
        dist_intsec_limit = np.linalg.norm(dv)*min_intsec_dist

        if rand.rand() < oneseg_chance :
            wa = va+pv
            wb = vb+pv

            # check if wa or wb is too close to existing nodes
            all_nodes = building_nodes+bd_nodes_oneseg
            is_ok = True
            for node in all_nodes:
                w_test = np.array(node)
                if (np.linalg.norm(wa-w_test)<dist_limit
                    or np.linalg.norm(wb-w_test)<dist_limit):
                    is_ok = False
                    break
            for node in road_end_nodes:
                w_test = np.array(node[0])
                if (np.linalg.norm(wa-w_test)<dist_endseg_limit
                    or np.linalg.norm(wb-w_test)<dist_endseg_limit):
                    is_ok = False
                    break
            for node in intersection_nodes:
                w_test = np.array(node)
                if (np.linalg.norm(wa-w_test)<dist_intsec_limit
                    or np.linalg.norm(wb-w_test)<dist_intsec_limit):
                    is_ok = False
                    break
            if is_ok:
                #wx = [wa[0],wb[0]]
                #wy = [wa[1],wb[1]]
                #bd_oneseg += [ [wx,wy] ]
                bd_oneseg += [ (wa,wb) ]
                bd_nodes_oneseg += [ tuple(wa), tuple(wb) ]

                # add midpoints as a node as well
                wc1 = tuple(0.25*(3*wa+wb))
                wc2 = tuple(0.25*(wa+3*wb))
                wc3 = tuple(0.5*(wa+wb))
                bd_nodes_twoseg += [ tuple(wc1) ]
                bd_nodes_twoseg += [ tuple(wc2) ]
                bd_nodes_twoseg += [ tuple(wc3) ]

    building_list += bd_oneseg
    building_nodes += bd_nodes_oneseg

    def buildlen(segment):
        v0 = np.array(segment[0])
        v1 = np.array(segment[1])
        dv = 0.5*(v1-v0)
        return np.linalg.norm(dv)
    
    
    # rescale back by half
    building_list = [ half_scale(building,"segment") for building in building_list ]
    road_end_nodes = [ half_scale(building,"node") for building in road_end_nodes ]
    intersection_nodes = [ half_scale(building,"intersection") for building in intersection_nodes ]
    
    building_list = [
            shrink(building,0.5)
            if buildlen(building)<0.2/Ngrid
            else shrink(building,0.8)
        for building in building_list ]
    
    return building_list, road_end_nodes, intersection_nodes

def connect_dots(p1,p2,N,forbidden_tiles=[],preferred_tiles=[],crossing_tiles=[]):
    
    grange = [ i for i in range(-N,N+1) ]
    igrid = [ (x,y) for x in grange for y in grange if x+y<=N and -N<=x+y ]
    
    M=N-1
    grange2 = [ i for i in range(-M,M+1) ]
    igrid2 = [ (x,y) for x in grange2 for y in grange2 if x+y<=M and -M<=x+y ]
    grid_border = [ node for node in igrid if node not in igrid2 ]
    
    to_avoid = [ node for node in forbidden_tiles+grid_border if node not in [p1,p2] ]
    
    currect_dist = 0
    dist_map_p = [ p1 ]
    dist_map_d = [ currect_dist ]
    last_walkers = [ p1 ]
    while True:
        currect_dist += 1
        to_add = []
        found_p2 = False
        for p in last_walkers:
            next_steps = [ node for node in get_nb(p) if node in igrid and node not in to_avoid+dist_map_p+to_add ]
            to_add += next_steps
            if p2 in next_steps :
                found_p2 = True
                break
        dist_map_p += to_add
        dist_map_d += [ currect_dist for node in to_add ]
        last_walkers = to_add
        if found_p2 :
            break
        if to_add == []:
            # cannot find p2?
            print("??")
            return []
    
    # change var name a bit
    args = dist_map_p
    dist = dist_map_d
    
    walker = p2
    d = dist[args.index(walker)]
    path = [walker]
    walking_dir = (0,0)
    while d > 0:
        next_steps = [ node for node in get_nb(walker) if node in args ]
        if walker in crossing_tiles:
            front_pan_dir = front_pan(walking_dir)
            next_steps = [ ( walker[0]+v[0], walker[1]+v[1] ) for v in front_pan_dir ]
            next_steps = [ node for node in next_steps if node in args ]
            next_steps = [ node for node in next_steps if node not in crossing_tiles ]
        
        # if no possible next step, allow going around
        next_steps_test = [ node for node in next_steps if dist[args.index(node)]<d]
        if len(next_steps_test)==0 :
            next_steps = [ node for node in next_steps if dist[args.index(node)]<=d]
        else:
            next_steps = next_steps_test
        
        
        preferred_next_steps = [ node for node in next_steps if node in preferred_tiles ]
        
        if len(preferred_next_steps)>0:
            next_steps = preferred_next_steps
        
        # try not to go trough the crossing tiles
        next_steps_test = [ node for node in next_steps if node not in crossing_tiles ]
        if len(next_steps_test)>0 :
            next_steps = next_steps_test
        
        
        next_step = rand.choice(next_steps)
        walking_dir = ( next_step[0]-walker[0], next_step[1]-walker[1] )
        walker = next_step
        d = dist[args.index(walker)]
        path+=[walker]
    
    #plt.plot(*get_rgrid(path,N))
    
    return path

def front_pan(walking_dir):
    # returns three directions in front
    segment1 = ((0,0),walking_dir)
    segment2 = segment_rot(segment1,1)
    segment3 = segment_rot(segment1,-1)
    
    v1 = walking_dir
    v2 = segment2[0] if segment2[1]==(0,0) else segment2[1]
    v3 = segment3[0] if segment3[1]==(0,0) else segment3[1]
    
    return [v1,v2,v3]
    
def get_walls(roads,exit_options="",grid_size=10,allowed_tiles=[],forbidden_tiles=[]):
    # the exit options indicates the exit roads in each directions
    # 1 means 1 oclock direction, 2 means 3 oclock, etc
    
    roads = copy.deepcopy(roads)
    allowed_tiles = allowed_tiles.copy()
    forbidden_tiles = forbidden_tiles.copy()
    
    grange = [ i for i in range(-grid_size,grid_size+1) ]
    igrid = [ (x,y) for x in grange for y in grange if x+y<=grid_size and -grid_size<=x+y ]
    X,Y = get_rgrid(igrid,grid_size)
    Z = []
    Z += [[ ix+iy for ix,iy in igrid ]]
    Z += [[ ix for ix,iy in igrid ]]
    Z += [[ -iy for ix,iy in igrid ]]
    Z += [[ -ix-iy for ix,iy in igrid ]]
    Z += [[ -ix for ix,iy in igrid ]]
    Z += [[ iy for ix,iy in igrid ]]
    
    end_nodes = [ road[-1] for road in roads ]
    exit_nodes = []
    exit_nodes_with_blank = []
    for i in range(1,7):
        if str(i) in exit_options:
            max_z = -grid_size
            max_node = (0,0)
            for node in end_nodes:
                node_z = Z[i-1][igrid.index(node)]
                if node_z > max_z :
                    max_node = node
                    max_z = node_z
            if max_node == (0,0):
                print("Cannot identify the exit node.")
                exit
            exit_nodes += [max_node]
            exit_nodes_with_blank += [max_node]
        else:
            exit_nodes_with_blank += [None]
    
    exit_nodes_unique = list(set(exit_nodes))
    
    non_exit = []
    for road in roads:
        non_exit += [ node for node in road if node not in exit_nodes]
    
    wall_candidate = allowed_tiles
    for node in non_exit :
        wall_candidate += [ tile for tile in get_nb(node) if tile not in non_exit+forbidden_tiles ]
    
    attempts = 0
    while True:
        if attempts > 100:
            return [],[],[]
        # Walker to trace the wall
        walker = rand.choice(exit_nodes_unique)
        wall_nodes = [walker]
        back_tracker = 0
        backtracked_nodes = []
        while True:
            next_nodes = [ node for node in get_nb(walker) if node in wall_candidate and node not in wall_nodes ]
            
            reroll = False
            
            if len(next_nodes)>0 :
                walker = rand.choice(next_nodes)
                back_tracker = 0
            else:
                
                if wall_nodes[0] in [ node for node in get_nb(walker) if node in wall_candidate]:
                    walker = wall_nodes[0]
                    # weird case where the wall hits a dead end from the start
                    if back_tracker>0 or wall_nodes[-2]==walker:
                        return [],[],[]
                else:        
                    back_tracker += 1
                    backtracked_nodes += [walker]
                    if 2*back_tracker>len(wall_nodes):
                        return [],[],[]
                    walker = wall_nodes[-2*back_tracker]
            wall_nodes += [walker]
            
            if walker == wall_nodes[0] and not reroll :
                break
        
        # remove "open walls"
        sub_attempts = 0
        while True:
            if sub_attempts>100:
                return [],[],[]
            temp = []
            i = 0
            while i<len(wall_nodes):
                temp += [wall_nodes[i]]
                if i<len(wall_nodes)-3 and wall_nodes[i]==wall_nodes[i+2] :
                    i+=3
                    continue
                i+=1     
            if len(wall_nodes)==len(temp) :
                break
            wall_nodes = temp
            sub_attempts += 1
        
        # remove "jagged walls"
        sub_attempts = 0
        while True:
            if sub_attempts>100:
                return [],[],[]
            temp = []
            i = 0
            while i<len(wall_nodes):
                temp += [wall_nodes[i]]
                if i<len(wall_nodes)-3:
                    w1 = wall_nodes[i]
                    w2 = wall_nodes[i+1]
                    w3 = wall_nodes[i+2]
                    if w1 in get_nb(w2) and w2 in get_nb(w3) and w3 in get_nb(w1) :
                        i+=2
                        continue
                i+=1     
            if len(wall_nodes)==len(temp) :
                break
            wall_nodes = temp
            sub_attempts += 1
        
        # condition: wall dimensions must be at least the size of its contents
        inner_content = sum(roads,[])
        icx,icy = get_rgrid(inner_content,grid_size)
        wx,wy   = get_rgrid(wall_nodes,grid_size)
        eps = 1e-7
        wall_enclosed = min(icx)+eps>min(wx) and min(icy)+eps>min(wy) and max(icx)<max(wx)+eps and max(icy)<max(wy)+eps
        
        # check if all exits are on the wall
        wall_has_exit = True
        for exit_node in exit_nodes_with_blank:
            if exit_node == None :
                continue
            wall_has_exit = wall_has_exit and (exit_node in wall_nodes)
        
        wall_enclosed = wall_enclosed and wall_has_exit
        
        if wall_enclosed :
            break
        attempts += 1
    
    # obtain areas inside the wall
    inside_nodes = non_exit
    inside_nodes += sum([ get_nb(node) for node in non_exit[1:] ],[])
    inside_nodes = [ node for node in inside_nodes if node not in wall_nodes]
    
    # check if the exit is not blocked
    for exit_node in exit_nodes:
        exit_nb = [ node for node in get_nb(exit_node) if node not in inside_nodes and node not in wall_nodes ]
        if len(exit_nb) == 0:
            return [],[],[]
    
    #plt.scatter(*get_rgrid(inside_nodes,grid_size),color="orange")
    
    return exit_nodes_with_blank,wall_nodes,inside_nodes
    
def grow_roads(seed_coords,road_tiles_prev=[],wall_tiles=[],nroad=8,lenrange=(2,6),grid_size=10):
    
    road_tiles_prev = road_tiles_prev.copy()
    wall_tiles = wall_tiles.copy()
    
    minlen,maxlen = lenrange
    grange = [ i for i in range(-grid_size,grid_size+1) ]
    igrid = [ (x,y) for x in grange for y in grange if x+y<=grid_size and -grid_size<=x+y ]
    
    # generate some roads ---------------------------------
    # starting from existing node, extend further
    # The node is (x,y,d) where d is the distance from origin
    
    road_tiles = [(*seed_coords,0)]
    roads = []
    for iroad in range(100):
        if len(roads)>=nroad:
            break
        road_tiles_xy = [ elem[:2] for elem in road_tiles ]
        end_nodes = [ road[-1][:2] for road in roads ]
        
        if len(roads) == 0 :
            this_node = rand.choice(road_tiles_xy)
            attempts = 0
            while road_tiles_xy.count(this_node)>1 or this_node in end_nodes:
                if attempts>100:
                    return []
                this_node = rand.choice(road_tiles_xy)
                attempts += 1
        else :
            this_node = rand.choice(road_tiles_xy[1:])
            attempts = 0
            while road_tiles_xy.count(this_node)>1 or this_node in end_nodes:
                if attempts>100:
                    return []
                this_node = rand.choice(road_tiles_xy[1:])
                attempts += 1
        # initial node
        this_dist = [ node[2] for node in road_tiles if node[:2]==this_node ][0]
        
        # randomize the road length
        max_length = max(maxlen-this_dist,minlen)+1
        road_length = rand.randrange(minlen,max_length)
        this_road = [this_node]
        this_road_wd = [(*this_node,this_dist)]
        for i in range(road_length):
            nx,ny = this_node
            next_nodes = [ (nx+1,ny), (nx,ny+1), (nx-1,ny+1), (nx-1,ny), (nx,ny-1), (nx+1,ny-1) ]
            
            if i>0 :
                prev_node = this_road[-2]
                next_nodes = [ node for node in next_nodes if prev_node not in get_nb(node) ]
                
                if len(roads)>0 :
                    next_nodes = [ node for node in next_nodes if seed_coords not in get_nb(node) ]
            
            next_nodes = [ node for node in next_nodes if node not in road_tiles_xy+this_road+wall_tiles+road_tiles_prev ]
            
            if next_nodes == [] :
                break
            
            next_node = rand.choice(next_nodes)
            
            if next_node not in igrid :
                break
            
            this_node = next_node
            this_dist += 1
            
            this_road_wd += [ (*this_node,this_dist) ]
            this_road += [ this_node ]
        road_tiles += this_road_wd
        roads += [this_road]
    ret = []
    for road in roads:
        ret += [[ node[:2] for node in road ]]
    return ret

def get_nb(icoord):
    nx,ny = icoord
    return [ (nx+1,ny), (nx,ny+1), (nx-1,ny+1), (nx-1,ny), (nx,ny-1), (nx+1,ny-1) ]

def get_nb2(icoord):
    nb2 = []
    for nb in get_nb(icoord):
        nb2 += get_nb(nb)
    return nb2

def get_rgrid(igrid,grid_size):
    # rx = ix*c1
    # ry = ix*c2+iy
    # ix = rx/c1
    # iy = ry-ix*c2
    c1 = np.sqrt(3)/2
    c2 = 0.5
    grid = [ (xy[0]*c1,xy[0]*c2+xy[1]) for xy in igrid ]
    X = [ elem[0]/grid_size for elem in grid ]
    Y = [ elem[1]/grid_size for elem in grid ]
    return X,Y

def get_rcoords(igrid,grid_size):
    # rx = ix*c1
    # ry = ix*c2+iy
    # ix = rx/c1
    # iy = ry-ix*c2
    c1 = np.sqrt(3)/2
    c2 = 0.5
    return [ (xy[0]*c1/grid_size,(xy[0]*c2+xy[1])/grid_size) for xy in igrid ]

def get_icoords(rgrid,grid_size):
    # rx = ix*c1
    # ry = ix*c2+iy
    # ix = rx/c1
    # iy = ry-ix*c2 = ry-rx*c2/c1
    c1 = np.sqrt(3)/2
    c2 = 0.5
    
    return [ (  snap(xy[0]/c1*grid_size),
                snap(xy[1]*grid_size-xy[0]*c2/c1*grid_size)
                )
            for xy in rgrid ]

def snap(x):
    ret = int(np.rint(x))
    if np.abs(ret-x)>1e-10:
        print("The number cannot be snapped to integer!")
        print(x,"vs",ret)
        exit()
    return ret

def canonical_order(segment):
    v1 = segment[0]
    v2 = segment[1]
    if v1[0]>v2[0] or (v1[0]==v2[0] and v1[1]>v2[1]):
        return (v1,v2)
    else:
        return (v2,v1)

def segment_rot(segment,amount):
    v0 = segment[0]
    dv = (segment[1][0]-segment[0][0],segment[1][1]-segment[0][1])

    clock = [ (+1,0), (0,+1), (-1,+1), (-1,0), (0,-1), (+1,-1) ]

    #
    #              (+1, 0)
    #   (+1,-1)               ( 0,+1)
    #              ( 0, 0)
    #   ( 0,-1)               (-1,+1)
    #              (-1, 0)
    #
    scaling = 1
    try:
        iseg = clock.index(dv)
    except:
        scaling = 0.5
        dv = (snap(2*dv[0]),snap(2*dv[1]))
        iseg = clock.index(dv)
    du = tuple(np.array(clock[ np.mod(iseg+amount,6) ])*scaling)
    return canonical_order((v0,(v0[0]+du[0],v0[1]+du[1])))

def shrink(segment,shrink_ratio):
    v0 = np.array(segment[0])
    v1 = np.array(segment[1])
    vc = 0.5*(v1+v0)
    dv = 0.5*(v1-v0)
    u0 = vc-dv*shrink_ratio
    u1 = vc+dv*shrink_ratio
    return (tuple(u0),tuple(u1))

def half_scale(item,type="segment"):
    if type=="segment" :
        return ( (item[0][0]*0.5,item[0][1]*0.5), (item[1][0]*0.5,item[1][1]*0.5) )
    elif type=="node" :
        return ( (item[0][0]*0.5,item[0][1]*0.5), item[1] )
    elif type=="intersection" :
        return (item[0]*0.5,item[1]*0.5)