const { rmSync } = require("fs");
const { spawnSync } = require("child_process");

const command = "npx next build";

function runBuildAttempt() {
  rmSync(".next", { recursive: true, force: true });
  return spawnSync(command, { stdio: "inherit", shell: true });
}

const firstAttempt = runBuildAttempt();

if (firstAttempt.status === 0) {
  process.exit(0);
}

console.warn("Next build falhou. Repetindo uma vez para contornar erro intermitente...");

const retryAttempt = runBuildAttempt();
process.exit(retryAttempt.status ?? 1);
