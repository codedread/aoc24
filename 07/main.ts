
interface Equation {
  testValue: number;
  nums: number[];
}

enum Op {
  MULTIPLY = 0,
  ADDITION = 1,
  CONCAT = 2,
}
const OpsPart1 = [Op.MULTIPLY, Op.ADDITION];
const OpsPart2 = [Op.MULTIPLY, Op.ADDITION, Op.CONCAT];

async function readInput(filename: string): Promise<Equation[]> {
  const lines = (await Deno.readTextFile(filename)).split(/\r?\n/);
  const equations: Equation[] = [];
  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length < 3) throw 'Bad line';
    equations.push({
      testValue: parseInt(parts[0]),
      nums: parts.slice(1).map(ns => parseInt(ns)),
    });
  }
  return equations;
}

/**
 * Returns an array of Operations for permutation p, given base b.
 * [
 *   [MULTIPLY, MULTIPLY, MULTIPLY], // p=0, b=2, n=3
 *   [MULTIPLY, MULTIPLY, ADDITION], // p=1, b=2, n=3
 *   [MULTIPLY, ADDITION, MULTIPLY], // p=2, b=2, n=3
 *   [MULTIPLY, ADDITION, ADDITION], // p=3, b=2, n=3
 *   [ADDITION, MULTIPLY, MULTIPLY], // p=4, b=2, n=3
 *   [ADDITION, MULTIPLY, ADDITION], // p=5, b=2, n=3
 *   [ADDITION, ADDITION, MULTIPLY], // p=6, b=2, n=3
 *   [ADDITION, ADDITION, ADDITION], // p=7, b=2, n=3
 * ]
 * @param {number} p The permutation number.
 * @param {number} b The number of possible operations.
 * @param {number} n The length of the operation array.
 */
function getOpListForPermutation(p: number, b: number, n: number): Op[] {
  const ops: Op[] = [];
  for (let i = 0; i < n; ++i) {
    ops.push(Math.floor(p / b**i) % b);
  }
  return ops.reverse();
}

function getTestValueSum(eqs: Equation[], ops: Op[]): number {
  let testValueSum = 0;
  const B = ops.length;
  for (const eq of eqs) {
    // console.log(`Looking at ${eq.nums} for test value ${eq.testValue}:`);
    const N = eq.nums.length - 1;
    const MAX_PERMS = B ** N;
    for (let p = 0; p < MAX_PERMS; ++p) {
      const opList = getOpListForPermutation(p, B, N);
      // console.log(`p=${p},b=${B},n=${N} => [${ops}]`);
      let total = eq.nums[0];
      for (let i = 0; i < N; ++i) {
        // console.log(`i=${i}, the num is ${eq.nums[i+1]}`);
        switch (opList[i]) {
          case Op.MULTIPLY: total *= eq.nums[i+1]; break;
          case Op.ADDITION: total += eq.nums[i+1]; break;
          case Op.CONCAT: total = parseInt(`${total}${eq.nums[i+1]}`); break;
          default: throw `Bad op: ${ops[i]}`;
        }
      }
      // console.log(`Total is ${total}`);
      if (total === eq.testValue) {
        testValueSum += eq.testValue;
        // Stop looking at operation permutations, this one matched.
        break;
      }
    } // For each operation permutation.
  } // For each equation.
  return testValueSum;
}

async function main1() {
  const eqs = await readInput('./07/input_test_1.txt');
  const maxNumbers = eqs.reduce((m, eq) => Math.max(m, eq.nums.length), 0);
  console.log(`Max nums is ${maxNumbers}, ${OpsPart1.length ** maxNumbers} permutations`);
  console.log(`Test value sum is ${getTestValueSum(eqs, OpsPart1)}`);
}

async function main2() {
  const eqs = await readInput('./07/input.txt');
  const maxNumbers = eqs.reduce((m, eq) => Math.max(m, eq.nums.length), 0);
  console.log(`Max nums is ${maxNumbers}, ${OpsPart1.length ** maxNumbers} permutations`);
  console.log(`Test value sum is ${getTestValueSum(eqs, OpsPart2)}`);
}

main2();
