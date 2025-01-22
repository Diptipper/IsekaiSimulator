[back to main](https://github.com/Diptipper/IsekaiSimulator/blob/main/readme.md)

# World generation

## Data
The world is described by a hexagonal grid. Each tile is addressed by a pair of integers $(i,j)$ where this can be transformed to the tile coordinate $(x,z)$ with
```math
  \begin{eqnarray}
  x&=d\cdot\cos(\pi/3)\cdot j+d\cdot i,\\
  z&=d\cdot\sin(\pi/3)\cdot j.
  \end{eqnarray}
```
The inverse transformation is
```math
  \begin{eqnarray}
  j&=\frac{z}{d\cdot\sin(\pi/3)},\\
  i&=\frac{x}{d}-\cos(\pi/3)\cdot j.
  \end{eqnarray}
```
Each tile contains several metadata such as the nation/nonnation it belongs, the biome, and other features (river, mountain, city).

From here, when I say world generation, I mean the generation of a set of land or sea tiles and their metadata.
Below is the description of the worldgen algorithm.

## Algorithm
### Input

- seed: random seed
- nation_data: a list of tuples `(<language>,<#town>,<tags>)`
- nonnation_data: a list of tuples `(<name>,<tags>)`
- shift_vector: a 4-dimensional vector used in tile subdivision

[back to main](https://github.com/Diptipper/IsekaiSimulator/blob/main/readme.md)
