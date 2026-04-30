window.blogPosts = window.blogPosts || [];

window.blogPosts.push({
    title: "Iteration 1: the Tree",
    date: "April 30, 2026",
    content: `
# Iteration 1: the Tree
It started on 14 Dec 2023 (my holiday leave), where I played around with the idea of growing a [tree graph](https://en.wikipedia.org/wiki/Tree_(graph_theory)) and use this for rivers and mountains. All of the codes in this phase are done in python. Here are the direct quotations from my tweets.
> [Dec 15, 2023] I made a code to generate a tree that randomly branches out dynamically. This might be useful for building a mountain range or a river system. Will implement a way to prevent the branches from intersecting later.
> ![ ](images/blog1a.png)
> [Dec 16, 2023] Figured out how to efficiently obtain the terrain from the tree I generated yesterday. The river seems to be a lot more complicated, tho. Also, i did that on the plane and now i'm finally home. Tadaima!
> ![ ](images/blog1b.png)
> [Dec 17, 2023] Implemented a simple river system where the stream flows due to gravity. I also add an artificial "force field" that prevents the river from crossing each other. Look good enough, so I didn't implement erosion and stuff.
> ![ ](images/blog1e.png)
> [Dec 19, 2023] Successfully made some islands but it's so cumbersome to make. Might scrap the whole idea and just use the Perlin map instead for simplicity.
> ![ ](images/blog1f.png)

Sure enough, I decided to scrap the idea and switched to testing the perlin noise instead.
`
});