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

const A_COST = 3;
const B_COST = 1;

class ClawConfig {
  a: Point;
  b: Point;
  prize: Point;

  constructor(lines: string[]) {
    if (lines.length !== 3) throw `Bad # of lines`;
    const aParts = lines[0].split('+');
    if (aParts.length !== 3) throw `Bad a-line`;
    const bParts = lines[1].split('+');
    if (bParts.length !== 3) throw `Bad b-line`;
    const pParts = lines[2].split('=');
    if (pParts.length !== 3) throw `Bad p-line`;

    this.a = new Point(parseInt(aParts[1]), parseInt(aParts[2]));
    this.b = new Point(parseInt(bParts[1]), parseInt(bParts[2]));
    this.prize = new Point(parseInt(pParts[1]), parseInt(pParts[2]));

    // I assume the two vectors should not be linear multiples of each other.
    if ((this.b.y / this.b.x) === (this.a.y / this.a.x)) throw 'a fit';
  }

  /**
   * Returns the minimum # of tokens to obtain the prize. The return value is -1
   * if the prize cannot be obtained.
   */
  resolve(): number {
    /**
     * It's basically a system of linear equations, with a and b representing
     * the number of times a and b buttons are pressed, respectively.
     *
     *   a1 * m + b1 * n = c1
     *   a2 * n + b2 * n = c2
     *
     * We have to be careful though. m and n must only be integers.
     */
    const a1 = this.a.x;
    const b1 = this.b.x;
    const c1 = this.prize.x;
    const a2 = this.a.y;
    const b2 = this.b.y;
    const c2 = this.prize.y;
    const det = (a1 * b2 - a2 * b1);
    // If determinant of the matrix is zero, it can't be solved.
    if (det === 0) {
      throw 'zero!';
    }
    const n = (a1 * c2 - a2 * c1) / det;
    const m = (c1 - b1 * n) / a1;
    if (Number.isInteger(m) && Number.isInteger(n)) {
      return m * A_COST + n * B_COST;
    }
    return -1;
  }

  resolve_day2(): number {
    const a1 = this.a.x;
    const b1 = this.b.x;
    const c1 = this.prize.x + 10000000000000;
    const a2 = this.a.y;
    const b2 = this.b.y;
    const c2 = this.prize.y + 10000000000000;
    const det = (a1 * b2 - a2 * b1);
    // If determinant of the matrix is zero, it can't be solved.
    if (det === 0) {
      throw 'zero!';
    }
    const n = (a1 * c2 - a2 * c1) / det;
    const m = (c1 - b1 * n) / a1;
    if (Number.isInteger(m) && Number.isInteger(n)) {
      return m * A_COST + n * B_COST;
    }
    return -1;
  }
}

async function main1(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  let i = 0;
  const configs: ClawConfig[] = [];
  while (i < lines.length) {
    const config = new ClawConfig(lines.slice(i, i+3));
    // console.dir(config);
    configs.push(config);
    i += 4;
  }

  let totalTokens = 0;
  for (const config of configs) {
    const tokens = config.resolve();
    if (tokens !== -1) {
      totalTokens += tokens;
    }
  }
  console.log(`Total tokens is ${totalTokens}`);
}

async function main2(filename: string) {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  let i = 0;
  const configs: ClawConfig[] = [];
  while (i < lines.length) {
    const config = new ClawConfig(lines.slice(i, i+3));
    // console.dir(config);
    configs.push(config);
    i += 4;
  }

  let totalTokens = 0;
  for (const config of configs) {
    const tokens = config.resolve_day2();
    if (tokens !== -1) {
      totalTokens += tokens;
    }
  }
  console.log(`Total tokens is ${totalTokens}`);
}

main2(`./13/input.txt`);
