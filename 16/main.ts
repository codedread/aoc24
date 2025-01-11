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

function o2vec(o: Orientation): Point {
  switch (o) {
    case Orientation.N: return new Point(0, -1);
    case Orientation.E: return new Point(1, 0);
    case Orientation.S: return new Point(0, 1);
    case Orientation.W: return new Point(-1, 0);
  }
  throw `Another bad orientation: ${o}`;
}

function vec2o(v: Point): Orientation {
  if (v.x === 0 && v.y === -1) return Orientation.N;
  else if (v.x === 1 && v.y === 0) return Orientation.E;
  else if (v.x === 0 && v.y === 1) return Orientation.S;
  else if (v.x === -1 && v.y === 0) return Orientation.W;
  throw `Bad vec: ${v.toString()}`;
}

function vecsNext(facing: Orientation): Point[] {
  switch (facing) {
    case Orientation.N:
      return [o2vec(Orientation.N), o2vec(Orientation.W), o2vec(Orientation.E)];
    case Orientation.E:
      return [o2vec(Orientation.E), o2vec(Orientation.N), o2vec(Orientation.S)];
    case Orientation.S:
      return [o2vec(Orientation.S), o2vec(Orientation.E), o2vec(Orientation.W)];
    case Orientation.W:
      return [o2vec(Orientation.W), o2vec(Orientation.S), o2vec(Orientation.N)];
  }
}

const lowestScoreMap: Map<string, number> = new Map();

class Node {
  /** Up to 4 possible steps from this location. */
  children: Node[] = [];

  constructor(
    /** The coordinates of this space. */
    public loc: Point,
    /** The facing while on this space. */
    public facing: Orientation,
    /** Parent node. Set for every node except the start. */
    public parent: Node|undefined) {}

  hasVisited(newLoc: Point): boolean {
    let n: Node|undefined = this as Node;
    do {
      if (n?.loc.equals(newLoc)) return true;
      n = n.parent;
    } while (n);
    return false;
  }

  score(): number {
    let total = 0;
    let n: Node|undefined = this as Node;
    while (n.parent) {
      if (n.facing !== n.parent.facing) {
        total += 1000;
      }
      total++;
      n = n?.parent;
    }

    return total;
  }
}

class MazeGrid {
  /** True means there is a wall in that space. */
  walls: boolean[][] = [];
  start: Point = new Point(-1, -1);
  end: Point = new Point(-1, -1);
  readonly W: number;
  readonly H: number;
 
  constructor(lines: string[]) {
    this.H = lines.length;
    this.W = lines[0].length;
    for (const line of lines) {
      const row: boolean[] = [];
      for (let i = 0; i < line.length; ++i) {
        const ch = line[i];
        switch (ch) {
          case '.':
            row.push(false);
            break;
          case 'S':
            row.push(false);
            this.start = new Point(i, this.walls.length);
            break;
          case 'E':
            row.push(false);
            this.end = new Point(i, this.walls.length);
            break;
          case '#': 
            row.push(true);
            break;
          default: throw `Bad characters: ${ch}`;
        }
      }
      this.walls.push(row);
    }
    console.log(`Finished parsing the maze`);
  }

  isWall(p: Point): boolean { return this.walls[p.y][p.x]; }

  solve() {
    const root = new Node(this.start, Orientation.E, undefined);
    const solutions: Node[] = this.step(root);
    let minScore = Number.MAX_SAFE_INTEGER;
    console.log(`Found ${solutions.length} solutions`);
    for (const soln of solutions) {
      const score = soln.score();
      if (score < minScore) {
        minScore = score;
      }
    }
    console.log(`Smallest score is ${minScore}`);
  }

  /**
   * Recursively tries to move from this node. Returns an array of nodes that
   * reached the end.
   */
  step(n: Node): Node[] {
    if (this.end.equals(n.loc)) {
      return [n];
    }

    // Look at all 3 adjacent squares, ignore the one that is behind us.
    const solutions: Node[] = [];
    for (const v of vecsNext(n.facing)) {
      const newLoc = n.loc.addition(v);
      // If not a wall and we have never visited it, step in...
      if (!this.isWall(newLoc) && !n.hasVisited(newLoc)) {
        const newNode = new Node(newLoc, vec2o(v), n);
        const key = newNode.loc.toString();
        const newScore = newNode.score();
        // If any other path has been to this square with a lower score, then
        // do not add the new node as something to pursue.
        if (lowestScoreMap.has(key) && lowestScoreMap.get(key)! < newScore) {
          continue;
        }
        lowestScoreMap.set(key, newScore);
        n.children.push(newNode);
        const solns = this.step(newNode);
        solutions.push(...solns);
      }
    }
    return solutions;
  }
}

async function main1(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const maze = new MazeGrid(lines);
  console.log(`Maze is ${maze.W} x ${maze.H}:`);
  maze.solve();
}

main1('./16/input.txt');
