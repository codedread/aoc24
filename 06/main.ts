interface Point {
  x: number;
  y: number;
}
type Vec = Point;

enum Facing {
  N = 1, E, S, W
}

function rotateFacing(facing: Facing, clockwise: boolean): Facing {
  if (clockwise) {
    if (facing === Facing.W) {
      facing = Facing.N;
    } else {
      facing += 1;
    }
  } else {
    if (facing === Facing.N) {
      facing = Facing.W;
    } else {
      facing -= 1;
    }
  }
  return facing;
}


class Guard {
  facing: Facing = Facing.N;
  private pt: Point = {x:0, y:0};

  constructor() {}

  getPos(): Point { return {...this.pt}; }
  setPos(p: Point) {
    this.pt = {...p};
  }

  turn(clockwise: boolean) {
    this.facing = rotateFacing(this.facing, clockwise);
  }
}

enum Terrain {
  EMPTY = '.',
  OBSTACLE = '#',
}

class Space {
  constructor(public pt: Point = {x: 0, y: 0},
              public terrain: Terrain = Terrain.EMPTY,
              public guardVisited: boolean = false) {}
}

function getFacingVec(f: Facing): Vec {
  switch (f) {
    case Facing.N: return {x:0, y:-1};
    case Facing.E: return {x:1, y:0};
    case Facing.S: return {x:0, y:1};
    case Facing.W: return {x:-1, y:0};
  }
  throw `Bad facing: ${f}`;
}

function ptToString(p: Point): string {
  return `(${p.x}, ${p.y})`;
}

class LabMap {
  guard: Guard = new Guard();
  spaces: Space[][] = [];
  constructor(public W: number, public H: number) {
    // Initialize empty map.
    for (let y = 0; y < H; ++y) {
      const newRow: Space[] = [];
      this.spaces.push(newRow);
      for (let x = 0; x < W; ++x) {
        newRow.push(new Space());
      }
      newRow
    }
  }

  /**
   * Moves guard one space ahead in its facing. If it would hit an obstacle,
   * turn clockwise and try again until the guard can be advanced.
   * Returns true if the guard is still on the map.
   */
  advanceGuard(): boolean {
    let guardSpace = this.getSpace(this.guard.getPos());
    while (guardSpace) {
      const origGuardSpace = guardSpace;
      const moveVec = getFacingVec(this.guard.facing);
      const gNextPos = {
        x: this.guard.getPos().x + moveVec.x,
        y: this.guard.getPos().y + moveVec.y,
      };
    
      guardSpace = this.getSpace(gNextPos);
      if (guardSpace && guardSpace.terrain === Terrain.OBSTACLE) {
        this.guard.turn(true);
        guardSpace = origGuardSpace;
      } else {
        this.guard.setPos(gNextPos);
        if (guardSpace) {
          guardSpace.guardVisited = true;
        }
      }
    }
    return !!guardSpace;
  }

  getNumVisited(): number {
    let total = 0;
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        const s = this.getSpace({x,y});
        if (s && s.guardVisited) {
          total++;
        }
      }
    }
    return total;
  }

  getSpace(p: Point): Space|undefined {
    if (p.x < 0 || p.x >= this.W || p.y < 0 || p.y >= this.H) {
      return undefined;
    }
    return this.spaces[p.y][p.x];
  }

  setTerrain(p: Point, terrain: Terrain) {
    if (p.x < 0 || p.x >= this.W || p.y < 0 || p.y >= this.H) {
      throw `Bad coord: ${ptToString(p)}`;
    }
    const space = this.spaces[p.y][p.x];
    if (!space) throw `Bad space: ${ptToString(p)}`;
    space.terrain = terrain;
  }

  toString(): string {
    let s = '';
    const gp = this.guard.getPos();
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        if (gp.x === x && gp.y === y) {
          s += this.guard.facing;
        } else {
          const space = this.getSpace({x,y});
          if (space) {
            s += space.terrain;
          }
        }
      }
      s += '\n';
    }
    return s;
  }
}

async function readMap(filename: string): Promise<LabMap> {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const H = lines.length, W = lines[0].length;
  console.log(`# rows = ${H}, # cols = ${W}`);
  const map = new LabMap(W, H);
  for (let y = 0; y < H; ++y) {
    const line = lines[y];
    if (line?.length) {
      // Parse each line and create a bunch of cells...
      for (let x = 0; x < W; ++x) {
        const ch = line[x];
        switch (ch) {
          case Terrain.EMPTY:
          case Terrain.OBSTACLE:
            map.setTerrain({x, y}, ch);
            break;
          default: {
            if (ch === '^') {
              map.guard.setPos({x, y});
              const s = map.getSpace(map.guard.getPos());
              if (s) {
                s.guardVisited = true;
              }
              map.guard.facing = Facing.N;
            } else {
              throw `Bad map terrain = ${ch}`;
            }
          }
        }
      }
    }
  }
  return map;
}

async function main1() {
  console.log('Hell world');
  const map = await readMap('./06/input.txt');

  while(map.advanceGuard());
  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
}

main1();
