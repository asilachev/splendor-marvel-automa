// Difficulty simulator (#13): plays Thanos alone on the engine for each settings preset and
// prints the results as Markdown tables. The model and the results: docs/automa.md → Simulation.
//
//   npm run sim                            10,000 games per preset, seed 1
//   npm run sim -- --runs 1000 --seed 7    another number of games, or another seed
//
// The same arguments always print the same report.
import { parseArgs } from 'node:util'
import { formatReport, SIM_PRESETS, simulate } from '../src/engine/sim.ts'

const USAGE = 'Usage: npm run sim -- [--runs N] [--seed S]'

function fail(message: string): never {
  console.error(`${message}\n${USAGE}`)
  process.exit(1)
}

function readArgs() {
  try {
    return parseArgs({
      options: {
        runs: { type: 'string', default: '10000' },
        seed: { type: 'string', default: '1' },
      },
    }).values
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error))
  }
}

/** A whole number from the command line, or a message and exit. */
function wholeNumber(name: string, value: string, min: number, max: number): number {
  const n = Number(value)
  if (!/^\d+$/.test(value) || n < min || n > max) {
    fail(`--${name} must be a whole number from ${min} to ${max}, not "${value}"`)
  }
  return n
}

const args = readArgs()
const options = {
  runs: wholeNumber('runs', args.runs, 1, 1_000_000),
  seed: wholeNumber('seed', args.seed, 0, 2 ** 32 - 1),
}
process.stdout.write(
  formatReport(
    SIM_PRESETS.map((settings) => simulate(settings, options)),
    options,
  ),
)
