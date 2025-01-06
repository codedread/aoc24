/** Represents a 2D point/vector. */
class Point {
  constructor(public x: number, public y: number) {}
  /** Returns the sum of this and another point. */
  addition(o: Point): Point { return new Point(this.x + o.x, this.y + o.y); }
  /** Returns the vector to get from this point to another. */
  difference(o: Point): Point { return new Point(o.x - this.x, o.y - this.y); }
  equals(o: Point): boolean { return this.x === o.x && this.y === o.y; }
  inverse(): Point { return new Point(-this.x, -this.y); }
  toString(): string { return `(${this.x},${this.y})`; }
}

enum Orientation {
  N = '^',
  E = '>',
  S = 'v',
  W = '<',
}

function flip(o: Orientation): Orientation {
  switch (o) {
    case Orientation.N: return Orientation.S;
    case Orientation.E: return Orientation.W;
    case Orientation.S: return Orientation.N;
    case Orientation.W: return Orientation.E;
  }
  throw `Bad orientation: ${o}`;
}

function o2vec(o: Orientation): Point {
  switch (o) {
    case Orientation.N: return new Point(0, -1);
    case Orientation.E: return new Point(1, 0);
    case Orientation.S: return new Point(0, 1);
    case Orientation.W: return new Point(-1, 0);
  }
  throw `Another bad orientation: ${o}`;
}

/**
 * Need a quick way to search in a given direction for the first empty space,
 * hard-stopping when you hit the first wall.
 * If any empty space was found, shift boxes and robot one space to fill in the
 * empty space.
 */

enum SpaceContents {
  EMPTY = '.',
  WALL = '#',
  BOX = 'O',
  ROBOT = '@',
}

class Grid {
  readonly W: number;
  readonly H: number;

  commands: Orientation[] = [];
  robot: Point = new Point(-1, -1);
  spaces: SpaceContents[][] = [];

  constructor(lines: string[]) {
    this.W = lines[0].length;

    while (lines.length > 0) {
      const line = lines.shift()!;
      // Grid section ends with the first empty row.
      if (line.length === 0) break;
      const row: SpaceContents[] = [];
      for (let i = 0; i < line.length; ++i) {
        row.push(line[i] as SpaceContents);
        if (line[i] === SpaceContents.ROBOT) {
          this.robot = new Point(i, this.spaces.length);
        }
      }
      this.spaces.push(row);
    }
    this.H = this.spaces.length;

    for (const line of lines) {
      for (let i = 0; i < line.length; ++i) {
        this.commands.push(line[i] as Orientation);
      }
    }
  }

  /** dir is the direction the robot is trying to move/push. */
  doRobotPush(dir: Orientation) {
    let curPos = this.robot;
    const vec = o2vec(dir);
    const nvec = o2vec(flip(dir));

    // Find the first empty spot going in that direction from the robot or if we
    // hit a wall.
    let firstEmptySpace: Point|undefined;
    while (!firstEmptySpace) {
      curPos = curPos.addition(vec);
      const contents = this.getSpace(curPos);
      if (contents === SpaceContents.WALL) {
        // If we hit a wall, nothing needs to happen, we just return early.
        return;
      } else if (contents === SpaceContents.EMPTY) {
        firstEmptySpace = curPos;
        break;
      }
    }

    // The only way to get here is to have hit an empty space.
    // Now we shift contents into the empty space until we are back at the robot.
    while (!curPos.equals(this.robot)) {
      const nextPos = curPos.addition(nvec);
      this.setSpace(curPos, this.getSpace(nextPos));
      this.setSpace(nextPos, SpaceContents.EMPTY);
      curPos = nextPos;
    }
    this.robot = this.robot.addition(vec);
  }

  getSumGpsCoordinates(): number {
    let sum = 0;
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        if (this.spaces[y][x] !== SpaceContents.BOX) continue;
        sum += (y * 100) + x;
      }
    }
    return sum;
  }

  getSpace(p: Point): SpaceContents { return this.spaces[p.y][p.x]; }
  setSpace(p: Point, c: SpaceContents) { this.spaces[p.y][p.x] = c; }

  visualize() {
    for (let y = 0; y < this.H; ++y) {
      let row = '';
      for (let x = 0; x < this.W; ++x) {
        row += this.spaces[y][x];
      }
      console.log(row);
    }
    console.log('');
  }
}

async function main1(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const grid = new Grid(lines);
  // grid.visualize();

  for (const cmd of grid.commands) {
    // console.log(`Doing a ${cmd} push`);
    grid.doRobotPush(cmd);
    // grid.visualize();
  }
  console.log(`Final grid is:`);
  grid.visualize();
  console.log(`Sum of all GPS coordinates is ${grid.getSumGpsCoordinates()}`);
}

main1('./15/input.txt');
