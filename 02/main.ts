
enum Mode {
  INCREASING = 'INCREASING',
  DECREASING = 'DECREASING',
  FLAT = 'FLAT',
}

function getLevelMode(prevLevel: number, curLevel: number): Mode {
  if (curLevel > prevLevel) return Mode.INCREASING;
  else if (curLevel < prevLevel) return Mode.DECREASING;
  return Mode.FLAT;
}

function isGradual(prevLevel: number, curLevel: number): boolean {
  const diff = Math.abs(prevLevel - curLevel);
  const gradual = (diff >= 1 && diff <= 3);
  return gradual;
}

/**
 * Checks a report's safety, ensuring the levels are always gradually increasing
 * or decreasing.
 */
function isReportSafe(levels: number[]): boolean {
  try {
    if (levels.length < 2) throw 'Not enough levels in report';
    for (let i = 0; i < levels.length; ++i) {
      if (i >= 1) {
        if (!isGradual(levels[i-1], levels[i])) return false;
        const curMode = getLevelMode(levels[i-1], levels[i]);
        if (curMode === Mode.FLAT) return false;
        if (i > 1) {
          const prevMode = getLevelMode(levels[i-2], levels[i-1]);
          if (prevMode !== curMode) return false;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  return true;
}

async function mainA() {
  const reports = (await Deno.readTextFile('input.txt')).split(/\r?\n/);
  let numSafeReports = 0;
  let numDampenedSafeReports = 0;
  for (const report of reports) {
    const levels = report.split(/\s+/).map(s => parseInt(s));
    if (isReportSafe(levels)) {
      numSafeReports++;
    } else {
      // Check if any level can be removed to make it safe.
      for (let i = 0; i < levels.length; ++i) {
        const dampenedReport = [...levels];
        dampenedReport.splice(i, 1);
        if (isReportSafe(dampenedReport)) {
          numDampenedSafeReports++;
          break;
        }
      }
    }
  } // For each report
  console.log(`# of safe reports = ${numSafeReports}`);
  console.log(`# of safe reports with Problem Dampener = ${numSafeReports + numDampenedSafeReports}`);
}

mainA();
