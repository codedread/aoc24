interface ListItem<T> {
  val: T;
  prev?: ListItem<T>;
  next?: ListItem<T>;
}

class LinkedList<T> {
  itemCount = 0;
  head: ListItem<T> | undefined;

  constructor(vals: T[]) {
    if (vals.length === 0) throw 'No vals!';
    this.itemCount = vals.length;
    this.head = {val: vals.shift()!};
    let cur = this.head;
    for (let i = 0; i < vals.length; ++i) {
      const next: ListItem<T> = {val: vals[i]};
      cur.next = next;
      next.prev = cur;
      cur = next;
    }
  }

  /** Unlinks node n in the list. */
  delete(n: ListItem<T>) {
    const next = n.next;
    const prev = n.prev;
    n.prev = undefined;
    n.next = undefined;
    if (n === this.head) this.head = next;
    if (prev) prev.next = next;
    if (next) next.prev = prev;
    this.itemCount--;
  }

  /**
   * Inserts a new ListItem containing val after item n.
   * If n is undefined, then a new ListItem is inserted as the new head.
   */
  insertValAfter(val: T, n: ListItem<T>|undefined) {
    const newItem: ListItem<T> = {val, prev: n};
    if (!n) {
      if (this.head) {
        this.head.prev = newItem;
      }
      newItem.next = this.head;
      this.head = newItem;
    } else {
      const next = n.next;
      newItem.next = next;
      if (next) next.prev = newItem;
      n.next = newItem;
    }
    this.itemCount++;
  }

  size(): number {
    return this.itemCount;
  }

  toString(): string {
    let n: ListItem<T>|undefined = this.head;
    if (!n) return '<null>';
    let s = `${n.val}`;
    n = n.next;
    while (n) {
      s += ` <-> ${n.val}`;
      n = n.next;
    }
    return s;
  }
}

const map: Map<number, number> = new Map();

/**
 * - If the stone is engraved with the number 0, it is replaced by a stone
 *   engraved with the number 1.
 * - If the stone is engraved with a number that has an even number of digits,
 *   it is replaced by two stones. The left half of the digits are engraved on
 *   the new left stone, and the right half of the digits are engraved on the
 *   new right stone. (The new numbers don't keep extra leading zeroes: 1000
 *   would become stones 10 and 0.)
 * - If none of the other rules apply, the stone is replaced by a new stone; the
 *   old stone's number multiplied by 2024 is engraved on the new stone.
 */
function blink(list: LinkedList<number>) {
  let n: ListItem<number>|undefined = list.head;
  let next = list.head?.next;
  while (n) {
    if (!map.has(n.val)) map.set(n.val, 0);
    map.set(n.val, map.get(n.val)! + 1);
    const numStr = `${n.val}`;
    const numDigits = numStr.length;
    if (n.val === 0) {
      n.val = 1;
    } else if (numDigits % 2 === 0) {
      const prev = n.prev;
      const left = parseInt(numStr.substring(0, numDigits / 2));
      const right = parseInt(numStr.substring(numDigits / 2));

      list.delete(n);
      list.insertValAfter(right, prev);
      list.insertValAfter(left, prev);
    } else {
      n.val *= 2024;
    }
    n = next;
    next = n?.next;
  }
}

async function main1(filename: string) {
  const nums = (await Deno.readTextFile(filename))
      .split(' ')
      .map(s => parseInt(s));
  const list = new LinkedList(nums);
  console.log(list.toString());
  for (let b = 0; b < 25; ++b) {
    blink(list);
  }
  console.log(`Number of stones = ${list.size()}`);

  const allKeys = Array.from(map.keys());
  console.log(`# of unique stones = ${allKeys.length}`);
  const repeats = [];
  for (const [key, val] of map) {
    if (val > 1) {
      // console.log(`${key} => ${val}`);
      repeats.push([key,val]);
    }
  }
  console.log(`# of stones that repeated = ${repeats.length}`);
}

/**
 * The above solution is memory intensive as it's storing each stone through all
 * blink operations in a data structure. Going higher than ~40 links takes an
 * extremely long amount of time and eventually runs out of memory. It's also a
 * lot of code.
 *
 * An analysis of the first part solution yields that even though we had 228668
 * stones for part 1, we only had 840 unique stones. And 214 of those repeated
 * more than once.
 *
 * This suggests that we could memoize each unique stone's blinks in a map so
 * that we don't have to store the sub-lists at all, just the link results as we
 * recurse.
 */

/**
 * This map stores the result of blinking a stone n times. The key is a
 * concatenated string of 'stone-blinkTimes'. i.e. blinking a "2024" stone 4 times
 * would use a key "2024-4" to store the resulting # of stones produced.
 */
const blinkMemoizer: Map<string, number> = new Map();
const memoKey = (stone: number, n: number) => `${stone}-${n}`;

/** Blinks a single stone n times, returning the resulting number of stones. */
function blinkStone(stone: number, n: number): number {
  const key = memoKey(stone, n);
  if (blinkMemoizer.has(key)) {
    return blinkMemoizer.get(key)!;
  }

  const nextStones: number[] = [];
  const numStr = `${stone}`;
  const numDigits = numStr.length;

  if (stone === 0) {
    nextStones.push(1);
  } else if (numDigits % 2 === 0) {
    const left = parseInt(numStr.substring(0, numDigits / 2));
    const right = parseInt(numStr.substring(numDigits / 2));
    nextStones.push(left, right);
  } else {
    nextStones.push(stone * 2024);
  }

  if (n > 1) {
    let sumStones = 0;
    for (const nextStone of nextStones) {
      const sumNextStone = blinkStone(nextStone, n-1);
      blinkMemoizer.set(memoKey(nextStone, n-1), sumNextStone);
      sumStones += sumNextStone;
    }
    return sumStones;
  }
  return nextStones.length;
}

async function main2(filename: string) {
  const stones = (await Deno.readTextFile(filename))
      .split(' ')
      .map(s => parseInt(s));
  let numStones = 0;
  for (const stone of stones) {
    numStones += blinkStone(stone, 75);
  }
  console.log(`# of stones = ${numStones}`);
}

main2('./11/input.txt');
