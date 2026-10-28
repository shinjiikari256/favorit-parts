import { stripVTControlCharacters } from "node:util";

const ICON = { passed: "✓", failed: "✘", timedOut: "✘", skipped: "-", interrupted: "!" };

/** Компактный reporter: только имена тестов (без проекта, файла и строки) и итог. */
export default class ShortReporter {
  onTestEnd(test, result) {
    const [, , , ...names] = test.titlePath();
    const seconds = (result.duration / 1000).toFixed(1);
    console.log(`${ICON[result.status] ?? "?"} ${names.join(" › ")} (${seconds}s)`);
    for (const { message } of result.errors)
      console.log(stripVTControlCharacters(message ?? "").replace(/^/gm, "    "));
  }

  onEnd(result) {
    console.log(`\n${result.status}`);
  }

  printsToStdio() {
    return true;
  }
}
