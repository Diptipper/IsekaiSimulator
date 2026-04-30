window.blogPosts = window.blogPosts || [];

window.blogPosts.push({
    title: "Iteration 3: the String",
    date: "April 30, 2026",
    content: `
# Iteration 3: the String
Following up from the previous lightbulb moment, I started implementing the new terrain generation using the string-based algorithm (my own thing). Starting with creating my own random number generator.
> [April 19, 2024] A bit sick of my work today so I played around with some sine functions and came up with a nice-looking 'simulated random walk' function. It's pretty neat that the function is analytic.
> Might be useful for map generation. I don't know. Have to compare it with Perlin noise later.
> ![ ](images/blog4a.png)
> [April 22, 2024] Hmm.. cooked up some function that generates a landmass around a specific coordinate. Did not expect it to work this well. And it's also very fast.
> The reason I abandoned Perlin noise was because I cannot control the shape of the map in that case. Let's see where this goes.
> ![ ](images/blog4b.png)
> [April 23, 2024] This is pretty nice. I cooked up an algorithm to generate a random-looking path between two points. What's neat is the path is actually not random, but is governed by a few parameters.
> Can be used to generate roads and rivers.
> I think I can generate a real fantasy map very soon.
> ![ ](images/blog4c.png)
> [April 25, 2024] The first prototype of the map generator. There are only roads and blobs of land. Next, I'll integrate this into the previous code that generates city names.
> ![Add blobs where the cities are (and in between). Then connect everything with the stringy roads.](images/blog4d.png)
> [April 26, 2024] Holy heck. This is starting to look cool.
> I just implemented the map-making module into the world-building module. The road-building algorithm still needs some improvements. But overall this fantasy world generator looks very promising.
> ![ ](images/blog4e.png)
> [April 30, 2024] The improved version of the landmass generation algorithm. Looks like real islands to me.
> ![Forgot the exact details, but it involved adding negative blobs to simulate erosions.](images/blog4f.png)
> [May 2, 2024] Spent the past few hours trying to procedurally place mountain ranges in a way that
> 1) they don't intersect each other
> 2) they don't go into the sea
> 3) they don't go through a kingdom
> ![ ](images/blog4g.png)

In the next few days I tried porting this into Godot and was hit with the realization that this algorithm is very expensive with the amount of blobs I need to calculate.
> [May 10, 2024] Ported 90% of the Python code into Godot.
> I had to simplify the island shape for performance.
> The towns are actually placed already but are invisible for now.
> I'll do mountains later since I might need to tweak the algo.
> Also, a chunk-loading system is implemented.

> [May 12, 2024] I spent half a day trying to place a mountain range by directly modifying the height map just to realize how bad that idea is.
> (tl;dr, sharp mountain = very fine grid = high cost)
> So it's better to place the models instead.
> This is a lot harder than I expected...
> !video[ ](images/blog4h.mp4)
> [May 13, 2024] Tweaked chunk-loading algorithm a bit so it's significantly faster to load (especially in the sea area).
> Now it's possible to add mountains as a terrain if the map is sufficiently large.
> Finally, I can play around with biomes, rivers, and roads.
> !video[ ](images/blog4i.mp4)

Two breakthroughs here. First, I tried adding humidity based on the [rain shadow effect](https://en.wikipedia.org/wiki/Rain_shadow). This is done by creating [dipole fields](https://en.wikipedia.org/wiki/Dipole) using the mountain range information (my idea). The dipole fields are then treated as the humidity map. With this, one side of the mountain range will be dried (creating a desert), while the other side is humid (creating a rain forest).

Another breakthrough was I figured out how to sneak the temperature/humidity data into the shader script. It's a little hacky but it worked.
> [May 16, 2024] So I implemented humidity to the map. My plan was to build biomes around things like humidity and temperature. However, Godot's shader script won't let me pass extra information other than vertex geometries. So I had no idea how to paint the desert on the map.
> But then I realized that I could sneak humidity into the vertex height. For example, if I want to pass vertex.y = 1.xxxx and humidity=0.yyyy into the script, I just have to "pack" the two numbers into 1.xxxyyyy and "unpack" it in the shader script.
> Man, I'm so smart.
> !video[ ](images/blog4j.mp4)
> [May 20, 2024] Added a bunch of biomes.
> Probably will need to tweak the biome conditions later because most of the map becomes savanna at this moment.
> !video[Chunk loading was currently in one thread. It's horrid.](images/blog4k.mp4)
> [May 26, 2024] More biome tweaks. The current system includes a rain shadow effect, and I can specify the biomes and elevation for each city freely.
> Here are some nice (?) views I took during the test.
> ![ ](images/blog4l1.png)
> ![ ](images/blog4l2.png)
> ![ ](images/blog4l3.png)
> ![ ](images/blog4l4.png)

I next had some idea of specifying 'zones' to the topographical features. It's such a good idea that I ended up rewriting everything again from scratch a few months later.
> [May 29, 2024] Implemented 'zones' into the map and also give a unique name to each area.
> Imagine NPC telling the player to kill a dragon in the xxx forest instead of placing an unnamed marker on the map. Sounds very immersive to me.
> !video[ ](images/blog4m.mp4)
`
});