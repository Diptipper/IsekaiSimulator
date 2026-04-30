window.blogPosts = window.blogPosts || [];

window.blogPosts.push({
    title: "Name generation",
    date: "April 30, 2026",
    content: `
# Name generation
A few months after the experiments with the tree and the noise, I wanted to redo everything with my own procedural generation algorithm. The new idea starts with generating a list of contents to be populated on the continent.
> [Mar 1, 2024] Suddenly have a bunch of ideas about my openworld rpg flooding in while trying to sleep. Maybe i need to redesign the whole thing again carefully.

> [Mar 2, 2024] The idea is to procedurally generate the textual data of the cities then create the map around it.
> Turns out I have to seriously study toponymy, history, and politics for the worldbuilding…

> [Mar 4, 2024] I wrote a working prototype code in Python for my "worldbuilding generator".
> Here are some examples of what it can generate.
> You can edit the pool of names by region. Say, you want to have elven cities, you just make a new folder containing elvish-sounding names.
> The same goes for legendary artifacts and player backgrounds.
> I plan to add interesting things like landmarks, religions, and various types of radiant quests.
> The map will be generated based on all of these data.
> ![Prototype of the namegen written in Python.](images/blog3a.png)
> [Mar 6, 2024] Still waiting for my physics code to finish, so I continue my worldbuilding code.
> Now I introduced a way to systematically add landmarks to various towns. (Note that the town with the church is named after some saint I generated.)
> Next, I should add small bits of history to the world (for example; this town has a hero statute, this great ruin is a fallen city taken over by some necromancer, etc.)
> This is so fun.
> ![ ](images/blog3b.png)
`
});