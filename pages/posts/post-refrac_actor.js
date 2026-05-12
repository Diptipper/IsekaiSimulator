window.blogPosts = window.blogPosts || [];

window.blogPosts.push({
    title: "Reworking on NPCs",
    date: "May 9, 2026",
    content: `
# Reworking on NPCs
The previous nodes for Player/NPC were very messy because there were a lot of code duplications and the role separation was not very clear. There was an Actor node which contains basic physics. Then there was the Player node (inheriting Actor) which handles input, character morphology, and hit-scan stuff. NPC (also inheriting Actor) has some script duplication from Player, with some parts removed. Because some codes are mixed, it's difficult to modify Player and NPC together.

In the new version, Player and NPC still inherit Actor (all extending CharacterBody3D). The race-specific are now contained in a separate node (e.g., Humanoid), extending Node3D, which is to be instantiated by the Actor on ready. The race node automatically reparents the collision shape to the Actor. In this version, the NPC script only contains the AI package.

I also added the dialogue system, which are stored as a JSON object. I experimented with this system in my other text-based RPG game, so the implementation is quite easy. I also plan to implement the interaction registry system after, which has already been figured out almost throughoutly in my text-based game.
> [May 9, 2026] Reworked the Actor/Player/NPC nodes. The scripts are now super clean. I also added the dialogue system with options to zoom in the camera to specific body parts (important).
> The dialogue data is stored as a JSON object.
> !video[ ](images/blog8a.mp4)

> [May 12, 2026] One last game dev update for a while. I tried implementing the navmesh, which is easier than I expected.
> After finishing my book, I want to do a full NPC pathing (like walking between building/cities).
> !video[ ](images/blog8b.mp4)

`
});