import numpy as np

import namegen
import mapgen_rand as rand
import matplotlib.colors as mcolors
import copy

d = 0.8

'''
    -----------------------------------------------------
        How to customize the map engine
    -----------------------------------------------------
    
    You can set some rules in sort_tiles() to customize your map.
    Each tile has its tags which can be used in the sorting.
    
    You also need to customize generate_coords() on the line marked with "customize the engine here".

'''
# This is the main function
def get_town_coords(nation_data, landmark_data, location_data, rivers_data, global_seed):
    #print("Seed:",global_seed)
    seed0 = global_seed
    
    rand.set_seed(global_seed)
    global_seed = int(rand.rand()*1e8)
    rand.set_seed(global_seed)
    
    # Generate namespace --------------------------------
    namegen.reset()
    namegen.set_seed(global_seed)

    for nation in nation_data :
        namegen.append_nation(*nation)
    
    # Reorganize the data -------------------------------
    town_list = get_town_list()
    for landmark in landmark_data:
        append_grid(town_list,*landmark)
    town_list = sort_tiles(town_list)

    name_list = []
    tags_list = []
    for key in town_list.keys():
        tags = key.split("|")[1].split(",")
        if len(town_list[key])==0:
            tags_list+=[tags]
            name_list+=[key.split("|")[0]]
        else:
            for town in town_list[key]:
                tags_list+=[tags]
                name_list+=[town]
    


    # =========================================================================
    # Step 1 : Region map =====================================================
    # =========================================================================
    
    # Obtain the coordinates ----------------------------
    coords_list = generate_coords(town_list)


    # =========================================================================
    # Step 2 : subdivide the lattice ==========================================
    # =========================================================================

    do_subdivision = True
    name_list_backup = copy.deepcopy(name_list)
    tags_list_backup = copy.deepcopy(tags_list)
    coords_list_backup = copy.deepcopy(coords_list)
    attempt_count = 0
    while do_subdivision :
        unique_names = np.sort(list(set(name_list)))
        sanity_check0 = []
        for name_ in unique_names:
            if len(name_.split("|"))>1:
                sanity_check0+=[name_.split("|")[1]]
            else:
                sanity_check0+=[name_]
        sanity_check0 = np.sort(list(set(sanity_check0)))

        name_list,tags_list,coords_list = subdivide(name_list,tags_list,coords_list,[1,1,1,1])
        name_list,tags_list,coords_list = subdivide(name_list,tags_list,coords_list,[1,-1,-1,1])
        name_list,tags_list,coords_list = remove_sea_tiles(name_list,tags_list,coords_list)
        
        unique_names = np.sort(list(set(name_list)))
        sanity_check1 = []
        for name_ in unique_names:
            if len(name_.split("|"))>1:
                sanity_check1+=[name_.split("|")[1]]
            else:
                sanity_check1+=[name_]
        sanity_check1 = np.sort(list(set(sanity_check1)))

        if len(sanity_check0)!=len(sanity_check1) :
            name_list = copy.deepcopy(name_list_backup)
            tags_list = copy.deepcopy(tags_list_backup)
            coords_list = copy.deepcopy(coords_list_backup)


        do_subdivision = (len(sanity_check0)!=len(sanity_check1))
        attempt_count+=1

        if attempt_count>3:
            new_seed = global_seed-1
            #print("Failed to perform subdivision. Redo from scratch!")
            return get_town_coords(nation_data, landmark_data, location_data, rivers_data, new_seed)


    # =========================================================================
    # Step 3 : Fill in the sea tiles ==========================================
    # =========================================================================

    name_list,tags_list,coords_list = fill_sea_tiles(name_list,tags_list,coords_list)
    
    land_count = len([ item for item in tags_list if "sea" not in item ])
    sea_count = len([ item for item in tags_list if "sea" in item ])
    total_count = len(tags_list)
    #print("number of land tiles:",land_count)
    

    # =========================================================================
    # Step 3.5 : Make corresponding dictionary ================================
    # =========================================================================

    name_dict = {}
    tags_dict = {}
    for name,tags,coords in zip(name_list,tags_list,coords_list):
        name_dict[str(coords)] = name
        tags_dict[str(coords)] = tags


    # =========================================================================
    # Step 4 : Find boundary ==================================================
    # =========================================================================
    
    boundaries = get_boundary(name_list,tags_list,coords_list)
    # a dict of a list of (x,y,symbol)
    
    # also make a list of all mountain tiles
    mountain_tiles = []
    for key in boundaries:
        for x,y,sym in boundaries[key]:
            if sym == "Λ":
                mountain_tiles+=[(x,y)]
    
    # =========================================================================
    # Step 5 : Locate towns ===================================================
    # =========================================================================
    
    town_loc_dict = get_town_loc(name_list,tags_list,coords_list,boundaries)

    # =========================================================================
    # Step 6 : Capitals =======================================================
    # =========================================================================
    
    # Identify the capital city
    kingdom_list = []
    new_town_loc_dict = {}
    for key in town_loc_dict:
        if len(key.split("|"))>1 :
            kingdom_name = key.split("|")[2]
            if kingdom_name not in kingdom_list:
                kingdom_list += [kingdom_name]
                new_town_loc_dict[key+"*"] = town_loc_dict[key]
            else:
                new_town_loc_dict[key] = town_loc_dict[key]
        else:
            new_town_loc_dict[key] = town_loc_dict[key]
    town_loc_dict = new_town_loc_dict
    
    # make the list version
    town_tiles = []
    for key in town_loc_dict:
        town_tiles += [town_loc_dict[key]]
    
    # =========================================================================
    # Step 6.5 : Locate villages ==============================================
    # =========================================================================
    
    ind = -1
    village_tiles = []
    for coords,tags,name_ in zip(coords_list,tags_list,name_list):
        ind += 1
        nbs = get_2nb(coords)
        
        if "sea" in tags or "island" in tags or coords in town_tiles or coords in mountain_tiles:
            continue
        
        # exclude non-nation
        if len(name_.split("|"))<2 :
            continue
        
        next_to_vlg = False
        for nb in nbs:
            if nb in village_tiles:
                next_to_vlg = True
                break
        
        if not next_to_vlg:
            if "" in tags :
                village_chance = 0.8
            elif "highland" in tags :
                village_chance = 0.4
            elif "ice" in tags or "desert" in tags :
                village_chance = 0.2
            else:
                village_chance = 0.0
            if rand.rand() < village_chance :
                village_tiles+=[coords]
        
    village_loc_list = []
    for coords in village_tiles :
        village_loc_list += [rcoords(coords)]
    
    # =========================================================================
    # Step 7 : Dist to sea ====================================================
    # =========================================================================
    
    # get the beach tiles
    level_list = [ 0 for i in tags_list ]
    for key in tags_dict:
        if 'sea' in tags_dict[key] or 'island' in tags_dict[key]:
            continue
        coords = key_to_coords(key)
        ind = coords_list.index(coords)
        
        # get the neighbour
        neighbours = get_nb(coords)
        is_beach = False
        for nb in neighbours:
            if 'sea' in tags_dict[str(nb)]:
                is_beach = True
                break
        if is_beach :
            level_list[ind] = 1
    
    # Now do it recursively
    replaced_num = 1234
    current_level = 1
    
    while replaced_num>0 :
        replaced_num = 0
        for key in tags_dict:
            if 'sea' in tags_dict[key]:
                continue
            coords = key_to_coords(key)
            ind = coords_list.index(coords)
            
            if level_list[ind]>0 and level_list[ind] <= current_level:
                continue
            
            # get the neighbour
            neighbours = get_nb(coords)
            is_on_level = False
            for nb in neighbours:
                nb_ind = coords_list.index(nb)
                if level_list[nb_ind]==current_level:
                    is_on_level = True
                    break
            if is_on_level :
                level_list[ind] = current_level+1
                replaced_num += 1
        current_level +=1
    
    # make the dict version
    level_dict = {}
    for coords,level in zip(coords_list,level_list):
        level_dict[str(coords)] = level
    
    rcoords_list = []
    for coords in coords_list:
        rcoords_list += [rcoords(coords)]
    
    # =========================================================================
    # Step 8 : Rivers =========================================================
    # =========================================================================
    
    # Get forrest tiles
    forrest_tiles = []
    for coords,tags in zip(coords_list,tags_list):
        if "forrest" in tags:
            forrest_tiles += [coords]
    
    nrivers = rand.randrange(rivers_data[0],rivers_data[1]+1)
    
    # randomize the river source
    river_src = []
    for i in range(nrivers):
        if len(mountain_tiles)+len(forrest_tiles)==0 :
            break
        src_temp = rand.choice(mountain_tiles*4+forrest_tiles)
        attempts = 0
        break_attempt = False
        while src_temp in river_src or level_dict[str(src_temp)]<4:
            src_temp = rand.choice(mountain_tiles*4+forrest_tiles)
            attempts+=1
            if attempts>100 :
                break_attempt = True
                break
        if break_attempt:
            break
        else:
            river_src += [src_temp]
    nrivers = len(river_src)
    
    # generate rivers
    rivers = [ [v] for v in river_src ]
    for ir in range(nrivers):
        while level_dict[str(rivers[ir][-1])]>0 :
            this_tile = rivers[ir][-1]
            
            # 1 part same level & 4 parts lower level
            nb_tiles = ([ tile for tile in get_nb(this_tile) if
                            (
                                level_dict[str(tile)] == level_dict[str(this_tile)]
                                and
                                tile not in mountain_tiles
                                and
                                tile not in rivers[ir]
                                and
                                "highland" not in tags_dict[str(tile)]
                                and
                                "volcanic" not in tags_dict[str(tile)]
                                and
                                "island" not in tags_dict[str(tile)]
                            )]
                       +[ tile for tile in get_nb(this_tile) if
                            (
                                level_dict[str(tile)] < level_dict[str(this_tile)]
                                and
                                tile not in mountain_tiles
                                and
                                tile not in rivers[ir]
                                and
                                "highland" not in tags_dict[str(tile)]
                                and
                                "volcanic" not in tags_dict[str(tile)]
                                and
                                "island" not in tags_dict[str(tile)]
                            )]*4)
            if len(nb_tiles)==0:
                rivers[ir] = []
                break
            picked_tile = rand.choice(nb_tiles)
            all_river_tiles = sum(rivers,[])
            rivers[ir] += [picked_tile]
            
            # break if this river joins an existing river
            if picked_tile in all_river_tiles:
                break
    
    # collect river tiles
    river_tiles = []
    for ir in range(len(rivers)):
        for it in range(len(rivers[ir])):
            river_tiles += [rivers[ir][it]]
    
    # convert to physical coords
    for ir in range(len(rivers)):
        for it in range(len(rivers[ir])):
            level = level_dict[str(rivers[ir][it])]
            rivers[ir][it] = (*rcoords(rivers[ir][it]),level)
    
    # =========================================================================
    # Step 9 : Roads ==========================================================
    # =========================================================================
    
    # create a blank dict separate by nation
    townnat_loc_list = {}
    for key in town_loc_dict:
        if len(key.split("|"))==1 :
            continue
        nat = key.split("|")[1]
        tags = tags_dict[str(town_loc_dict[key])]
        if "island" in tags:
            continue
        if nat not in townnat_loc_list:
            townnat_loc_list[nat] = {}
    # assign the dict
    for key in town_loc_dict:
        if len(key.split("|"))==1 :
            continue
        nat = key.split("|")[1]
        tags = tags_dict[str(town_loc_dict[key])]
        if "island" in tags:
            continue
        townnat_loc_list[nat][key] = town_loc_dict[key]
    # get all tiles in each nation
    nation_tiles = {}
    for coords,name,tags in zip(coords_list,name_list,tags_list):
        if "sea" in tags or "island" in tags:
            continue
        nat = get_nation(name).replace("<nonnation>","")
        if nat not in nation_tiles:
            nation_tiles[nat] = [coords]
        else:
            nation_tiles[nat] += [coords]
    
    # Get distance map from each town
    dist_map = {}
    for nat in townnat_loc_list:
        dist_map[nat] = {}
        ntiles = len(nation_tiles[nat])
        for town in townnat_loc_list[nat]:
            dist_map[nat][town] = {}
            marked_tiles = [town_loc_dict[town]]
            marked_tiles_dst = [0]
            while len(marked_tiles)<ntiles :
                current_dist = marked_tiles_dst[-1]+1
                len0 = len(marked_tiles)
                to_add_tiles = []
                to_add_tiles_dst = []
                for mt,dist in zip(marked_tiles,marked_tiles_dst):
                    nbs = get_nb(mt)
                    for nb in nbs:
                        if nb in marked_tiles+to_add_tiles or nb not in nation_tiles[nat]:
                            continue
                        to_add_tiles += [nb]
                        to_add_tiles_dst += [current_dist]
                marked_tiles += to_add_tiles
                marked_tiles_dst += to_add_tiles_dst
                if len(marked_tiles)==len0:
                    # Happens when a nation is separated into two regions
                    new_seed = global_seed-1
                    #print("Some nations are splitted! Redo from scratch!")
                    return get_town_coords(nation_data, landmark_data, location_data, rivers_data, new_seed)
            for coords,dist in zip(marked_tiles,marked_tiles_dst):
                dist_map[nat][town][str(coords)] = dist
    
    # Trace the road
    # 1. attempt to go from center to all towns
    # 2. if collide into another road, stop
    # 3. if that town is not connected, try to go from that town to center
    
    roadgen_tries = 0
    while True:
    
        if roadgen_tries > 10 :
            new_seed = global_seed-1
            #print("Fail to generate some roads! Redo from scratch!")
            return get_town_coords(nation_data, landmark_data, location_data, rivers_data, new_seed)
            
        nat_road_list = {}
        failed_generation = False
        for nat in townnat_loc_list:

            # find the center
            xmin,ymin = rcoords(list(townnat_loc_list[nat].values())[0])
            xmax,ymax = (xmin,ymin)
            for town in townnat_loc_list[nat]:
                xi,yi = rcoords(townnat_loc_list[nat][town])
                if xi > xmax:
                    xmax = xi
                if yi > ymax:
                    ymax = yi
                if xi < xmin:
                    xmin = xi
                if yi < ymin:
                    ymin = yi

            xc = (xmax+xmin)/2
            yc = (ymax+ymin)/2

            center = list(townnat_loc_list[nat].keys())[0]
            mindist = np.sqrt((xmax-xc)**2+(ymax-yc)**2)
            for town in townnat_loc_list[nat]:
                xi,yi = rcoords(townnat_loc_list[nat][town])
                disti = np.sqrt((xi-xc)**2+(yi-yc)**2)
                if disti<mindist :
                    mindist = disti
                    center = town

            #center = list(townnat_loc_list[nat].keys())[0]
            center_loc = town_loc_dict[center]
            x0,y0 = rcoords(center_loc)

            # sort towns by how clost they are to the center
            cap_dis  = []
            town_key = []
            town_loc = []
            cap_dis_ind = []
            i=0
            for town in townnat_loc_list[nat]:
                if town==center:
                #if "*" in town:
                    continue
                town_key += [town]
                town_loc += [town_loc_dict[town]]
                cap_dis  += [dist_map[nat][town][str(center_loc)]]
                cap_dis_ind += [i]
                i+=1
            srt_ind = [x for _, x in sorted(zip(cap_dis,cap_dis_ind), reverse=True)]
            
            # sorted list
            town_key = [ town_key[i] for i in srt_ind]
            town_loc = [ town_loc[i] for i in srt_ind]
            
            # try to connect center to the towns
            to_town_road = {}
            all_road = []
            for town,loc in zip(town_key,town_loc):
                this_road = [center_loc]
                this_road_dist = [dist_map[nat][town][str(center_loc)]]
                while this_road_dist[-1]>0 :
                    this_tile = this_road[-1]
                    this_dist = this_road_dist[-1]
                    nbs = get_nb(this_tile)
                    
                    # initial samples
                    samples = ([ tile for tile in nbs if (
                                    tile in nation_tiles[nat]
                                    and
                                    dist_map[nat][town][str(tile)]<this_dist
                                    ) ]
                                    )
                    samples1 = ([ tile for tile in nbs if (
                                    tile in nation_tiles[nat]
                                    and
                                    dist_map[nat][town][str(tile)]<this_dist+1
                                    ) ]
                                    )
                    samples2 = ([ tile for tile in nbs if (
                                    tile in nation_tiles[nat]
                                    and
                                    dist_map[nat][town][str(tile)]<this_dist+2
                                    ) ]
                                    )
                    
                    #remove those from the same road
                    samples = [ tile for tile in samples if tile not in this_road ]
                    samples1 = [ tile for tile in samples1 if tile not in this_road ]
                    samples2 = [ tile for tile in samples2 if tile not in this_road ]
                    
                    # not into the mountain
                    samples = [ tile for tile in samples if tile not in mountain_tiles ]
                    samples1 = [ tile for tile in samples1 if tile not in mountain_tiles ]
                    samples2 = [ tile for tile in samples2 if tile not in mountain_tiles ]
                    
                    if len(samples)==0:
                        samples = samples1
                    
                    if len(samples1)==0:
                        samples = samples2
                        
                    if len(samples2)==0:
                        failed_generation = True
                        break
                    
                    also_existing_road = [ tile for tile in samples if tile in all_road ]
                    
                    if len(also_existing_road)>0 :
                        picked_tile = rand.choice(also_existing_road)
                    else:
                        picked_tile = rand.choice(samples)
                    picked_dist = dist_map[nat][town][str(picked_tile)]
                    
                    
                    # if stumble upon another road, erase everything before
                    if picked_tile in all_road and picked_dist>0:
                        this_road = []
                        this_road_dist = []
                    
                    this_road += [picked_tile]
                    this_road_dist += [picked_dist]
                
                if failed_generation :
                    break
                
                to_town_road[town] = this_road
                all_road += this_road
            
            if failed_generation :
                break
                
            nat_road_list[nat] = to_town_road
            
        if failed_generation :
            roadgen_tries+=1
            continue
            
        break

    # convert to physical coordinates
    nat_road_list_int = {}
    for nat in nat_road_list:
        nat_road_list_int[nat] = {}
        for twn in nat_road_list[nat]:
            nat_road_list_int[nat][twn] = nat_road_list[nat][twn].copy()
            nnodes = len(nat_road_list[nat][twn])
            for i in range(nnodes):
                nat_road_list[nat][twn][i] = rcoords(nat_road_list[nat][twn][i])
    
    # =========================================================================
    # Step 9.5 : International Roads ==========================================
    # =========================================================================
    
    interroad_pairs = []
    boundaries_full = get_boundary_full(name_list,tags_list,coords_list)
    for key in boundaries_full:
        nat1,nat2 = key[:-1].split("|")
        roads_nat1 = []
        roads_nat2 = []
        for twn in nat_road_list_int[nat1]:
            roads_nat1 += nat_road_list_int[nat1][twn]
        for twn in nat_road_list_int[nat2]:
            roads_nat2 += nat_road_list_int[nat2][twn]
        roads_nat1 = list(set(roads_nat1))
        roads_nat2 = list(set(roads_nat2))
        
        def vdist(v1,v2):
            x1,y1 = rcoords(v1)
            x2,y2 = rcoords(v2)
            return np.sqrt((x1-x2)**2 + (y1-y2)**2)
        
        if len(roads_nat1)==0 :
            for twn in townnat_loc_list[nat1]:
                roads_nat1 += [townnat_loc_list[nat1][twn]]
        if len(roads_nat2)==0 :
            for twn in townnat_loc_list[nat2]:
                roads_nat2 += [townnat_loc_list[nat2][twn]]
        
        pair_min = (roads_nat1[0],roads_nat2[0])
        dmin = vdist(*pair_min)
        for v1 in roads_nat1:
            for v2 in roads_nat2:
                dnow = vdist(v1,v2)
                if dnow < dmin:
                    dmin = dnow
                    pair_min = (v1,v2)
        interroad_pairs += [pair_min]
    interroad_pairs = list(set(interroad_pairs))
    # get sea tiles and forrest tiles
    sea_tiles = []
    sea_coast_tiles = []
    forrest_tiles = []
    for coords, tags in zip(coords_list,tags_list):
        if "sea" in tags or "island" in tags:
            sea_tiles+=[coords]
            
            # check if (2nd or 3rd) neighbours are nonsea
            nbs = [ tile for tile in get_nb(coords) if tile in coords_list]
            nbs_tags = [ tags_list[coords_list.index(tile)] for tile in nbs]
            nbs_tags = [ tags for tags in nbs_tags if tags!=['sea'] ]
            if len(nbs_tags) > 0:
                sea_coast_tiles += [coords]
        if "forrest" in tags:
            forrest_tiles+=[coords]
    
    # Get distance map
    dist_map = {}
    for pair in interroad_pairs:
        for node in pair:
            other_node = [ x for x in pair if x not in [node] ][0]
            marked_tiles = [node]
            marked_tiles_dst = [0]
            while other_node not in marked_tiles :
                current_dist = marked_tiles_dst[-1]+1
                to_add_tiles = []
                to_add_tiles_dst = []
                for mt,dist in zip(marked_tiles,marked_tiles_dst):
                    nbs = get_nb(mt)
                    for nb in nbs:
                        if nb in marked_tiles+to_add_tiles+sea_tiles:
                            continue
                        to_add_tiles += [nb]
                        to_add_tiles_dst += [current_dist]
                marked_tiles += to_add_tiles
                marked_tiles_dst += to_add_tiles_dst
            # get the dict
            if str(node) not in dist_map:
                dist_map[str(node)] = {}
            for tile,dist in zip(marked_tiles,marked_tiles_dst):
                dist_map[str(node)][str(tile)] = dist
    
    # Trace the road
    
    roadgen_tries = 0
    while True:
        
        if roadgen_tries > 10 :
            new_seed = global_seed-1
            #print("Fail to generate some international roads! Redo from scratch!")
            return get_town_coords(nation_data, landmark_data, location_data, rivers_data, new_seed)
        
        roadgen_failed = False
        internat_road_list = []
        for v1,v2 in interroad_pairs:
            this_road = [v1]
            this_road_dist = [dist_map[str(v2)][str(v1)]]
            elevation_changed = False
            while this_road_dist[-1]>0 :
                this_tile = this_road[-1]
                this_dist = this_road_dist[-1]
                nbs = get_nb(this_tile)
                
                # initial samples
                samples = ([ tile for tile in nbs if (
                                str(tile) in dist_map[str(v2)]
                                and
                                dist_map[str(v2)][str(tile)]<this_dist
                                ) ]
                                )
                samples1 = ([ tile for tile in nbs if (
                                str(tile) in dist_map[str(v2)]
                                and
                                dist_map[str(v2)][str(tile)]<this_dist+1
                                ) ]
                                )
                samples2 = ([ tile for tile in nbs if (
                                str(tile) in dist_map[str(v2)]
                                and
                                dist_map[str(v2)][str(tile)]<this_dist+2
                                ) ]
                                )
                
                #remove those from the same road
                samples = [ tile for tile in samples if tile not in this_road ]
                samples1 = [ tile for tile in samples1 if tile not in this_road ]
                samples2 = [ tile for tile in samples2 if tile not in this_road ]
                
                # no two consecutive mountains
                if this_tile in mountain_tiles:
                    samples = [ tile for tile in samples if tile not in mountain_tiles ]
                    samples1 = [ tile for tile in samples1 if tile not in mountain_tiles ]
                    samples2 = [ tile for tile in samples2 if tile not in mountain_tiles ]
                
                # change "elevation" only once
                if elevation_changed and "highland" in tags_list[coords_list.index(this_tile)]:
                    samples = [ tile for tile in samples if (
                    "highland" in tags_list[coords_list.index(tile)]) ]
                    samples1 = [ tile for tile in samples1 if (
                    "highland" in tags_list[coords_list.index(tile)]) ]
                    samples2 = [ tile for tile in samples2 if (
                    "highland" in tags_list[coords_list.index(tile)]) ]
                if elevation_changed and "highland" not in tags_list[coords_list.index(this_tile)]:
                    samples = [ tile for tile in samples if (
                    "highland" not in tags_list[coords_list.index(tile)]) ]
                    samples1 = [ tile for tile in samples1 if (
                    "highland" not in tags_list[coords_list.index(tile)]) ]
                    samples2 = [ tile for tile in samples2 if (
                    "highland" not in tags_list[coords_list.index(tile)]) ]
                
                
                if len(samples)==0:
                    samples = samples1
                
                if len(samples1)==0:
                    samples = samples2
                    
                if len(samples2)==0:
                    roadgen_failed = True
                    break
                
                picked_tile = rand.choice(samples)
                picked_dist = dist_map[str(v2)][str(picked_tile)]
                this_road += [picked_tile]
                this_road_dist += [picked_dist]
                
                # change "elevation" only once
                if (("highland" in tags_list[coords_list.index(this_tile)]
                    and "highland" not in tags_list[coords_list.index(picked_tile)])
                    or ("highland" not in tags_list[coords_list.index(this_tile)]
                    and "highland" in tags_list[coords_list.index(picked_tile)])):
                    elevation_changed = True
                
            
            if roadgen_failed :
                break
            
            internat_road_list += [this_road]
        
        if roadgen_failed :
            roadgen_tries += 1
            continue
        
        # convert to physical coords
        internat_road_list_int = []
        for i in range(len(internat_road_list)):
            internat_road_list_int += [internat_road_list[i].copy()]
            for j in range(len(internat_road_list[i])):
                internat_road_list[i][j] = rcoords(internat_road_list[i][j])
        
        break
    
    
    
    # =========================================================================
    # Step 10 : Locations =====================================================
    # =========================================================================
    
    road_tiles = []
    for nat in nat_road_list_int:
        for twn in nat_road_list_int[nat]:
            road_tiles += nat_road_list_int[nat][twn]
    for road in internat_road_list_int:
        road_tiles += road
    road_tiles = list(set(road_tiles))
    
    loc_list = []
    loc_list_int = []
    
    attempts = 0
    while True:
        loc_list = []
        loc_list_int = []
        failed_attempt = False
        for loc,tags,anti_tags in location_data:
            samples = []
            for coords1,tags1 in zip(coords_list,tags_list):
                
                # dont place anything on the road or river
                if coords1 in road_tiles+river_tiles:
                    continue
                    
                # dont use sea unless specifically specified in tags
                if "sea" not in tags and "sea" in tags1:
                    continue
                
                # dont use mountain unless specifically specified in tags
                if "mountain" not in tags and coords1 in mountain_tiles:
                    continue
                
                # don't place this on a village:
                if coords1 in village_tiles :
                    continue
                
                # pass requirement if some location tags (tags1) are in site tags (tags)
                # or site tags (tags) is empty
                req     = len([ x for x in tags1 if x in tags ])>0 or len(tags)==0 or tags==["mountain"]
                
                # fail requirement if some location tags (tags1) are in anti_tags
                antireq = len([ x for x in tags1 if x in anti_tags ])>0
                
                if "mountain" in tags:
                    req = req and coords1 in mountain_tiles
                
                if req and not antireq :
                    if (coords1 in sea_tiles and coords1 in sea_coast_tiles) or coords1 not in sea_tiles:
                        samples += [coords1]
                
            remove_samples = []
            for key in town_loc_dict.keys():
                remove_samples += [town_loc_dict[key]]
                remove_samples += get_2nb(town_loc_dict[key])
            for lc,cd in loc_list_int:
                remove_samples += get_2nb(cd)
                
            samples = [ x for x in samples if x not in remove_samples ]
            
            if len(samples)==0:
                failed_attempt = True
                attempts+=1
                break
            
            coords = rand.choice(samples)
            loc_list += [ (loc,rcoords(coords)) ]
            loc_list_int += [ (loc,coords) ]
        
        if attempts>10:
            new_seed = global_seed-1
            #print("Failed to place locations. Redo from scratch!")
            return get_town_coords(nation_data, landmark_data, location_data, rivers_data, new_seed)
            
        if failed_attempt :
            continue
        
        break
    
    # =========================================================================
    # Step 11 : Sublocations ==================================================
    # =========================================================================
    
    # location marks
    location_list = [ [] for _ in name_list ]
    
    for coords in mountain_tiles:
        ind = coords_list.index(coords)
        location_list[ind] += ["mountain"]
        
    for coords in river_tiles:
        ind = coords_list.index(coords)
        location_list[ind] += ["river"]
        
    for coords in road_tiles:
        ind = coords_list.index(coords)
        location_list[ind] += ["road"]
        
    for loc, coords in loc_list_int:
        ind = coords_list.index(coords)
        location_list[ind] += ["loc"]
    
    for coords in town_tiles:
        ind = coords_list.index(coords)
        location_list[ind] += ["town"]
    
    location_list = [ list(set(x)) for x in location_list ]
                    
    # =========================================================================
    # Step xx : Plot data =====================================================
    # =========================================================================
    
    # Obtain the plot data ------------------------------
    plotdata = get_plotdata(
                    name_list,
                    tags_list,
                    coords_list,
                    boundaries,
                    town_loc_dict,
                    separate_by="none")
    plotdata_nat = get_plotdata(
                    name_list,
                    tags_list,
                    coords_list,
                    boundaries,
                    town_loc_dict,
                    separate_by="nation")
    plotdata_twn = get_plotdata(
                    name_list,
                    tags_list,
                    coords_list,
                    boundaries,
                    town_loc_dict,
                    separate_by="town")
    mapdata = ( name_list,\
                tags_list,\
                coords_list,\
                loc_list,\
                village_loc_list,\
                rcoords_list,\
                rivers,\
                nat_road_list,\
                internat_road_list)
    #print("Map generation finished")
    return (mapdata, plotdata, plotdata_nat, plotdata_twn), seed0

