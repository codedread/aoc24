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

enum SpaceContents {
  EMPTY = '.',
  WALL = '#',
  BOX = 'O',
  ROBOT = '@',
  BOX_LEFT = '[',
  BOX_RIGHT = ']',
}

interface BoxPushNode {
  boxPos: Point;
  dir: Orientation;
  children: BoxPushNode[];
  parent?: BoxPushNode;
}

class Grid {
  readonly W: number;
  readonly H: number;

  commands: Orientation[] = [];
  robot: Point = new Point(-1, -1);
  spaces: SpaceContents[][] = [];

  constructor(lines: string[], wide: boolean = false) {
    this.W = wide ? lines[0].length * 2 : lines[0].length;

    while (lines.length > 0) {
      const line = lines.shift()!;
      // Grid section ends with the first empty row.
      if (line.length === 0) break;
      const row: SpaceContents[] = [];
      for (let i = 0; i < line.length; ++i) {
        if (!wide) {
          row.push(line[i] as SpaceContents);
          if (line[i] === SpaceContents.ROBOT) {
            this.robot = new Point(i, this.spaces.length);
          }
        } else {
          switch (line[i] as SpaceContents) {
            case SpaceContents.EMPTY:
              row.push(SpaceContents.EMPTY, SpaceContents.EMPTY);
              break;
            case SpaceContents.WALL:
              row.push(SpaceContents.WALL, SpaceContents.WALL);
              break;
            case SpaceContents.BOX:
              row.push(SpaceContents.BOX_LEFT, SpaceContents.BOX_RIGHT);
              break;
            case SpaceContents.ROBOT:
              row.push(SpaceContents.ROBOT, SpaceContents.EMPTY);
              this.robot = new Point(i * 2, this.spaces.length);
              break;
            default: throw `Bad contents: ${line[i]}`;
          }
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

  /** dir is the direction the robot is trying to move/push. */
  doRobotPushWide(dir: Orientation) {
    const curPos = this.robot;
    const newPos = curPos.addition(o2vec(dir));
    // Evaluate the robot's move immediately. If new spot is empty or a wall,
    // resolve immediately.
    switch (this.getSpace(newPos)) {
      case SpaceContents.WALL: return;
      case SpaceContents.EMPTY:
        this.setSpace(curPos, SpaceContents.EMPTY);
        this.setSpace(newPos, SpaceContents.ROBOT);
        this.robot = newPos;
        return;
    }

    // Else, we need to create a graph of box pushes, since each box push could
    // result in up to two other box pushes.
    const graph: BoxPushNode = {boxPos: newPos, children: [], dir };
    if (this.testBoxPush(graph)) {
      // For each box push node, recursively update, start at leaves and working
      // back towards the robot.
      this.finishMovingBoxes(graph);

      // Finally, apply the move to the robot.
      this.setSpace(curPos, SpaceContents.EMPTY);
      this.setSpace(newPos, SpaceContents.ROBOT);
      this.robot = newPos;
    }
  }

  finishMovingBoxes(n: BoxPushNode) {
    // Recurse first so that leaves are moved first.
    for (const ch of n.children) {
      this.finishMovingBoxes(ch);
    }

    const vec = o2vec(n.dir);
    const boxPos = n.boxPos;
    const otherBoxPos: Point = this.getSpace(n.boxPos) === SpaceContents.BOX_LEFT
        ? new Point(n.boxPos.x + 1, n.boxPos.y)
        : new Point(n.boxPos.x - 1, n.boxPos.y);
    const c1 = this.getSpace(boxPos);
    const c2 = this.getSpace(otherBoxPos);
    // Reset old contents to empty.
    this.setSpace(boxPos, SpaceContents.EMPTY);
    this.setSpace(otherBoxPos, SpaceContents.EMPTY);
    // Set new space contents to be the box. Note that in some directions this
    // will overwrite the above contents that we just wrote.
    this.setSpace(boxPos.addition(vec), c1);
    this.setSpace(otherBoxPos.addition(vec), c2);
  }

  forEachBox(fn: (b:Point) => void) {
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        if (![SpaceContents.BOX, SpaceContents.BOX_LEFT].includes(this.spaces[y][x])) continue;
        fn(new Point(x, y));
      }
    }
  }

  /**
   * Given a point of a wide box, and a given direction to push, this function
   * returns the points of the Box that need to be evaluated. For example, if it
   * a western push, this will always return the Point corresponding to BOX_LEFT
   * regardless of which Point was sent into the function. For another example,
   * if it is a northern push, this will always return both Points of the box.
   */
  getBoxPts(p: Point, dir: Orientation): Point[] {
    const box = this.getSpace(p);
    if (![SpaceContents.BOX_LEFT, SpaceContents.BOX_RIGHT].includes(box)) {
      throw `${p.toString()} does not correspond to a box Point: ${box}.`;
    }

    switch (dir) {
      case Orientation.E:
        if (box === SpaceContents.BOX_RIGHT) return [p];
        return [new Point(p.x + 1, p.y)];
      case Orientation.W:
        if (box === SpaceContents.BOX_LEFT) return [p];
        return [new Point(p.x - 1, p.y)];
    }

    // If N,S then we need both points of the box.
    if (box === SpaceContents.BOX_LEFT) {
      return [p, new Point(p.x + 1, p.y)];
    }
    return [new Point(p.x - 1, p.y), p];
  }

  getSumGpsCoordinates(): number {
    let sum = 0;
    this.forEachBox(p => sum += (p.y * 100 + p.x));
    return sum;
  }

  getSpace(p: Point): SpaceContents { return this.spaces[p.y][p.x]; }
  setSpace(p: Point, c: SpaceContents) { this.spaces[p.y][p.x] = c; }

  /** Always returns the Point corresponding to the BOX_LEFT of this box. */
  getWideBoxAnchor(p: Point): Point {
    const c = this.getSpace(p);
    if (![SpaceContents.BOX_LEFT, SpaceContents.BOX_RIGHT].includes(c)) {
      throw `Bad point for getWideBoxAnchor(${p.toString})`;
    }

    if (c === SpaceContents.BOX_RIGHT) return new Point(p.x - 1, p.y);
    return p;
  }

  graphAlreadyHasBox(n: BoxPushNode, newBoxPt: Point): boolean {
    const nodeAnchor = this.getWideBoxAnchor(n.boxPos);
    const newAnchor = this.getWideBoxAnchor(newBoxPt);
    if (newAnchor.equals(nodeAnchor)) return true;

    for (const ch of n.children) {
      if (this.graphAlreadyHasBox(ch, newBoxPt)) return true;
    }
    return false;
  }

  graphRoot(n: BoxPushNode): BoxPushNode {
    while (n.parent) n = n.parent;
    return n;
  }

  /** Returns true if the move is allowed. */
  testBoxPush(node: BoxPushNode): boolean {
    const vec = o2vec(node.dir);
    const newBoxPts = this.getBoxPts(node.boxPos, node.dir).map(pt => pt.addition(vec));
    const newContents = newBoxPts.map(p => this.getSpace(p));
    // If all spaces are empty, return true at this leaf.
    if (newContents.every(c => c === SpaceContents.EMPTY)) {
      return true;
    }
    // Else, if any space had a wall, return false at this leaf.
    else if (newContents.some(c => c === SpaceContents.WALL)) {
      return false;
    }

    // Else, we have one or more box nodes to deal with, so maybe recurse.

    /**
     * One problem is when a wide box is pushing directly on another wide box.
     *
     *   @  <== robot pushes south...
     *   []
     *   [] <== ... each character in the above box pushes on the same box, we
     *          don't want to push this box twice.
     *
     * Another problem is when two different boxes are pushing on the same box:
     *     @   <== robot pushes south...
     *    []
     *   [][]
     *    []   <== ... we don't want to push this box twice!
     */

    for (const p of newBoxPts) {
      const c = this.getSpace(p);
      if ([SpaceContents.BOX_LEFT, SpaceContents.BOX_RIGHT].includes(c)) {
        // Make sure no node in the graph is referencing the same box more than once.
        if (!this.graphAlreadyHasBox(this.graphRoot(node), p)) {
          // Recursively push the child boxes.
          const child: BoxPushNode = {boxPos: p, dir: node.dir, children: [], parent: node};
          node.children.push(child);
          if (!this.testBoxPush(child)) return false;
        }
      }
    }

    return true;
  }

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

async function main2(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const grid = new Grid(lines, true);
  for (const cmd of grid.commands) {
    // console.log(`Doing a ${cmd} push`);
    grid.doRobotPushWide(cmd);
    // grid.visualize();
  }
  console.log(`Final grid is:`);
  grid.visualize();
  console.log(`Sum of all GPS coordinates is ${grid.getSumGpsCoordinates()}`);
}

main2('./15/input.txt');
