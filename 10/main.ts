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

interface Node {
  /** This node's coordinate on the trail map. */
  pos: Point;
  /** This node's level (0-9). */
  level: number;
  /** All adjacent trail nodes you can go to. */
  to: Node[];
  /** All adjacent trail nodes you can come from. */
  from: Node[];
}

/**
 * Returns all leaves under node n. If n has no "to" nodes, the returned set
 * will have n in it.
 */
function findLeaves(n: Node): Node[] {
  const leaves: Node[] = [];
  if (n.to.length === 0) {
    leaves.push(n);
  } else {
    for (const toNode of n.to) {
      findLeaves(toNode).forEach(leaf => leaves.push(leaf));
    }
  }
  return leaves;
}

/**
 * Returns all leaves under node n. If n has no "to" nodes, the returned set
 * will have n in it.
 */
function findUniqueLeaves(n: Node): Set<Node> {
  const leaves: Set<Node> = new Set();
  if (n.to.length === 0) {
    leaves.add(n);
  } else {
    for (const toNode of n.to) {
      findUniqueLeaves(toNode).forEach(leaf => leaves.add(leaf));
    }
  }
  return leaves;
}

class TrailMap {
  /** The grid of all nodes. */
  allNodes: Node[][] = [];
  /** All the trail heads (level 0). */
  heads: Node[] = [];
  /** All the summits (level 9). */
  peaks: Node[] = [];

  constructor(lines: string[]) {
    const H = lines.length; const W = lines[0].length;
    for (let y = 0; y < H; ++y) {
      const line = lines[y];
      const rowNodes: Node[] = [];
      if (line.length !== W) throw `Bad line ${y}`;
      for (let x = 0; x < W; ++x) {
        const level = parseInt(line[x]);
        const newNode: Node = {
          pos: new Point(x, y),
          level,
          to: [],
          from: [],
        };
        rowNodes.push(newNode);
        if (level === 0) this.heads.push(newNode);
        else if (level === 9) this.peaks.push(newNode);
      }
      this.allNodes.push(rowNodes);
    }
  
    // Link all nodes.
    for (let y = 0; y < H; ++y) {
      for (let x = 0; x < W; ++x) {
        const node = this.allNodes[y][x];
        if (x > 0) {
          const leftNode = this.allNodes[y][x - 1];
          if (node.level === leftNode.level - 1) {
            node.to.push(leftNode);
            leftNode.from.push(node);
          }
        }
        if (y > 0) {
          const topNode = this.allNodes[y - 1][x];
          if (node.level === topNode.level - 1) {
            node.to.push(topNode);
            topNode.from.push(node);
          }
        }
        if (x < W - 1) {
          const rightNode = this.allNodes[y][x + 1];
          if (node.level === rightNode.level - 1) {
            node.to.push(rightNode);
            rightNode.from.push(node);
          }
        }
        if (y < H - 1) {
          const bottomNode = this.allNodes[y + 1][x];
          if (node.level === bottomNode.level - 1) {
            node.to.push(bottomNode);
            bottomNode.from.push(node);
          }
        }
      }
    }
  } // constructor

  /** Rate each head (count unique peaks) and then sum. */
  walkToTopRating(): number {
    let sum = 0;
    // For each head, gather all its leaves that are also peaks.
    for (const head of this.heads) {
      sum += Array.from(findLeaves(head)).filter(n => n.level === 9).length;
    }
    return sum;
  }

  /** Score each head (count unique peaks) and then sum. */
  walkToTopScore(): number {
    let sum = 0;
    // For each head, gather all its leaves that are also peaks.
    for (const head of this.heads) {
      sum += Array.from(findUniqueLeaves(head)).filter(n => n.level === 9).length;
    }
    return sum;
  }
}

async function main1(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const trailMap = new TrailMap(lines);
  console.log(`score sum = ${trailMap.walkToTopScore()}`);
}

async function main2(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const trailMap = new TrailMap(lines);
  console.log(`rating sum = ${trailMap.walkToTopRating()}`);
}

main2('./10/input.txt');