def rcoords(icoords):
    # convert int coordinates into real coordinates
    i,j = icoords
    x = d*np.cos(np.pi/3)*j+d*i
    y = d*np.sin(np.pi/3)*j
    return x,y

def icoords(rcoords):
    x,y = rcoords
    j = snap(y/(d*np.sin(np.pi/3)))
    i = snap((x-d*np.cos(np.pi/3)*j)/d)
    return i,j

def snap(x):
    ret = int(np.rint(x))
    if np.abs(ret-x)>1e-10:
        #print("The coordinates cannot be snapped to integer!")
        exit()
    return ret

def key_to_coords(key):
    tmp = key.replace("(","").replace(")","").replace(" ","")
    coords = tuple([ int(x) for x in tmp.split(",") ])
    return coords

# the computation
def generate_coords(town_list):
    
    failed = True
    while failed:
        # initial node for this nation
        ini_node = (0,0)
        coords_all = []
        coords_dict = {}
        
        ination = -1
        for nation in town_list :
            ination += 1
        
            towns = town_list[nation]
            
            tags = nation.split("|")[1].split(",")
            
            # initial node
            if len(coords_all)==0 :
                coords = [ini_node]
            else:
                # find the boundaries
                boundaries = []
                for i,j in coords_all:
                    neighbours = [ (i+1,j), (i,j+1), (i-1,j+1), (i-1,j), (i,j-1), (i+1,j-1) ]
                    is_boundary = False
                    for v in neighbours:
                        if v not in coords_all:
                            is_boundary = True
                            break
                    if is_boundary :
                        boundaries += [(i,j)]
                # identify the north/south/east/west nodes
                north_node = boundaries[0]
                south_node = boundaries[0]
                east_node = boundaries[0]
                west_node = boundaries[0]
                for i,j in boundaries:
                    x = d*np.cos(np.pi/3)*j+d*i
                    y = d*np.sin(np.pi/3)*j
                    yn = d*np.sin(np.pi/3)*north_node[1]
                    ys = d*np.sin(np.pi/3)*south_node[1]
                    xe = d*np.cos(np.pi/3)*east_node[1]+d*east_node[0]
                    xw = d*np.cos(np.pi/3)*west_node[1]+d*west_node[0]
                    if y>yn:
                        north_node = (i,j)
                    if y<ys:
                        south_node = (i,j)
                    if x>xe:
                        east_node = (i,j)
                    if x<xw:
                        west_node = (i,j)
                
                # customize the engine here <----------------------------------------------------------
                if "ice" in tags or "highland" in tags:
                    ib,jb = north_node
                elif "desert" in tags:
                    ib,jb = south_node
                else:
                    ib,jb = rand.choice(boundaries)

                # pick one of its unused neighbour
                neighbour = [(ib+1,jb),(ib,jb+1),(ib-1,jb+1),(ib-1,jb),(ib,jb-1),(ib+1,jb-1)]
                neighbour = [ v for v in neighbour if v not in (coords_all) ]
                if len(neighbour)==0 :
                    break
                neighbour = rand.choice(neighbour)
                coords = [neighbour]
            
            skip_first = True
            reroll = False
            if len(towns)>0:
                for town in towns :
                    if skip_first :
                        coords += [coords[0]]
                        coords_dict[town] = coords[0]
                        skip_first = False
                    else:
                        #randomize the seeding node
                        i,j = rand.choice(coords)
                        i0=i
                        j0=j
                        #neighbour node to add
                        neighbour = [ (i+1,j), (i,j+1), (i-1,j+1), (i-1,j), (i,j-1), (i+1,j-1) ]
                        neighbour = [ v for v in neighbour if v not in (coords+coords_all) ]
                        if len(neighbour)==0 :
                            reroll = True
                            break
                        i,j = rand.choice(neighbour)
                        
                        #add node
                        coords += [(i,j)]
                        coords_dict[town] = (i,j)
            else:
                town = nation.split("|")[0]
                if skip_first :
                    coords += [coords[0]]
                    coords_dict[town] = coords[0]
                    skip_first = False
                else:
                    #randomize the seeding node
                    i,j = rand.choice(coords)
                    
                    #neighbour node to add
                    neighbour = [ (i+1,j), (i,j+1), (i-1,j+1), (i-1,j), (i,j-1), (i+1,j-1) ]
                    neighbour = [ v for v in neighbour if v not in (coords+coords_all) ]
                    if len(neighbour)==0 :
                        reroll = True
                        break
                    i,j = rand.choice(neighbour)
                    
                    #add node
                    coords += [(i,j)]
                    coords_dict[town] = (i,j)
            
            if reroll:
                reroll = True
                break

            coords_all += coords
            
        failed = reroll
    
    coords_list = []
    for key in coords_dict.keys():
        coords_list += [coords_dict[key]]

    return coords_list

