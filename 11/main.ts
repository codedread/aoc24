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
}

main1('./11/input.txt');
