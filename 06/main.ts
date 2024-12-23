interface Point {
  x: number;
  y: number;
}
type Vec = Point;

function ptToString(p: Point): string {
  return `(${p.x}, ${p.y})`;
}

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
  private guardVisited: Set<Facing> = new Set();

  constructor(public pt: Point = {x: 0, y: 0},
              public terrain: Terrain = Terrain.EMPTY) {}

  hasVisited(): boolean {
    return this.guardVisited.size > 0;
  }

  reset() {
    this.guardVisited.clear();
  }

  /**
   * Visits by the guard while facing in the given direction. Returns true if
   * they have been on this space before facing the same way.
   */
  visit(f: Facing): boolean {
    const isLooping = this.guardVisited.has(f);
    this.guardVisited.add(f);
    return isLooping;
  }
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

class LabMap {
  guard: Guard = new Guard();
  spaces: Space[][] = [];
  startingPt: Point|undefined;

  constructor(public W: number, public H: number) {
    // Initialize empty map.
    for (let y = 0; y < H; ++y) {
      const newRow: Space[] = [];
      this.spaces.push(newRow);
      for (let x = 0; x < W; ++x) {
        newRow.push(new Space());
      }
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
          guardSpace.visit(this.guard.facing);
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
        if (s && s.hasVisited()) {
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

  /** Resets the map and the guard to the starting point. */
  reset() {
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        const space = this.getSpace({x,y});
        space?.reset();
      }
    }
    this.guard.facing = Facing.N;
    this.guard.setPos(this.startingPt!);
  }

  setStartingPoint(p: Point) {
    if (this.startingPt) throw `Already configured a starting point!`;
    this.startingPt = {...p};
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
    s += `Guard at ${ptToString(this.guard.getPos())}`;
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
              map.setStartingPoint({x, y});
              map.guard.setPos({x, y});
              const s = map.getSpace(map.guard.getPos());
              if (s) {
                s.visit(map.guard.facing);
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
  const map = await readMap('./06/input.txt');

  while(map.advanceGuard());
  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
}

async function main2() {
  const map = await readMap('./06/input_test_1.txt');
  while(map.advanceGuard());
  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
  console.log(map.toString());
  map.reset();
  console.log(map.toString());
}

main2();