def subdivide(name_list,tags_list,coords_list,shifts=[1,-1,1,1]):

    # subdivide the tile into smaller grids
    name_list2 = []
    tags_list2 = []
    coords_list2 = []
    for name_,tags,coords in zip(name_list,tags_list,coords_list):

        i,j = coords
        coords0 = (2*i,2*j)
        coords1 = (2*i+shifts[0],2*j)
        coords2 = (2*i,2*j+shifts[1])
        coords3 = (2*i+shifts[2],2*j+shifts[3])

        if "island" not in tags:
            name_list2+=[name_]*4
            tags_list2+=[tags]*4
            coords_list2+=[coords0,coords1,coords2,coords3]
        else:
            nkeep = rand.choice([1,2])
            nsea = rand.choice([ i+1 for i in range(3-nkeep) ])

            # Tiles marked as "sea" cannot be filled with lands
            name_list2+=[name_]*nkeep+[""]*nsea
            tags_list2+=[tags]*nkeep+[["sea"]]*nsea

            coords_list2+=rand.shuffle([coords0,coords1,coords2,coords3])[:(nkeep+nsea)]

    # Inverse corrosion ----------------------------
    # identify the boundaries (sea)
    sea_tiles_name = []
    sea_tiles_tags = []
    sea_tiles_coords = []
    for index,coords in enumerate(coords_list2):
        i,j = coords
        tile_name = name_list2[index]
        tile_tags = tags_list2[index]
        neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        to_add = [ v for v in neighbours if v not in (sea_tiles_coords+coords_list2) ]
        existed = [ v for v in neighbours if v in coords_list2 ]

        # if it is neighbouring to an island, skip
        skip_this = False
        for tile in existed:
            test_index = coords_list2.index(tile)
            if "island" in tags_list2[test_index]:
                skip_this = True
                break
        if skip_this :
            continue

        if "island" not in tile_tags:
            sea_tiles_coords += to_add
            sea_tiles_name += [tile_name]*len(to_add)
            sea_tiles_tags += [tile_tags]*len(to_add)
    # now, randomly fill in the boundaries
    for name_,tags,coords in zip(sea_tiles_name,sea_tiles_tags,sea_tiles_coords):
        if rand.choice([True,True,False]):
            name_list2+=[name_]
            tags_list2+=[tags]
            coords_list2+=[coords]

    
    # Fill the inlet states ------------------------------
    for index,coords in enumerate(coords_list2):
        i,j = coords
        tile_name = name_list2[index]
        neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        nb_names = [ name_list2[coords_list2.index(v)] for v in neighbours if v in coords_list2 ]
        if tile_name not in nb_names:

            if len(nb_names) > 0:
                # change this tile into the majority of the neighbour
                nb_name_count = [ nb_names.count(nb_name) for nb_name in nb_names ]
                candidate_name = nb_names[nb_name_count.index(max(nb_name_count))]
                candidate_index = name_list2.index(candidate_name)
                candidate_tags = tags_list2[candidate_index]
                name_list2[index] = candidate_name
                tags_list2[index] = candidate_tags
            else:
                name_list2[index] = ""
                tags_list2[index] = ["sea"]
    

    # Fill the in-land sea ----------------------------
    sea_tiles_name = []
    sea_tiles_tags = []
    sea_tiles_coords = []
    for index,coords in enumerate(coords_list2):
        i,j = coords
        tile_name = name_list2[index]
        tile_tags = tags_list2[index]
        neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        to_add = [ v for v in neighbours if v not in (sea_tiles_coords+coords_list2) ]
        if "island" not in tile_tags:
            sea_tiles_coords += to_add
            sea_tiles_name += [tile_name]*len(to_add)
            sea_tiles_tags += [tile_tags]*len(to_add)
    for name_,tags,coords in zip(sea_tiles_name,sea_tiles_tags,sea_tiles_coords):
        i,j = coords
        neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        land_count = 0
        name_temp = []
        tags_temp = []
        for neighbours_coords in neighbours:
            if neighbours_coords in coords_list2:
                test_index = coords_list2.index(neighbours_coords)
                name_temp += [name_list2[test_index]]
                tags_temp += [tags_list2[test_index]]
                land_count +=1
        if land_count==6 :
            chosen = rand.choice([0,1,2,3,4,5])
            name_list2 += [name_temp[chosen]]
            tags_list2 += [tags_temp[chosen]]
            coords_list2 += [coords]
    
    # Fill the inlet states ------------------------------
    for index,coords in enumerate(coords_list2):
        i,j = coords
        tile_name = name_list2[index]
        neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        nb_names = [ name_list2[coords_list2.index(v)] for v in neighbours if v in coords_list2 ]
        if tile_name not in nb_names:

            if len(nb_names) > 0:
                # change this tile into the majority of the neighbour
                nb_name_count = [ nb_names.count(nb_name) for nb_name in nb_names ]
                candidate_name = nb_names[nb_name_count.index(max(nb_name_count))]
                candidate_index = name_list2.index(candidate_name)
                candidate_tags = tags_list2[candidate_index]
                name_list2[index] = candidate_name
                tags_list2[index] = candidate_tags
            else:
                name_list2[index] = ""
                tags_list2[index] = ["sea"]
    


    # smearing 1
    for it in range(3):
        name_list3 = []
        tags_list3 = []
        coords_list3 = []
        for index in range(len(name_list2)):
            name_ = name_list2[index]
            tags = tags_list2[index]
            i,j = coords_list2[index]

            if "sea" in tags:
                name_list3 += [name_]
                tags_list3 += [tags]
                coords_list3 += [(i,j)]
                continue
            if "island" in tags:
                name_list3 += [name_]
                tags_list3 += [tags]
                coords_list3 += [(i,j)]
                continue

            neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
            neighbours = [ v for v in neighbours if v in coords_list2 ]
            name_temp = []
            tags_temp = []
            for neighbours_coords in neighbours:
                if neighbours_coords in coords_list2:
                    test_index = coords_list2.index(neighbours_coords)
                    name_temp += [name_list2[test_index]]
                    tags_temp += [tags_list2[test_index]]
            name_temp += [name_]*4
            tags_temp += [tags]*4

            # randomly pick from the neighbour
            chosen = rand.choice([i for i in range(len(name_temp))])
            chosen = rand.choice([get_majority_index(name_temp)]*(it+3)*2+[-1]*(it+2)+[chosen])
            name_list3 += [name_temp[chosen]]
            tags_list3 += [tags_temp[chosen]]
            coords_list3 += [(i,j)]
        name_list2 = name_list3
        tags_list2 = tags_list3
        coords_list2 = coords_list3
    
    # Fill the inlet states ------------------------------
    for index,coords in enumerate(coords_list2):
        i,j = coords
        tile_name = name_list2[index]
        neighbours = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        nb_names = [ name_list2[coords_list2.index(v)] for v in neighbours if v in coords_list2 ]
        if tile_name not in nb_names:

            if len(nb_names) > 0:
                # change this tile into the majority of the neighbour
                nb_name_count = [ nb_names.count(nb_name) for nb_name in nb_names ]
                candidate_name = nb_names[nb_name_count.index(max(nb_name_count))]
                candidate_index = name_list2.index(candidate_name)
                candidate_tags = tags_list2[candidate_index]
                name_list2[index] = candidate_name
                tags_list2[index] = candidate_tags
            else:
                name_list2[index] = ""
                tags_list2[index] = ["sea"]
    
    return name_list2,tags_list2,coords_list2

