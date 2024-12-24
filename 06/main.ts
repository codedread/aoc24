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
  /** The set of all facings the guard has been pointed on this space. */
  private readonly guardVisited: Set<Facing> = new Set();
  /** The initial terrain set at construction time. */
  private readonly initialTerrain: Terrain; 

  constructor(private readonly pt: Point = {x: 0, y: 0},
              private terrain: Terrain) {
    this.initialTerrain = terrain;
  }

  getPt(): Point { return this.pt; }
  getTerrain(): Terrain { return this.terrain; }
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
   * visits and resetting its terrain to the initial terrain.
   */
  reset() {
    this.guardVisited.clear();
    this.terrain = this.initialTerrain;
  }

  setTemporaryTerrain(nt: Terrain) {
    this.terrain = nt;
  }

  toString(): string {
    if (this.initialTerrain !== this.terrain) return 'O';
    else if (this.initialTerrain === Terrain.OBSTACLE) return '#';
    return '.';
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
  readonly W: number;
  readonly H: number;

  constructor(lines: string[]) {
    this.H = lines.length;
    this.W = lines[0].length;
    for (let y = 0; y < this.H; ++y) {
      const line = lines[y];
      if (line?.length) {
        const newRow: Space[] = [];
        // Parse each line and create a bunch of cells...
        for (let x = 0; x < this.W; ++x) {
          const ch = line[x];
          switch (ch) {
            case Terrain.EMPTY:
            case Terrain.OBSTACLE: 
              newRow.push(new Space({x, y}, ch));
              break;
            default:
              if (ch === '^') {
                const newSpace = new Space({x, y}, Terrain.EMPTY);
                if (this.startingPt) throw `Already had a starting point!`;
                this.startingPt = {x, y};
                this.guard.setPose({x, y, facing: Facing.N});
                newSpace.visit(this.guard.getFacing());
                newRow.push(newSpace);
              } else {
                throw `Bad map terrain = ${ch}`;
              }
              break;
          }
        }
        this.spaces.push(newRow);
      }
    }
  }

  /**
   * Moves guard one space ahead. Normally this is one space ahead in its
   * facing, but if it would hit an obstacle, turn clockwise and continue to try
   * and move until the guard can be advanced one space. The next space is *not*
   * visited. The caller must do this (to mark the square as visited).
   * Returns either the Space the guard is now on, or undefined if the guard has
   * left the map.
   */
  advanceGuard(): Space|undefined {
    let guardSpace = this.getSpace(this.guard.getPose());
    const origGuardSpace = guardSpace;
    while (guardSpace) {
      const maybeNextPos = this.getNextGuardPos();
    
      guardSpace = this.getSpace(maybeNextPos);
      // We hit an obstacle, so turn and repeat while loop.
      if (guardSpace && guardSpace.getTerrain() === Terrain.OBSTACLE) {
        this.guard.turn(true);
        guardSpace = origGuardSpace;
      } else {
        this.guard.setPos(maybeNextPos);
        // If we are still on the map, we have advanced a space so return it.
        if (guardSpace) {
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

  toString(showGuardAtStart: boolean = false): string {
    let s = '';
    const gp = showGuardAtStart ? this.startingPt : this.guard.getPose();
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        if (gp.x === x && gp.y === y) {
          s += showGuardAtStart ? '^' : this.guard.getFacing();
        } else {
          const space = this.getSpace({x,y});
          if (space) {
            s += space.toString();
          }
        }
      }
      s += '\n';
    }
    //s += `Guard pose at: ${poseToString(this.guard.getPose())}`;
    return s;
  }
}

async function readMap(filename: string): Promise<LabMap> {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const H = lines.length, W = lines[0].length;
  console.log(`# rows = ${H}, # cols = ${W}`);
  const map = new LabMap(lines);
  return map;
}

async function main1() {
  const map = await readMap('./06/input.txt');
  let nextSpace: Space|undefined;
  do {
    nextSpace = map.advanceGuard();
    if (nextSpace) {
      nextSpace.visit(map.guard.getFacing());
    }
  } while (nextSpace);
  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
}

async function main2() {
  const map = await readMap('./06/input.txt');

  const initialPath: Pose[] = [];
  let space: Space|undefined;
  do {
    space = map.advanceGuard();
    if (space) {
      space.visit(map.guard.getFacing());
      initialPath.push({...space.getPt(), facing:map.guard.getFacing()})
    }
  } while (space);
  console.log(`Guard visited ${map.getNumVisited()} unique spaces`);
  // console.log(map.toString());
  console.log(`Initial path is ${initialPath.length} poses long.`);

  // Idea is to go through the entire original path and check if we put an
  // obstacle in front of the guard, do they eventually get into a loop.
  const loopers: Space[] = [];
  const nonLoopers: Space[] = [];
  for (const pose of initialPath) {
    // We cannot put an obstacle on the guard's starting position.
    if (ptEquals(pose, map.startingPt!)) continue;

    // If we already tried an obstacle at this point, and we left the map
    // then skip it.
    if (nonLoopers.find(s => ptEquals(s.getPt(), pose))) continue;
    if (loopers.find(s => ptEquals(s.getPt(), pose))) continue;

    // console.log(`Walking to pose ${poseToString(pose)}`);
    // Reset the map (all its spaces and the guard).
    map.reset();

    const obstacleSpace = map.getSpace(pose);
    if (!obstacleSpace) { throw `Bad space! at ${poseToString(pose)}`; }
    obstacleSpace.setTemporaryTerrain(Terrain.OBSTACLE);

    // Keep advancing until we either exit the map or find ourselves back on a
    // Space facing the same direction (aka we hit a loop).
    let nextSpace: Space|undefined;
    do {
      nextSpace = map.advanceGuard();
      if (nextSpace) {
        // Check if we were here before in this facing, that means we looped.
        // Record the looper space and exit the loop to try the next pose.
        if (nextSpace.hasVisitedWithFacing(map.guard.getFacing())) {
          loopers.push(obstacleSpace);
          break;
        }
        // Else just visit the square, we haven't been at thise pose before,
        // keep stepping.
        nextSpace.visit(map.guard.getFacing());
      }
      // Else, stop the do-while loop, we left the map.
      else {
        nonLoopers.push(obstacleSpace);
      }
    } while (nextSpace); // Walk from start until we exit the map or loop.
  } // For each pose in the initial path.
  console.log(`# of looper spaces are: ${loopers.length}`);
}

main2();
