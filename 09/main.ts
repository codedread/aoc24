interface FileBlock {
  /** A sequential number. */
  blockId: number;
  /** Pointer back to file. */
  file: File;
  /** Which slot number this block is in. */
  slotNumber: number;
}

class File {
  /** A list of all its blocks, in order. */
  blocks: FileBlock[];
  constructor(public fileId: number, numBlocks: number, startingSlot: number) {
    this.blocks = [];
    for (let i = 0; i < numBlocks; ++i) {
      this.blocks.push({blockId: i, file: this, slotNumber: startingSlot + i});
    }
  }
}

interface FileSystemSlot {
  contents: FileBlock|null;
}

class FileSystem {
  files: File[] = [];
  slots: (FileSystemSlot)[] = [];

  constructor(diskMap: string) {
    let nextFileId = 0;
    for (let i = 0; i < diskMap.length; i += 2) {
      const numFileBlocks = parseInt(diskMap[i]);
      const newFile = new File(nextFileId, numFileBlocks, this.slots.length);
      nextFileId++;
      this.files.push(newFile);
      for (const block of newFile.blocks) {
        this.slots.push({contents: block});
      }
      if (i < diskMap.length - 1) {
        const numEmptyBlocks = parseInt(diskMap[i + 1]);
        for (let j = 0; j < numEmptyBlocks; ++j) {
          this.slots.push({contents: null});
        }        
      }
    }
    console.log(`File system with ${this.files.length} files and ${this.slots.length} slots`);
  }

  checksum(): number {
    let cksum = 0;
    for (let pos = 0; pos < this.slots.length; ++pos) {
      const slot = this.slots[pos];
      if (slot.contents) {
        cksum += pos * slot.contents.file.fileId;
      }
    }
    return cksum;
  }

  compactFiles() {
    let lastNonEmptyPos = this.slots.findLastIndex(s => s.contents);
    if (lastNonEmptyPos < 0) throw 'Bad bad bad';
    for (let pos = 0; pos < this.slots.length; ++pos) {
      if (pos >= lastNonEmptyPos) break;
      const slot = this.slots[pos];
      // Swap this empty slot with the last non-empty one...
      if (!slot.contents) {
        this.swapSlots(pos, lastNonEmptyPos);

        // ... and then find the last non-empty slot.
        while (!this.slots[lastNonEmptyPos].contents) {
          lastNonEmptyPos--;
        }
      }
    }
  }

  compactFilesNoDefrag() {
    for (let fileId = this.files.length - 1; fileId >= 0; --fileId) {
      const fileToTryAndMove = this.files[fileId];
      const firstSlot = fileToTryAndMove.blocks[0].slotNumber;
      const fileBlockLength = fileToTryAndMove.blocks.length;
      const emptySlotAvail = this.findEmptySlots(fileBlockLength, firstSlot);
      if (emptySlotAvail === -1) continue;

      for (let b = 0; b < fileToTryAndMove.blocks.length; ++b) {
        const block = fileToTryAndMove.blocks[b];
        this.swapSlots(block.slotNumber, emptySlotAvail + b);
      }
    }
  }

  /**
   * Returns the left-most empty slot number that will fit a file of length n,
   * or returns -1 if no contiguous empty slots exist. stopSlot is used to
   * stop searching the entire file system.
   */
  findEmptySlots(n: number, stopSlot: number): number {
    let i = 0;
    while (i++ < stopSlot) {
      let emptySlotsNeeded = n;
      let j = i;
      while (emptySlotsNeeded > 0 && !this.slots[j].contents) {
        emptySlotsNeeded--;
        j++;
      }
      if (emptySlotsNeeded === 0) {
        return i;
      }
    }
    return -1;
  }

  /** Swaps the contents of the two slots. */
  swapSlots(pos1: number, pos2: number) {
    const pos1Contents = this.slots[pos1].contents;
    this.slots[pos1].contents = this.slots[pos2].contents;
    this.slots[pos2].contents = pos1Contents;
    if (this.slots[pos1].contents) this.slots[pos1].contents.slotNumber = pos1;
    if (this.slots[pos2].contents) this.slots[pos2].contents.slotNumber = pos2;
  }
}

async function main1(filename: string) {
  const diskMap = await Deno.readTextFile(filename);
  console.log(`Disk map is ${diskMap.length} characters long`);
  const fs = new FileSystem(diskMap);
  fs.compactFiles();
  console.log(`File system compacted. Checksum is ${fs.checksum()}`);
}

async function main2(filename: string) {
  const diskMap = await Deno.readTextFile(filename);
  console.log(`Disk map is ${diskMap.length} characters long`);
  const fs = new FileSystem(diskMap);
  fs.compactFilesNoDefrag();
  console.log(`File system compacted. Checksum is ${fs.checksum()}`);
}

main2('./09/input.txt');