# remove dirty tiles (will fill in later)
def remove_sea_tiles(name_list,tags_list,coords_list):
    name_list2 = []
    tags_list2 = []
    coords_list2 = []
    for name_,tags,coords in zip(name_list,tags_list,coords_list):
        if "sea" in tags:
            continue
        else:
            name_list2+=[name_]
            tags_list2+=[tags]
            coords_list2+=[coords]

    return name_list2,tags_list2,coords_list2

def fill_sea_tiles(name_list,tags_list,coords_list):
    
    # identify aspect dimensions of the map first
    eb,nb = coords_list[0]
    wb,sb = coords_list[0]
    for i,j in coords_list:
        if j>nb :
            nb = j
        if j<sb :
            sb = j
        if i+ihalf(j)>eb :
            eb = i+ihalf(j)
        if i+ihalf(j)<wb :
            wb = i+ihalf(j)

    border_size = 3
    border_offset_y = (nb-sb+1)%2
    border_offset_x = (eb-wb)%2
    nb+=border_size+border_offset_y
    sb-=border_size
    eb+=border_size-border_offset_x
    wb-=border_size

    name_list_sea = []
    tags_list_sea = []
    coords_list_sea = []

    for i in range(wb,eb+1):
        for j in range(sb,nb+1):
            coords = (i-ihalf(j),j)
            if coords not in coords_list:
                name_list_sea+=[""]
                tags_list_sea+=[["sea"]]
                coords_list_sea+=[coords]

    return name_list+name_list_sea, tags_list+tags_list_sea, coords_list+coords_list_sea

    pass

