/** For a given page-number, all the pages that must be before and after it. */
class PageOrdering {
  /** Which pages must be printed before this one. */
  beforeNums: Set<number> = new Set();
  /** Which pages must be printed after this one. */
  afterNums: Set<number> = new Set();
  constructor(public pageNum: number) {}
}

interface Update {
  pages: number[];
}

const orderMap: Map<number, PageOrdering> = new Map();
const updates: Update[] = [];

/** Whether page p can be printed before the list of pages. */
function canPrintBeforePages(p: number, pages: number[]) {
  const ordering = orderMap.get(p);
  if (!ordering) throw `canPrintBeforePages: No ordering for page ${p}`;
  for (const page of pages) {
    if (ordering.beforeNums.has(page)) return false;
  }
  return true;
}


/** Whether page p can be printed after the list of pages. */
function canPrintAfterPages(p: number, pages: number[]) {
  const ordering = orderMap.get(p);
  if (!ordering) throw `canPrintAfterPages: No ordering for page ${p}`;
  for (const page of pages) {
    if (ordering.afterNums.has(page)) return false;
  }
  return true;
}

async function main1() {
  const lines = (await Deno.readTextFile('./05/input.txt')).split(/\r?\n/);
  while (lines.length > 0) {
    const line = lines.shift();
    if (line?.includes('|')) {
      const nums = line.split('|').map(s => parseInt(s));
      if (nums.length !== 2) throw `Bad rule: ${line}`;
      if (!orderMap.has(nums[0])) {
        orderMap.set(nums[0], new PageOrdering(nums[0]));
      }
      if (!orderMap.has(nums[1])) {
        orderMap.set(nums[1], new PageOrdering(nums[1]));
      }
      orderMap.get(nums[0])!.afterNums.add(nums[1]);
      orderMap.get(nums[1])!.beforeNums.add(nums[0]);
    } else if (line?.includes(',')) {
      const update = line.split(',').map(s => parseInt(s));
      if (update.length % 2 !== 1) throw `Update with even number pages found!`;
      updates.push({pages: update});
    }
  }

  const correctlyOrderedUpdates: Update[] = [];
  const incorrectlyOrderedUpdates: Update[] = [];
  for (const update of updates) {
    let updateIncorrectlyOrdered = false;
    for (let i = 0; i < update.pages.length; ++i) {
      const pages = update.pages;
      const p = pages[i];
      if (i === 0) {
        const afterPages = pages.slice(i + 1);
        if (!canPrintBeforePages(p, afterPages)) {
          updateIncorrectlyOrdered = true;
          break;
        }
      } else if (i === pages.length - 1) {
        const beforePages = pages.slice(0, i);
        if (!canPrintAfterPages(p, beforePages)) {
          updateIncorrectlyOrdered = true;
          break;
        }
      } else {
        const beforePages = pages.slice(0, i);
        const afterPages = pages.slice(i + 1);
        if (!canPrintBeforePages(p, afterPages) ||
            !canPrintAfterPages(p, beforePages)) {
          updateIncorrectlyOrdered = true;
          break;
        }
      }
    }
    if (!updateIncorrectlyOrdered) {
      correctlyOrderedUpdates.push(update);
    } else {
      incorrectlyOrderedUpdates.push(update);
    }
  }

  console.log(`# correctly ordered updates = ${correctlyOrderedUpdates.length}`);
  let sum = 0;
  for (const u of correctlyOrderedUpdates) {
    const index = Math.floor(u.pages.length / 2);
    const middleValue = u.pages[index];
    sum += middleValue;
  }
  console.log(`sum of middle numbers in correctly ordered updates = ${sum}`);

  // Part 2.

  console.log(`# of incorrectly ordered updates = ${incorrectlyOrderedUpdates.length}`);
  const correctedUpdates: Update[] = [];
  for (const update of incorrectlyOrderedUpdates) {
    const newUpdate: Update = {pages: []};
    const pages = update.pages;
    while (pages.length > 0) {
      const p = pages.shift()!;
      // Determine where each page should be inserted.
      let indexToInsertAt = 0;
      const results: boolean[] = [];
      // For each page already in the update, assess whether the new numbers can
      // be inserted at the given index, and record whether it can.
      while (indexToInsertAt <= newUpdate.pages.length) {
        if (indexToInsertAt === 0) {
          const afterPages = newUpdate.pages.slice(indexToInsertAt);
          results.push(canPrintBeforePages(p, afterPages));
        } else if (indexToInsertAt === newUpdate.pages.length) {
          const beforePages = newUpdate.pages.slice(0, indexToInsertAt);
          results.push(canPrintAfterPages(p, beforePages));
        } else {
          const beforePages = newUpdate.pages.slice(0, indexToInsertAt);
          const afterPages = newUpdate.pages.slice(indexToInsertAt);
          results.push(canPrintAfterPages(p, beforePages) &&
                       canPrintBeforePages(p, afterPages));
        }
        indexToInsertAt++;
      }
      // Find the last true result, and insert the page there.
      newUpdate.pages.splice(results.findLastIndex(r => !!r), 0, p);
    }
    correctedUpdates.push(newUpdate);
  } // for each incorrectly-ordered update

  let correctedSum = 0;
  for (const u of correctedUpdates) {
    const index = Math.floor(u.pages.length / 2);
    const middleValue = u.pages[index];
    correctedSum += middleValue;
  }
  console.log(`sum of middle numbers in corrected ordered updates = ${correctedSum}`);

}

main1();
