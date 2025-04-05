import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const lines: string[] = [];
const completed = new Set<string>();

const startedTaskLineRegex = /^(?:# )?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z Starting .* \(call\\?#(\d+)\) .*$/;
const completedTaskLineRegex = /^(?:# )?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z Completed \(call\\?#(\d+)\) .*$/;

rl.on('line', (line) => {
  lines.push(line);

  const completedMatch = completedTaskLineRegex.exec(line);
  if (completedMatch !== null) {
    const callNumber = completedMatch[1];
    completed.add(callNumber);
  }
});

rl.once('close', () => {
  for (const line of lines) {
    const startMatch = startedTaskLineRegex.exec(line);
    if (startMatch !== null) {
      const callNumber = startMatch[1];
      if (!completed.has(callNumber)) {
        console.log(line);
      }

      continue;
    }

    const completedMatch = completedTaskLineRegex.exec(line);
    if (completedMatch !== null) {
      const callNumber = completedMatch[1];
      if (!completed.has(callNumber)) {
        console.log(line);
      }

      continue;
    }

    console.log(line);
  }
});
