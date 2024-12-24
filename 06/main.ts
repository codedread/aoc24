interface Point {
  x: number;
  y: number;
}
type Vec = Point;

function ptEquals(p1: Point, p2: Point): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

function ptToString(p: Point): string {
  return `(${p.x}, ${p.y})`;
}

enum Facing {
  N = 1, E, S, W
}

/** Returns a vector representing the facing. */
function getFacingVec(f: Facing): Vec {
  switch (f) {
    case Facing.N: return {x:0, y:-1};
    case Facing.E: return {x:1, y:0};
    case Facing.S: return {x:0, y:1};
    case Facing.W: return {x:-1, y:0};
  }
  throw `Bad facing: ${f}`;
}

/** Returns the facing after rotating clockwise/counterclockwise. */
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

/** A point plus a facing. */
interface Pose extends Point {
  facing: Facing;
}

function poseEquals(p1: Pose, p2: Pose): boolean {
  return ptEquals(p1, p2) && p1.facing === p2.facing;
}

function poseToString(p: Pose): string {
  return `(${ptToString(p)}, f:${p.facing}`;
}

class Guard {
  private pose: Pose = {x: 0, y:0, facing: Facing.N };

  constructor() {}

  getFacing(): Facing { return this.pose.facing; }
  setFacing(f: Facing) {
    this.pose.facing = f;
  }

  getPose(): Pose { return { ...this.pose }; }
  setPos(p: Point) {
    this.pose.x = p.x;
    this.pose.y = p.y;
  }
  setPose(pose: Pose) { this.pose = { ...pose }; }

  turn(clockwise: boolean) {
    const nextFacing = rotateFacing(this.getFacing(), clockwise);
    this.pose.facing = nextFacing;
  }
}

enum Terrain {
  EMPTY = '.',
  OBSTACLE = '#',
}

/**
 * Represents a space on the map, which includes its coordinate on the map, the
 * type of terrain of the space, and a record of each time the guard was on the
 * space along with her facing.
 */
class Space {
  private guardVisited: Set<Facing> = new Set();

  constructor(public pt: Point = {x: 0, y: 0},
              public terrain: Terrain = Terrain.EMPTY) {}

  /** Returns true if the guard has ever been on this space. */
  hasVisited(): boolean { return this.guardVisited.size > 0; }

  /**
   * Returns true if the guard has been on this space before with the given
   * facing.
   */
  hasVisitedWithFacing(f: Facing): boolean {
    return this.guardVisited.has(f);
  }

  /**
   * Resets this space to its initial state. Wiping out the record of guard
   * visits.
   */
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
   * Moves guard one space ahead. Normally this is one space ahead in its
   * facing, but if it would hit an obstacle, turn clockwise and continue to try
   * and move until the guard can be advanced one space.
   * Returns true if the guard is still on the map, false if exited.
   */
  advanceGuard(): Space|undefined {
    let guardSpace = this.getSpace(this.guard.getPose());
    const origGuardSpace = guardSpace;
    while (guardSpace) {
      const maybeNextPos = this.getNextGuardPos();
    
      guardSpace = this.getSpace(maybeNextPos);
      // We hit an obstacle, so turn and repeat while loop.
      if (guardSpace && guardSpace.terrain === Terrain.OBSTACLE) {
        this.guard.turn(true);
        guardSpace = origGuardSpace;
      } else {
        this.guard.setPos(maybeNextPos);
        // If we are still on the map, we have advanced a space so return.
        if (guardSpace) {
          guardSpace.visit(this.guard.getFacing());
          return guardSpace;
        }
      }
    }
    // Else, we left the map, so return.
    return guardSpace;
  }

  /**
   * Returns the next space the guard should advance to, purely based on her
   * facing. Note that this Point may be off the map.
   */
  getNextGuardPos(): Point {
    const moveVec = getFacingVec(this.guard.getFacing());
    return {
      x: this.guard.getPose().x + moveVec.x,
      y: this.guard.getPose().y + moveVec.y,
    };
  }

  /** Returns the # of unique spaces the guard has visited. */
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

  /** Returns the space at p, or undefined if that coordinate is off the map. */
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
    this.guard.setPose( {...this.startingPt!, facing: Facing.N} );
  }

  /**
   * Sets the guard starting point on the map. This should only be called once.
   */
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
    const gp = this.guard.getPose();
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        if (gp.x === x && gp.y === y) {
          s += this.guard.getFacing();
        } else {
          const space = this.getSpace({x,y});
          if (space) {
            s += space.terrain;
          }
        }
      }
      s += '\n';
    }
    s += `Guard pose: ${poseToString(this.guard.getPose())}`;
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
        const sp = map.getSpace({x, y})!;
        sp.pt = {x, y};
        switch (ch) {
          case Terrain.EMPTY:
          case Terrain.OBSTACLE: 
            sp.terrain = ch;
            break;
          default: {
            if (ch === '^') {
              map.setStartingPoint({x, y});
              map.guard.setPos({x, y});
              const s = map.getSpace(map.guard.getPose());
              if (s) {
                s.visit(map.guard.getFacing());
              }
              map.guard.setFacing(Facing.N);
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

  while (map.advanceGuard());
  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
}

async function main2() {
  const map = await readMap('./06/input_test_1.txt');

  const initialPath: Pose[] = [];
  let space: Space|undefined;
  do {
    space = map.advanceGuard();
    if (space) {
      initialPath.push({...space.pt, facing:map.guard.getFacing()})
    }
  } while (space);

  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
  console.log(map.toString());
  console.log(`Initial path is ${initialPath.length} poses long.`);
  map.reset();
  console.log(map.toString());
}

main2();