def get_boundary(name_list,tags_list,coords_list):
    
    boundaries = {}
    for coords,name_,tags_ in zip(coords_list,name_list,tags_list):
        i,j = coords
        nation_ = get_nation(name_)
        nb_all = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        nb_indices = [ coords_list.index(v) for v in nb_all if v in coords_list ]
        for nb_index in nb_indices:
            nb_name = name_list[nb_index]
            nb_nation = get_nation(nb_name)
            nb_tags = tags_list[nb_index]
            if nb_nation== nation_:
                continue
            
            # mute this line if you want to include boundaries with nonnations
            if "<nonnation>" in nation_+nb_nation:
                continue
                
            # mute this line if you want to detect the sea as well
            if "" in [nation_,nb_nation]:
                continue
                
            # mute this line if you want to detect the island as well
            if "island" in tags_ or "island" in nb_tags :
                continue
            
            # mute this line if you want to add boundary between biomes
            if "".join(sorted(tags_)) != "".join(sorted(nb_tags)):
                continue
                
                
            choices = rand.shuffle([coords,coords_list[nb_index]])
            
                
            # get dictionary key
            if txt_lessthan(nation_,nb_nation):
                key = nation_+"|"+nb_nation
                item = choices[0]
                other_item = choices[1]
                if nation_=="":
                    item = coords_list[nb_index]
                    other_item = coords
            else:
                key = nb_nation+"|"+nation_
                item = choices[1]
                other_item = choices[0]
                if nb_nation=="":
                    item = coords
                    other_item = coords_list[nb_index]
            
            if key in boundaries.keys():
                boundaries[key] += [(item,other_item)]
            else:
                boundaries[key] = [(item,other_item)]

    # boundaries[key] is a list of 2 coordinates
    
    # remove duplicates
    for key in boundaries:
        new_bdl = []
        for vv in boundaries[key]:
            vv2 = (vv[1],vv[0])
            if (vv not in new_bdl) and (vv2 not in new_bdl):
                new_bdl+=[vv]
        boundaries[key] = new_bdl
        
    # Sort the boundaries
    boundaries = bd_sort(boundaries)
    
    # for each key, merge all coords into the same list
    bd_merged = {}
    for key in boundaries.keys():
        bd_merged[key] = []
        for v1,v2 in boundaries[key]:
            bd_merged[key] += [v1,v2]
    
    bd_final = {}
    for key in boundaries.keys():
        bd_final[key] = []
        for v1,v2 in boundaries[key]:
            n1 = bd_merged[key].count(v1)
            n2 = bd_merged[key].count(v2)
            if n1>n2 :
                if v1 not in bd_final[key]:
                    bd_final[key] += [v1]
            else:
                if v2 not in bd_final[key]:
                    bd_final[key] += [v2]
    
    
    mt_symb = ["Λ"]
    rv_symb = ["~"]
    for key in bd_final.keys():
        symb_list = rand.choice([mt_symb,mt_symb])
        temp = bd_final[key]
        temp = [ (x,y,symb_list[rand.randrange(len(symb_list))]) for x,y in temp ]
        bd_final[key] = temp
    
    return bd_final

