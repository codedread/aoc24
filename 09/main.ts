interface FileBlock {
  /** A sequential number. */
  blockId: number;
  /** Pointer back to file. */
  file: File;
}

class File {
  /** A list of all its blocks, in order. */
  blocks: FileBlock[];
  constructor(public fileId: number, numBlocks: number) {
    this.blocks = [];
    for (let i = 0; i < numBlocks; ++i) {
      this.blocks.push({blockId: i, file: this});
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
      const newFile = new File(nextFileId, numFileBlocks);
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
        const lastSlotContents = this.slots[lastNonEmptyPos].contents;
        this.slots[lastNonEmptyPos].contents = null;
        this.slots[pos].contents = lastSlotContents;

        // ... and then find the last non-empty slot.
        while (!this.slots[lastNonEmptyPos].contents) {
          lastNonEmptyPos--;
        }
      }
    }
  }
}

async function main1(filename: string) {
  const diskMap = await Deno.readTextFile(filename);
  console.log(`Disk map is ${diskMap.length} characters long`);
  const fs = new FileSystem(diskMap);
  fs.compactFiles();
  console.log(`File system compacted. Checksum is ${fs.checksum()}`);
}

main1('./09/input.txt');
