window.blogPosts = window.blogPosts || [];

window.blogPosts.push({
    title: "Iteration 2: the Noise",
    date: "April 30, 2026",
    content: `
# Iteration 2: the Noise
Quickly after trying out the tree idea,
I realized that the result is not very nice relatively to the cost.
So I tried the standard [Perlin noise](https://en.wikipedia.org/wiki/Perlin_noise) method instead.
This method is used in many games to create a convincing world topography.
This is why I considered this as the next natural step.
> [Dec 20, 2023] Man. I should have used Perlin map from the beginning. It's not gonna be an island but who cares. And I think I can use the river system I developed earlier here too.
> ![ ](images/blog2a.png)
> !video[Yooooooooooo!](images/blog2b.mp4)

This marked the first ever implementation in godot (courtesy to a nice [tutorial by codat](https://www.youtube.com/watch?v=rWeQ30h25Yg)). I spent the next few days tweaking the ideas as an excuse to learn how to godot.
> [Dec 21, 2023] Third person control in a two-dimensional toroidal world. Pretty basic stuff but I learn a lot about Godot engine while fiddling with the parameters.
> !video[ ](images/blog2c.mp4)
> [Dec 21, 2023] Update:
> - Water now has a nicer texture and is animated
> - Added some textures to the terrain
> - Added more noise to the terrain (more bumpy)
> - The player character now rotates properly
> !video[ ](images/blog2d.mp4)
> [Dec 22, 2023] Bru I did something pretty crazy.
> So I made this world periodic and there are a bunch of randomly generated trees. I want every tree to be unique (if it's cut and I circumnavigate the map, it will also be cut in the next 'sector'). And I finally made it work.
> !video[ ](images/blog2e.mp4)
> !video[Why is this so adorable...](images/blog2f.mp4)
> [Dec 25, 2023] It's been a while. This time i only did the behind the scene things like implementing the health systems to the mob (not shown here) and did some preparation for the skybox. Not sure if the skybox will work as intended since the viewport system is kinda finicky.
> !video[ ](images/blog2g.mp4)
I didn't know what I was doing. Probably trying to save some rendering resource by using viewports. But that ended up not being used; another case of premature optimization.

After that I tried implementing a turn based combat system like runescape. But this also ended up not being used.
> [Dec 26, 2023] I implemented the most basic form of combat:
> press Q to autolock the nearest sapling (blue sphere = target; also, player orientation is locked on the target)
> press E to attack (notice the knockback & healthbar)
> !video[ ](images/blog2h.mp4)
> [Dec 27, 2023] This is so troublesome.
> Basically I made a new node to handle the combat AI separately so that all combat actions are in queue (like a turn base game) instead of real time.
> Real time combat requires a lot of attention, or it will turn out janky and exploitable like Skyrim.
> !video[ ](images/blog2i.mp4)
> [Dec 28, 2023] I think i have made a pretty nice template for all land creatures (they now have basic functionalities). The next step is to add the inventory to each of them. Then I can start doing more crazy stuff like pickpocket and combat classes (melee/range/magic/healing).
> !video[ ](images/blog2j.mp4)

Next, I tried to implement the [LOD system](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) on the terrain. Honestly, it's pretty suck, but I kept using this system for years and changed to Godot's native LOD wayyyy later. I also played around with the UI, which ended up being scrapped anyway.
> [Jan 1, 2024] HNY 2024!!!!!
> Let me post the first update of my isekai simulator project of the year. So I spent the last couple days of 2023 fine-tuning the combat AIs. But I think the biggest progress is the introduction of terrain LODs (chunks loaded further away have lower details).
> !video[ ](images/blog2k.mp4)
> [Jan 3, 2024] I said I wanted to work on the inventory... ended up working on the combat ui instead (the combat now display the hp and damage). Also implemented a cute range attack animation lol.
> !video[ ](images/blog2l.mp4)
> [Jan 3, 2024] I'm still on vacation until this weekend so please don't mind me posting frequent updates.
> Here, I made the UI for choosing the action on the target. For now only "attack" and "follow" work. But I plan to add dialogue and pickpocket next.
> Look nice, isn't it?
> !video[ ](images/blog2m.mp4)

Next I finally came back to the river generation which failed spetecularly. This was probably the point where I started considering a more ambitious terrain generation algorithm that's not a pure perlin noise.
> [Jan 4, 2024] **failed idea**
> I tried generating the river with naive Perlin noise. Very ugly. The slope is so unnatural. Need some condition so that the river flows from high to low elevation... Or I might have to go back to use graph-based generation again. Let's do that some other time.
> !video[ ](images/blog2n.mp4)
`
});