def get_boundary_full(name_list,tags_list,coords_list):
    
    boundaries = {}
    for coords,name_,tags_ in zip(coords_list,name_list,tags_list):
        i,j = coords
        nation_ = get_nation(name_)
        nb_all = [ (i+1,j),(i,j+1),(i+1,j-1),(i-1,j),(i,j-1),(i-1,j+1) ]
        nb_indices = [ coords_list.index(v) for v in nb_all if v in coords_list ]
        for nb_index in nb_indices:
            nb_name = name_list[nb_index]
            nb_nation = get_nation(nb_name)
            nb_tags = tags_list[nb_index]
            if nb_nation== nation_:
                continue
            
            # mute this line if you want to include boundaries with nonnations
            if "<nonnation>" in nation_+nb_nation:
                continue
                
            # mute this line if you want to detect the sea as well
            if "" in [nation_,nb_nation]:
                continue
                
            # mute this line if you want to detect the island as well
            if "island" in tags_ or "island" in nb_tags :
                continue
            
            # mute this line if you want to add boundary between biomes
            #if "".join(sorted(tags_)) != "".join(sorted(nb_tags)):
            #    continue
                
                
            choices = rand.shuffle([coords,coords_list[nb_index]])
            
                
            # get dictionary key
            if txt_lessthan(nation_,nb_nation):
                key = nation_+"|"+nb_nation
                item = choices[0]
                other_item = choices[1]
                if nation_=="":
                    item = coords_list[nb_index]
                    other_item = coords
            else:
                key = nb_nation+"|"+nation_
                item = choices[1]
                other_item = choices[0]
                if nb_nation=="":
                    item = coords
                    other_item = coords_list[nb_index]
            
            if key in boundaries.keys():
                boundaries[key] += [(item,other_item)]
            else:
                boundaries[key] = [(item,other_item)]

    # boundaries[key] is a list of 2 coordinates
    
    # remove duplicates
    for key in boundaries:
        new_bdl = []
        for vv in boundaries[key]:
            vv2 = (vv[1],vv[0])
            if (vv not in new_bdl) and (vv2 not in new_bdl):
                new_bdl+=[vv]
        boundaries[key] = new_bdl
        
    # Sort the boundaries
    boundaries = bd_sort(boundaries)
    
    # for each key, merge all coords into the same list
    bd_merged = {}
    for key in boundaries.keys():
        bd_merged[key] = []
        for v1,v2 in boundaries[key]:
            bd_merged[key] += [v1,v2]
    
    bd_final = {}
    for key in boundaries.keys():
        bd_final[key] = []
        for v1,v2 in boundaries[key]:
            n1 = bd_merged[key].count(v1)
            n2 = bd_merged[key].count(v2)
            if n1>n2 :
                if v1 not in bd_final[key]:
                    bd_final[key] += [v1]
            else:
                if v2 not in bd_final[key]:
                    bd_final[key] += [v2]
    
    
    mt_symb = ["Λ"]
    rv_symb = ["~"]
    for key in bd_final.keys():
        symb_list = rand.choice([mt_symb,mt_symb])
        temp = bd_final[key]
        temp = [ (x,y,symb_list[rand.randrange(len(symb_list))]) for x,y in temp ]
        bd_final[key] = temp
    
    return bd_final

