window.blogPosts = window.blogPosts || [];

window.blogPosts.push({
    title: "Iteration 5: the current algorithm",
    date: "April 30, 2026",
    content: `
# Iteration 5: the current algorithm
I started migrating the world generation script into godot and added some UI. Now the generation algorithm is shown in it's full glory. Why do I do this? Firstly it's cool to animate the processes in the game. And secondly, precompiling the script into an executable is dangerous more ways than one, so I wanted to avoid that.
> [Feb 21, 2025] My game dev project stagnates again due to technical reasons. I decided to migrate the Python code into Godot, which might take a while to finish. On the upside, I can now animate the worldgen which looks pretty neat.
> !video[ ](images/blog6a.mp4)

After that, [this](https://x.com/ui_shig/status/1901252359554011616) happened (best thing ever), I got a new position in Kyoto (worst thing ever in hindsight), and I started my study series (which shot me from 20k to 80k followers).
![ ](images/blog6b.png)
Anyway, I was busy. A few months later, I tried using [multimesh](https://docs.godotengine.org/en/stable/classes/class_multimesh.html) to draw trees and grass. Also, chunks are now square once again, this is so that I can adjust the chunk size independently from the tile scaling.
> [May 20, 2025] stress-testing yet another chunk loading system.
> so many tree. so many grass.
> ![ ](images/blog6c.png)

Across the following months, I experimented with the character models, the animation, jiggle physics, and bone-scaling.
> [Jun 2, 2025] Learned about animation queueing today.
> It starts to look like an actual game now.
> !video[ ](images/blog6d.mp4)
> [Jun 21, 2025] Now I learned how to do jiggle physics + blend shape (change booba size in game).
> !video[ ](images/blog6e.mp4)

Character creation menu and bethesda physics are implemented. You can now also grab NPC's jiggling body parts.
> [Aug 20, 2025] implemented skyrim physics to my game
> !video[ ](images/blog6f.mp4)
> [Aug 20, 2025] Continuing from yesterday--I implemented item grabbing. It's so fucking difficult to not messed up the physics. Anyway, the final goal is to implement boob and butt grabbing. I think that would be very interesting.
> !video[ ](images/blog6g.mp4)
> [Aug 23, 2025] You can now grab body parts and drag them around and annoy the heck out of the NPC.
> I'm so cooked.
> !video[ ](images/blog6h.mp4)

I learned a better way to pass the biome information into the shader script without precision hacking. I can pass the three most prominent biomes (enumerated) into the color and UV2 channels (color.rgb = the three weights, color.a,UV2.x,UV3.y = enums of the 3 weights.)
> [Sep 15, 2025] Finally figuring out how to blend biome textures in a proper way without some weird hacks.
> Doing things procedurally is so tough but it makes me feel like a god creating a world.
> ![ ](images/blog6i.png)

Came up with a nice-looking function for mountains. I also played around with the atmostphere and lighting.
> [Mar 25, 2026] New mountain, generated with a purely deterministic math function. Much more majestic than ever.
> ![ ](images/blog6j.png)

`
});