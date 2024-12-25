/** Represents a 2D point or vector. */
class Point {
  constructor(public x: number, public y: number) {}

  /** Returns the sum of this and another point. */
  addition(o: Point): Point {
    return new Point(this.x + o.x, this.y + o.y);
  }

  /** Returns the vector to get from this point to another. */
  difference(o: Point): Point {
    return new Point(o.x - this.x, o.y - this.y);
  }

  equals(o: Point): boolean {
    return this.x === o.x && this.y === o.y;
  }

  inverse(): Point { return new Point(-this.x, -this.y); }

  toString(): string {
    return `(${this.x},${this.y})`;
  }
}

/** Represents a 2D grid containing a number of antenna groups. */
interface AntennaGrid {
  /** A map of antenna identifier to a list of all antenna grid points. */
  antennaGroups: Map<string, Point[]>;
  /** The size of the grid. size.x is width. size.y is height. */
  size: Point;
}

/**
 * Given N things, where N >= 2, returns an array of all combinations of pairs
 * of things.
 * i.e. [1, 2, 3, 4] would return [ [1,2], [1,3], [1,4], [2,3], [2,4], [3,4] ].
 */
function getAllPairs<T>(things: T[]): T[][] {
  const L = things.length;
  if (L < 2) throw 'things must have at least two members!';
  const pairs: T[][] = [];
  for (let i = 0; i < L - 1; ++i) {
    for (let j = i + 1; j < L; ++j) {
      pairs.push([things[i], things[j]]);
    }
  }
  return pairs;
}

async function readInput(filename: string): Promise<AntennaGrid> {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const h = lines.length, w = lines[0].length;
  const m: Map<string, Point[]> = new Map();
  const grid: AntennaGrid = { antennaGroups: m, size: new Point(w, h) };

  for (let y = 0; y < h; ++y) {
    const row = lines[y];
    for (let x = 0; x < w; ++x) {
      const ch = row[x];
      if (ch !== '.') {
        if (!m.has(ch)) { m.set(ch, []); }
        m.get(ch)!.push(new Point(x, y));
      }
    }
  }

  return grid;
}

function isOnGrid(p: Point, size: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size.x && p.y < size.y;
}

/**
 * Given two points on the grid, finds their antinodes and returns them.
 * If any of the antinodes are off the grid, they will not return. That is,
 * the returned array may have zero, one, or two points in it.
 */
function findAntinodesForPair(p1: Point, p2: Point, grid: AntennaGrid): Point[] {
  const vec = p1.difference(p2);
  const antinodes: Point[] = [];
  const a1 = p2.addition(vec);
  if (isOnGrid(a1, grid.size)) { antinodes.push(a1); }
  const a2 = p1.addition(vec.inverse());
  if (isOnGrid(a2, grid.size)) { antinodes.push(a2); }
  return antinodes;
}

async function main1() {
  const grid = await readInput('./08/input.txt');
  console.log(`Grid is ${grid.size.toString()}`);
  const uniqueAntiNodePts: string[] = [];
  for (const group of grid.antennaGroups.values()) {
    const pairs = getAllPairs(group);
    for (const pair of pairs) {
      const antinodes = findAntinodesForPair(pair[0], pair[1], grid);
      for (let i = 0; i < antinodes.length; ++i) {
        const antinodeStr = antinodes[i].toString();
        if (!uniqueAntiNodePts.includes(antinodeStr)) {
          uniqueAntiNodePts.push(antinodeStr);
        }
      }
    }
  }
  console.log(`Total unique antinode coords = ${uniqueAntiNodePts.length}`);
}

main1();
