
enum Dir {
  N, NE, E, SE, S, SW, W, NW
}

class Node {
  neighbors: Map<Dir, Node> = new Map();
  constructor(public x: number, public y: number, public val: string) {}
}

class Path {
  parentPath: (Path|undefined) = undefined;
  childrenPaths: Path[] = [];

  constructor(public n: Node) {}

  addChildPath(p: Path) {
    p.parentPath = this;
    this.childrenPaths.push(p);
  }
}

function dumpPath(tail: Path) {
  let str = '';
  let p: (Path|undefined) = tail;
  while (p) {
    str = `(${p.n.x},${p.n.y})` + str;
    if (p.parentPath) str = ` -> ` + str;
    p = p.parentPath;
  }
  console.log(str);
}

async function createWordSearch(filename: string): Promise<Node[][]> {
  const allNodes: Node[][] = [];
  const rows = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const H = rows.length;
  let W;

  // Create nodes first.
  for (let y = 0; y < H; ++y) {
    allNodes.push([]);
    if (!W) W = rows[y].length;
    if (W !== rows[y].length) throw 'bwah';
    for (let x = 0; x < W; ++x) {
      allNodes[y].push(new Node(x, y, rows[y][x]));
    }
    console.log(rows[y]);
  }

  // Now link all nodes to their neighbors.
  for (let y = 0; y < H; ++y) {
    if (W !== allNodes[y].length) throw 'hah-hah';
    for (let x = 0; x < W; ++x) {
      const n = allNodes[y][x];
      if (y > 0) {
        n.neighbors.set(Dir.N, allNodes[y-1][x]);
        if (x > 0) {
          n.neighbors.set(Dir.NW, allNodes[y-1][x-1]);
        }
        if (x < (W-1)) {
          n.neighbors.set(Dir.NE, allNodes[y-1][x+1]);
        }
      }
      if (y < (H-1)) {
        n.neighbors.set(Dir.S, allNodes[y+1][x]);
        if (x > 0) {
          n.neighbors.set(Dir.SW, allNodes[y+1][x-1]);
        }
        if (x < (W-1)) {
          n.neighbors.set(Dir.SE, allNodes[y+1][x+1]);
        }
      }
      // Can go west.
      if (x > 0) {
        n.neighbors.set(Dir.W, allNodes[y][x-1]);
      }
      // Can go east.
      if (x < (W-1)) {
        n.neighbors.set(Dir.E, allNodes[y][x+1]);
      }
    }
  }
  return allNodes;
}

/** lineDirection ensures that a path only goes in a straight line. */
function populateAllPathsFromNode(p: Path, str: string, tailMatches: Path[],
    lineDirection: (Dir|undefined) = undefined) {
  // We come in here knowing that p.n matches the previous character of the string.
  // Now check if any of p.n's neighbors match the next value and recurse.
  for (const [dir, neighbor] of p.n.neighbors.entries()) {
    // Skip all neighbors that don't follow the given line direction.
    if (lineDirection !== undefined && lineDirection !== dir) continue;

    if (neighbor.val === str[0]) {
      const childPath = new Path(neighbor);
      p.addChildPath(childPath);
      if (str.length > 1) {
        populateAllPathsFromNode(childPath, str.substring(1), tailMatches, dir);
      } else {
        tailMatches.push(childPath);
      }
    }
  }
}

async function main1() {
  const matchStr = 'XMAS';
  const allNodes = await createWordSearch('./04/input.txt');
  const allTailMatches: Path[] = [];
  for (const nodeRow of allNodes) {
    for (const node of nodeRow) {
      if (node.val === matchStr[0]) {
        const head = new Path(node);
        populateAllPathsFromNode(head, matchStr.substring(1), allTailMatches);
      }
    }
  }

  console.log(`# of matches = ${allTailMatches.length}`);
}


async function main2() {
  const matchStr = 'MAS';
  const allTailMatches: Path[] = [];
  const allNodes = await createWordSearch('./04/input.txt');
  for (const nodeRow of allNodes) {
    for (const node of nodeRow) {
      if (node.val === matchStr[0]) {
        const head = new Path(node);
        populateAllPathsFromNode(head, matchStr.substring(1), allTailMatches);
      }
    }
  }
  console.log(`Found ${allTailMatches.length} 'MAS'`);

  // For every match, filter to only the ones that go on a diagonal.
  const diagonalMatches = allTailMatches.filter(match => {
    const x1 = match.n.x, y1 = match.n.y;
    const x2 = match.parentPath?.n.x!, y2 = match.parentPath?.n.y!;
    const dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
    return (dx == 1 && dy == 1);
  });
  console.log(`Found ${diagonalMatches.length} diagonal matches`);

  // For every diagonal match, check if there is a diagonal match that shares
  // the same middle letter.
  const crossMatches: Path[][] = [];
  while (diagonalMatches.length > 0) {
    const match = diagonalMatches.pop()!;
    const middleX = match.parentPath?.n.x!, middleY = match.parentPath?.n.y!;
    const crossMatch = diagonalMatches.find(m => {
      return m !== match
          && m.parentPath?.n.x === middleX
          && m.parentPath?.n.y === middleY;
    });
    if (crossMatch) {
      crossMatches.push([match, crossMatch]);
    }
  }
  console.log(`Found ${crossMatches.length} X matches`);

  // for (const matches of crossMatches) {
  //   dumpPath(matches[0]);
  //   dumpPath(matches[1]);
  //   console.log('====================');
  // }
}

main2();
