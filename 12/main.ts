/** Represents a 2D point or vector. */
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

class Square {
  constructor(
    public crop: string,
    public pos: Point,
    public plot: Plot,
  ) {}
}

class Plot {
  squares: Square[] = [];
  constructor(public crop: string) {}
}

class Garden {
  readonly W: number;
  readonly H: number;
  squares: Square[][] = [];
  plots: Plot[] = [];

  constructor(lines: string[]) {
    this.H = lines.length;
    this.W = lines[0].length;
    // Assign every square, including a 1-square plot.
    for (let y = 0; y < this.H; ++y) {
      const row: Square[] = [];
      for (let x = 0; x < this.W; ++x) {
        const sq = new Square(lines[y][x], new Point(x, y), new Plot(lines[y][x]));
        sq.plot.squares.push(sq);
        this.plots.push(sq.plot);
        row.push(sq);
      }
      this.squares.push(row);
    }
    this.mergePlots();
  }

  /** Returns up to 4 adjacent neighbors that have the same crop as sq. */
  getMatchingNeighbors(sq: Square): Square[] {
    const neighbors: Square[] = [];
    if (!sq.pos) { console.dir(sq); }
    if (sq.pos.x > 0) {
      neighbors.push(this.squares[sq.pos.y][sq.pos.x - 1]);
    }
    if (sq.pos.y > 0) {
      neighbors.push(this.squares[sq.pos.y - 1][sq.pos.x]);
    }
    if (sq.pos.x < this.W - 1) {
      neighbors.push(this.squares[sq.pos.y][sq.pos.x + 1]);
    }
    if (sq.pos.y < this.H - 1) {
      neighbors.push(this.squares[sq.pos.y + 1][sq.pos.x]);
    }
    return neighbors.filter(n => n.crop === sq.crop);
  }

  getPlotCost(p: Plot): number {
    const area = p.squares.length;
    let perimeter = 0;
    for (const sq of p.squares) {
      perimeter += 4 - this.getMatchingNeighbors(sq).length;
    }
    return area * perimeter;
  }

  /**
   * Returns the first two plots that need merging or an empty array if no plots
   * need merging.
   */
  getPlotsToMerge(): Plot[] {
    for (let y = 0; y < this.H; ++y) {
      for (let x = 0; x < this.W; ++x) {
        const sq = this.squares[y][x];
        const neighbors = this.getMatchingNeighbors(sq);
        if (neighbors.length > 0) {
          const mergeSquare = neighbors.find(s => s.plot !== sq.plot);
          if (mergeSquare) return [ sq.plot, mergeSquare.plot ];
        }
      }
    }
    return [];
  }

  mergePlots() {
    let plotsToMerge = this.getPlotsToMerge();
    while (plotsToMerge.length === 2) {
      // Merge the b plot into the a plot.
      const [a, b] = plotsToMerge;
      for (const sq of b.squares) {
        sq.plot = a;
        a.squares.push(sq);
      }
      this.plots.splice(this.plots.indexOf(b), 1);
      plotsToMerge = this.getPlotsToMerge();
    }
  }
}

async function main1(filename: string) {
  const garden = new Garden((await Deno.readTextFile(filename)).split(/\r?\n/));
  console.log(`# plots = ${garden.plots.length}`);
  let allPlotCost = 0;
  for (const plot of garden.plots) {
    allPlotCost += garden.getPlotCost(plot);
  }
  console.log(`All plot cost = ${allPlotCost}`);
}

main1('./12/input.txt');
