
const DONT_INSTR = `don't()`;
const DO_INSTR = `do()`;
const MUL_INSTR = 'mul(';
const NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function isMatch(s: string, c: number, word: string): boolean {
  return s.substring(c, c + word.length) === word;
}

/**
 * Returns a number AS A STRING read from the given string starting at index i
 * until the first non-numeral character. Can return an empty string.
 */
function readNumber(s: string, i: number): string {
  let numerals: string = '';
  for (let c = i; c < s.length; ++c) {
    if (!NUMERALS.includes(s[c])) break;
    numerals += s[c];
  }
  return numerals;
}

async function main() {
  const inputTxt = await Deno.readTextFile('./03/input.txt');
  let total = 0;
  let mulsEnabled = true;
  for (let c = 0; c < inputTxt.length; ++c) {
    if (mulsEnabled) {
      // We found a potential mul(x, y) instruction.
      if (isMatch(inputTxt, c, MUL_INSTR)) {
        // Advance to the end of "mul(".
        c += MUL_INSTR.length;

        // Now we should see 1-or-more numerals. If not, it's not valid.
        const firstNumStr = readNumber(inputTxt, c);
        if (firstNumStr === '') continue;
        const firstNum = parseInt(firstNumStr, 10);
        c += firstNumStr.length;

        // Now we should see a comma, otherwise it's invalid.
        if (inputTxt[c] !== ',') continue;
        c += 1;

        // Now we should see a second number, otherwise it's invalid.
        const secondNumStr = readNumber(inputTxt, c);
        if (secondNumStr === '') continue;
        const secondNum = parseInt(secondNumStr, 10);
        c += secondNumStr.length;

        // Now we should see an end parens, otherwise it's invalid.
        if (inputTxt[c] !== ')') continue;

        // Do not advance one character, since the for-loop itself will do that.

        //console.log(`Valid mul() instruction: mul(${firstNum},${secondNum})`);
        total += (firstNum * secondNum);
      } // if MUL_INSTR
      else if (isMatch(inputTxt, c, DONT_INSTR)) {
        mulsEnabled = false;
        // Minus one because the for-loop will advance by 1.
        c += DONT_INSTR.length - 1;
      }
    } // if (mulsEnabled)
    // Muls not enabled, we are looking for a do().
    else {
      if (isMatch(inputTxt, c, DO_INSTR)) {
        mulsEnabled = true;
        // Minus one because the for-loop will advance by 1.
        c += DO_INSTR.length - 1;
      }
    }
  }
  console.log(`Sum of all multiplications = ${total}`);
}

main();
