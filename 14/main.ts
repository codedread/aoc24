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

class Robot {
  constructor(public start: Point, public velocity: Point) {}
}

class Space {
  robots: Robot[] = [];

  constructor(lines: string[],
      public readonly W: number,
      public readonly H: number) {
    if (W % 2 !== 1) throw `W not odd`;
    if (H % 2 !== 1) throw `H not odd`;
    
    for (const line of lines) {
      const pvParts = line.split('=');
      const p = pvParts[1].split(',');
      const v = pvParts[2].split(',');
      const newRobot = new Robot(
        new Point(parseInt(p[0]), parseInt(p[1])),
        new Point(parseInt(v[0]), parseInt(v[1])),
      );
      this.robots.push(newRobot);
    }
  }

  getSafetyFactor(pts: Point[]): number {
    const quadrantX = Math.floor(this.W / 2);
    const quadrantY = Math.floor(this.H / 2);
    let nw = 0, ne = 0, sw = 0, se = 0;
    for (const pt of pts) {
      if (pt.x < quadrantX && pt.y < quadrantY) {
        nw++;
      } else if (pt.x < quadrantX && pt.y > quadrantY) {
        sw++;
      } else if (pt.x > quadrantX && pt.y < quadrantY) {
        ne++;
      } else if (pt.x > quadrantX && pt.y > quadrantY) {
        se++;
      }
    }
    return nw * sw * ne * se;
  }

  /** Returns the points of the robots after numSeconds time. */
  runRobots(numSeconds: number): Point[] {
    const pts: Point[] = [];
    for (const robot of this.robots) {
      const newPos = robot.start.addition(
        new Point(robot.velocity.x * numSeconds,
          robot.velocity.y * numSeconds));
      // Do teleportation.
      newPos.x %= this.W;
      newPos.y %= this.H;
      if (newPos.x < 0) { newPos.x += this.W; }
      if (newPos.y < 0) { newPos.y += this.H; }

      pts.push(newPos);
    }
    return pts;
  }

  visualize(pts: Point[]) {
    const grid: number[][] = [];
    for (let y = 0; y < this.H; ++y) {
      grid.push(new Array(this.W).fill(0));
    }

    for (const pt of pts) {
      grid[pt.y][pt.x]++;
    }

    for (const row of grid) {
      console.log(row.map(v => v === 0 ? '.' : `${v}`).join());
    }
  }
}

async function main1(filename: string, W: number, H: number, numSeconds: number) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const space = new Space(lines, W, H);
  const safetyFactor = space.getSafetyFactor(space.runRobots(numSeconds));
  console.log(`Safety factor = ${safetyFactor}`);
}

/**
 * As we iterate over first 1000 seconds, we see box-like pictures at various
 * points in time: 13, 79, 114, 182, 215, 285, 316, 388, ...
 * The odd ones start at 13 and add 101 (W) each time.
 * The even ones start at 79 and add 103 (H) each time.
 */
async function main2(filename: string, W: number, H: number, numSeconds: number) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const space = new Space(lines, W, H);
  for (let t = 0; t < 1000000; ++t) {
    let foundMultiple = false;
    if (t >= 13 && (t - 13) % 101 === 0) {
      foundMultiple = true;
    }
    if (t >= 79 && (t - 79) % 103 === 0) {
      foundMultiple = true;
    }

    if (foundMultiple) {
      const pts = space.runRobots(t);
      console.clear();
      space.visualize(pts);
      console.log(`${t}: Press enter`);
      const arr = new Uint8Array(100);
      await Deno.stdin.readSync(arr);
      const input = new TextDecoder().decode(arr);
      if (input[0] === 'p') {
        if (t > 0) t -= 2;
        else t--;
      }
    }
  }
}

//main1(`./14/input_test_1.txt`, 11, 7, 100);
main2(`./14/input.txt`, 101, 103, 100);
