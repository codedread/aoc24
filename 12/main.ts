/** Represents a 2D point. */
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

class PerimeterSegment {
  /**
   * A segment of fence from from and to. The normal vector points "out of" the
   * region. The from and to points may be swapped to keep things left-to-right,
   * but the normal does not change.
   * The normal is important for cases highlighted in input_test_4.txt in which
   * two separate interior B regions corners are touching at a point. We should
   * *not* consider the line segment spanning the two B regions as a single
   * segment of fence.
   */
  constructor(public from: Point, public to: Point, public normal: Point) {
    if (!this.isHorizontal() && !this.isVertical()) throw `No diagonal segments!`;
    if ((this.isHorizontal() && from.x > to.x)
        || (this.isVertical() && from.y > to.y)) {
      const temp = this.from;
      this.from = this.to;
      this.to = temp;
    }
  }

  equals(seg: PerimeterSegment): boolean {
    return (this.from.equals(seg.from) && this.to.equals(seg.to))
        || (this.from.equals(seg.to) && this.from.equals(seg.to));
  }
  isColinear(seg: PerimeterSegment): boolean {
    if (this.isVertical() !== seg.isVertical()) return false;
    if (this.isVertical()) return this.from.x === seg.to.x;
    return this.from.y === seg.from.y;
  }
  isConnected(seg: PerimeterSegment): boolean {
    return this.from.equals(seg.from) || this.from.equals(seg.to)
       || this.to.equals(seg.to) || this.to.equals(seg.from);
  }
  isHorizontal(): boolean { return !this.isVertical(); }
  isVertical(): boolean { return this.from.y !== this.to.y; }
  isSameOrientation(o: PerimeterSegment): boolean {
    return this.normal.equals(o.normal);
  }
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

  getPerimeterSegments(sq: Square): PerimeterSegment[] {
    const segs: PerimeterSegment[] = [];
    // Look west. If no plot neighbor, then it's a vertical perimeter segment.
    if (sq.pos.x === 0 || this.squares[sq.pos.y][sq.pos.x - 1].crop !== sq.crop) {
      const from = new Point(sq.pos.x, sq.pos.y);
      const to = new Point(sq.pos.x, sq.pos.y + 1);
      segs.push(new PerimeterSegment(from, to, new Point(-1, 0)));
    }
    // Look east. If no plot neighbor, then it's a vertical perimeter segment.
    if (sq.pos.x === this.W - 1 || this.squares[sq.pos.y][sq.pos.x + 1].crop !== sq.crop) {
      const from = new Point(sq.pos.x + 1, sq.pos.y);
      const to = new Point(sq.pos.x + 1, sq.pos.y + 1);
      segs.push(new PerimeterSegment(from, to, new Point(1, 0)));
    }
    // Look north. If no plot neighbor, then it's a horizontal perimeter segment.
    if (sq.pos.y === 0 || this.squares[sq.pos.y - 1][sq.pos.x].crop !== sq.crop) {
      const from = new Point(sq.pos.x, sq.pos.y);
      const to = new Point(sq.pos.x + 1, sq.pos.y);
      segs.push(new PerimeterSegment(from, to, new Point(0, -1)));
    }
    // Look south. If no plot neighbor, then it's a horizontal perimeter segment.
    if (sq.pos.y === this.H - 1 || this.squares[sq.pos.y + 1][sq.pos.x].crop !== sq.crop) {
      const from = new Point(sq.pos.x, sq.pos.y + 1);
      const to = new Point(sq.pos.x + 1, sq.pos.y + 1);
      segs.push(new PerimeterSegment(from, to, new Point(0, 1)));
    }
    return segs;
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

  getPlotSegments(p: Plot): PerimeterSegment[] {
    const allSegs: PerimeterSegment[] = [];
    for (const sq of p.squares) {
      allSegs.push(...this.getPerimeterSegments(sq));
    }
    return allSegs;
  }

  mergePlots() {
    console.log(`Merging plots...`);
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

  getDiscountedCost(): number {
    let totalCost = 0;
    for (const plot of this.plots) {
      const plotSegs: PerimeterSegment[] = this.getPlotSegments(plot);

      // Count all horizontal sides.
      let horizSides = 1;
      const horizSegs = plotSegs.filter(s => s.isHorizontal()).sort((a, b) => {
        if (a.from.y !== b.from.y) return a.from.y - b.from.y;
        return a.from.x - b.from.x; 
      });

      let i = 0;
      while (i < horizSegs.length - 1) {
        const seg1 = horizSegs[i];
        const seg2 = horizSegs[i + 1];
        if (!seg1.isColinear(seg2) || !seg1.isConnected(seg2) ||
            !seg1.isSameOrientation(seg2)) {
          horizSides++;
        }
        i++;
      }

      // Count all vertical sides.
      let vertSides = 1;
      const vertSegs = plotSegs.filter(s => s.isVertical()).sort((a, b) => {
        if (a.from.x !== b.from.x) return a.from.x - b.from.x;
        return a.from.y - b.from.y;
      });
      let j = 0;
      while (j < vertSegs.length - 1) {
        const seg1 = vertSegs[j];
        const seg2 = vertSegs[j + 1];
        if (!seg1.isColinear(seg2) || !seg1.isConnected(seg2) ||
            !seg1.isSameOrientation(seg2)) {
          vertSides++;
        }
        j++;
      }

      totalCost += (horizSides + vertSides) * plot.squares.length;
    }
    return totalCost;
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


async function main2(filename: string) {
  const garden = new Garden((await Deno.readTextFile(filename)).split(/\r?\n/));
  console.log(`# plots = ${garden.plots.length}`);
  console.log(`Discounted plot cost = ${garden.getDiscountedCost()}`);
}

main2('./12/input.txt');
