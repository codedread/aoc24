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

  /** Returns the safety factor. */
  runRobots(numSeconds: number): number {
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
}

async function main1(filename: string, W: number, H: number, numSeconds: number) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const space = new Space(lines, W, H);
  console.log(`Safety factor = ${space.runRobots(numSeconds)}`);
}

//main1(`./14/input_test_1.txt`, 11, 7, 100);
main1(`./14/input.txt`, 101, 103, 100);
