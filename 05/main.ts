/** For a given page-number, all the pages that must be before and after it. */
class PageOrdering {
  beforeNums: Set<number> = new Set();
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
  //return !pages.some(page => ordering.afterNums.has(page));
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
    if (!updateIncorrectlyOrdered) correctlyOrderedUpdates.push(update);
  }

  console.log(`# correctly ordered updates = ${correctlyOrderedUpdates.length}`);
  let sum = 0;
  for (const u of correctlyOrderedUpdates) {
    const index = Math.floor(u.pages.length / 2);
    const middleValue = u.pages[index];
    sum += middleValue;
  }
  console.log(`sum of middle numbers in correctly ordered updates = ${sum}`);
}

main1();
