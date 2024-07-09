const { exec } = require('child_process');
const inputFile = process.env.INPUT_FILE;
const outputFile = process.env.OUTPUT_FILE;

if (!inputFile || !outputFile) {
  console.error('Please provide INPUT_FILE and OUTPUT_FILE environment variables.');
  process.exit(1);
}

const command = `npx uglifyjs ${inputFile} -o ${outputFile}`;

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error executing command: ${err}`);
    return;
  }
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});