def bd_sort(boundaries):
    ret = {}
    for key in boundaries:
        subret = bdl_sort(boundaries[key],key)
        for subkey in subret:
            ret[subkey] = subret[subkey]
    return ret

def bdl_sort(bdl,key):
    
    def bdvec(vv):
        v1,v2 = vv
        r1 = np.array(rcoords(v1))
        r2 = np.array(rcoords(v2))
        return (r1+r2)/2
    
    def is_nb(vv1,vv2):
        r1 = bdvec(vv1)
        r2 = bdvec(vv2)
        dist = np.linalg.norm(r1-r2)/(d/2)
        return dist<1.1
        
    retl = []
    while True:
        # get the chain in this loop
        did_sorted = sum(retl,[])
        not_sorted = [ vv for vv in bdl if vv not in did_sorted ]
        
        if len(not_sorted)==0:
            break
        
        chain = [not_sorted[0]]
        
        while True:
            # This loop add the element to the chain untill it is impossible
            not_sorted = [ vv for vv in bdl if vv not in did_sorted+chain ]
            n1 = len(chain)
            for vv in not_sorted :
                vva = chain[0]
                vvb = chain[-1]
                if is_nb(vv,vva):
                    chain = [vv] + chain
                elif is_nb(vv,vvb):
                    chain = chain + [vv]
            n2 = len(chain)
            if n1==n2:
                break
        retl += [chain]
    
    ret = {}
    for i in range(len(retl)):
        ret[key+""+str(i)] = retl[i]
    
    return ret

def get_town_loc(name_list,tags_list,coords_list,boundaries):
    
    bd_coords = []
    for key in boundaries.keys():
        bd_coords += [(x,y) for x,y,s in boundaries[key]]
    
    town_loc_dict_all = {}
    for name_,coords in zip(name_list,coords_list):
        if name_ == "":
            continue
        if name_ in town_loc_dict_all.keys():
            town_loc_dict_all[name_] += [coords]
        else:
            town_loc_dict_all[name_] = [coords]
    
    # now get the town location
    town_loc_dict = {}
    town_nb = []
    for key in town_loc_dict_all.keys():
        all_elem = town_loc_dict_all[key]
        cnd_elem = [ v for v in all_elem if v not in bd_coords ]
        # condition that this is not a neighbour of existing towns
        cnd_elem = [ v for v in cnd_elem if v not in town_nb ]
        if len(cnd_elem)>0:
            town_loc_dict[key] = rand.choice(cnd_elem)
        else:
            town_loc_dict[key] = rand.choice(all_elem)
        
        town_nb += get_2nb(town_loc_dict[key])
    
    return town_loc_dict

def get_nb(v):
    i,j = v
    return [ (i,j+1),(i+1,j),(i+1,j-1),(i,j-1),(i-1,j),(i-1,j+1) ]

def get_2nb(v):
    nbs = get_nb(v)
    ret = get_nb(v)
    for nb in nbs:
        temp = get_nb(nb)
        ret += [ v for v in temp if v not in ret ]
    return ret

