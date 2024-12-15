
async function mainA() {
  const lines = (await Deno.readTextFile('input.txt')).split(/\r?\n/);
  const leftList: number[] = [];
  const rightList: number[] = [];
  const rightCountMap: Map<number, number> = new Map();
  for (const line of lines) {
    const splits = line.split(/\s+/);
    if (splits.length === 2) {
      const left = parseInt(splits[0], 10);
      const right = parseInt(splits[1], 10);
      leftList.push(left);
      rightList.push(right);

      if (!rightCountMap.has(right)) {
        rightCountMap.set(right, 0);
      }
      rightCountMap.set(right, rightCountMap.get(right)! + 1);
    }
  }

  leftList.sort();
  rightList.sort();

  if (leftList.length !== rightList.length) {
    throw `Bad list lengths: ${leftList.length}, ${rightList.length}`;
  }

  let totalDist = 0;
  let totalSimilarity = 0;
  for (let i = 0; i < leftList.length; ++i) {
    totalDist += Math.abs(leftList[i] - rightList[i]);
    if (rightCountMap.has(leftList[i])) {
      totalSimilarity += leftList[i] * rightCountMap.get(leftList[i])!;
    }
  }
  console.log(`Total distance = ${totalDist}`);
  console.log(`Total similarity = ${totalSimilarity}`);
}

mainA();