def get_3nb(v):
    nbs = get_2nb(v)
    ret = get_2nb(v)
    for nb in nbs:
        temp = get_nb(nb)
        ret += [ v for v in temp if v not in ret ]
    return ret

def get_4nb(v):
    nbs = get_3nb(v)
    ret = get_3nb(v)
    for nb in nbs:
        temp = get_nb(nb)
        ret += [ v for v in temp if v not in ret ]
    return ret
    
def get_nation(name_):
    if len(name_.split("|"))>1:
        return name_.split("|")[1]
    else:
        return name_+"<nonnation>"

def txt_lessthan(name1a,name2a):
    name1b,name2b = sorted([name1a,name2a])
    if name1a==name1b and name2a==name2b:
        return True
    else:
        return False

def get_majority_index(a_list):
    count = [ a_list.count(a) for a in a_list ]
    return count.index(max(count))

# Edit this function to customize the map engine
def sort_tiles(town_list):
    key_list = rand.shuffle(list(town_list.keys()))
    ret = {}
    
    # separate special keys from the rest
    boundary_keys = []
    north_keys = []
    south_keys = []
    east_keys = []
    west_keys = []
    bnorth_keys = []
    bsouth_keys = []
    beast_keys = []
    bwest_keys = []
    for key in key_list:
        tags = key.split("|")[1].split(",")
        
        # higher priorities are placed higher
        if "island" in tags:
            if "ice" in tags:
                bnorth_keys+=[key]
            elif "desert" in tags:
                bsouth_keys+=[key]
            else:
                boundary_keys+=[key]
        elif "ice" in tags:
            north_keys+=[key]
        elif "highland" in tags:
            north_keys+=[key]
        elif "desert" in tags:
            south_keys+=[key]
        else:
            ret[key] = town_list[key]
    
    # higher priorities are placed higher
    other_keys = []
    other_keys += bnorth_keys
    other_keys += bsouth_keys
    other_keys += beast_keys
    other_keys += bwest_keys
    other_keys += boundary_keys
    other_keys += north_keys
    other_keys += south_keys
    other_keys += east_keys
    other_keys += west_keys

    for key in other_keys[::-1]:
        ret[key] = town_list[key]
    
    return ret

# Convert the raw data to an easily accessible dictionary
def get_town_list():
    nation_data = namegen.global_nation_data
    town_list = {}
    for language in nation_data :
        for nation in nation_data[language]:
            key = nation[1]+"|"+",".join(nation[3])
            town_list[key] = []
            for town in nation[2]:
                town_list[key] += [town+"|"+nation[1]+"|"+nation[0]+"|"]
    return town_list

def append_grid(town_list,grid_name,tags=[]):
    town_list[grid_name+"|"+",".join(tags)] = []

# :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
#  Below here has nothing to do with the data
# :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
# These are for plots in python
color_map = {}
color_map2 = {}
color_base_boundary = "white"
color_misc = []
water_color = "xkcd:robin egg blue"

def set_color():
    global color_map,color_map2,color_misc

    color_map["base"] = "limegreen"
    color_map["sea"] = water_color
    color_map["highland"] = "palegreen"
    color_map["desert"] = "moccasin"
    color_map["volcanic"] = "dimgrey"
    color_map["ice"] = "white"
    color_map["forrest"] = "forestgreen"

    color_map2["base"] = color_map["base"]
    color_map2["ice"] = color_map["ice"]
    color_map2["desert"] = color_map["desert"]
    color_map2["volcanic"] = "tomato"
    color_map2["forrest"] = color_map["forrest"]

    color_misc = [
        "lightcoral",
        "lightsalmon",
        "peachpuff",
        "wheat",
        "goldenrod",
        "gold",
        "khaki",
        "yellowgreen",
        "chartreuse",
        "palegreen",
        "springgreen",
        "aquamarine",
        "cornflowerblue",
        "mediumpurple",
        "thistle",
        "plum",
        "violet",
        "pink",
        "tab:blue",
        "tab:orange",
        "tab:purple",
        "tab:pink",
        "tab:olive",
        "tab:cyan"
    ]

def get_plotdata(name_list,
                    tags_list,
                    coords_list,
                    boundaries,
                    town_loc_dict,
                    separate_by="nation",
                    d=0.8):

    # generate the followings:
    #x_list, y_list, (colors_all,colorsb_all,colors2_all,colors2b_all)

    set_color()

    # List the coords
    x_list = []
    y_list = []
    for i,j in coords_list:
        x_list += [d*np.cos(np.pi/3)*j+d*i]
        y_list += [d*np.sin(np.pi/3)*j]
    
    nation_list = []
    for t in name_list :
        if len(t.split("|"))>1:
            nation_list += [t.split("|")[1]]
        else:
            nation_list += [t]
    if separate_by in ["town","nation"]:
        if separate_by=="town":
            unique_names = np.sort(list(set(name_list)))
        elif separate_by=="nation":
            unique_names = np.sort(list(set(nation_list)))
        
        if len(unique_names)<len(color_misc):
            all_colors = rand.shuffle(color_misc)[:len(unique_names)]
        else:
            all_colors = rand.shuffle(mcolors.CSS4_COLORS)[:len(unique_names)]
        
        # Use mcolors.CSS4_COLORS if something goes awry

        name_color = {}
        for index in range(len(unique_names)):
            name_color[unique_names[index]] = all_colors[index]
    
    # List the colors
    c1_list = [] # bg
    c2_list = [] # inner
    b1_list = [] # bg boundary
    b2_list = [] # inner boundary
    for index,tags in enumerate(tags_list):

        color = color_map["base"]
        bndry = color_base_boundary
        if "sea" in tags :
            color = color_map["sea"]
            bndry = color
        elif "island" in tags :
            color = color_map["sea"]
            bndry = color
        elif "highland" in tags :
            color = color_map["highland"]
        elif "ice" in tags :
            color = color_map["ice"]
        elif "desert" in tags :
            color = color_map["desert"]
        elif "forest" in tags :
            color = color_map["forest"]
        elif "volcanic" in tags :
            color = color_map["volcanic"]
        elif "forrest" in tags :
            color = color_map["forrest"]
        
        if ("sea" not in tags
                and "island" not in tags
                and "volcanic" not in tags
                and "forrest" not in tags) :
            if separate_by=="town":
                color = name_color[name_list[index]]
            elif separate_by=="nation":
                color = name_color[nation_list[index]]
        
        c1_list += [color]
        b1_list += [bndry]

        color2 = color
        bndry2 = color
        if "volcanic" in tags :
            color2 = color_map2["volcanic"]
            bndry2 = color_base_boundary
        elif "forrest" in tags :
            color2 = color_map2["forrest"]
            bndry2 = color_base_boundary
        elif "island" in tags :
            if "ice" in tags:
                color2 = color_map2["ice"]
            elif "desert" in tags:
                color2 = color_map2["desert"]
            else:
                color2 = color_map2["base"]
            bndry2 = color_base_boundary
        c2_list += [color2]
        b2_list += [bndry2]
    
    bd_rcoords = {}
    for key in boundaries:
        bd_rcoords[key] = []
        for x,y,t in boundaries[key]:
            bd_rcoords[key] += [ (*rcoords((x,y)),t) ]
            
    tloc = {}
    for key in town_loc_dict:
        tloc[key] = rcoords(town_loc_dict[key])
    
    return x_list,y_list,name_list,(c1_list,b1_list,c2_list,b2_list),bd_rcoords,tloc

def ihalf(x):
    if x>0:
        return int(x*0.5)
    else:
        return -int(-(x-1)*0.5)