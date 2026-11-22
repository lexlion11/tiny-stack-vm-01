// tiny-stack-vm-01: an interpreter for make.fun's tiny stack ISA (ISA.md v1).
// Semantics mirror the reference vm.mjs exactly: same check order, same traps.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const STACK_MAX = 256, CALLS_MAX = 64, MEM_WORDS = 256, STEP_LIMIT = 1_000_000, OUTPUT_MAX = 65_536;

// opcode -> [immediate bytes, pops, pushes]
const OPS = {
  0x00: [0, 0, 0], 0x01: [1, 0, 1], 0x02: [4, 0, 1], 0x03: [0, 1, 0],
  0x04: [0, 1, 2], 0x05: [0, 2, 2], 0x06: [0, 2, 3], 0x07: [0, 3, 3],
  0x10: [0, 2, 1], 0x11: [0, 2, 1], 0x12: [0, 2, 1], 0x13: [0, 2, 1],
  0x14: [0, 2, 1], 0x15: [0, 2, 1], 0x16: [0, 2, 1], 0x17: [0, 1, 1],
  0x18: [0, 2, 1], 0x19: [0, 2, 1], 0x1a: [0, 2, 1], 0x1b: [0, 1, 1],
  0x1c: [0, 2, 1], 0x1d: [0, 2, 1], 0x1e: [0, 2, 1], 0x20: [0, 2, 1],
  0x21: [0, 2, 1], 0x22: [0, 2, 1], 0x30: [2, 0, 0], 0x31: [2, 1, 0],
  0x32: [2, 1, 0], 0x33: [2, 0, 0], 0x34: [0, 0, 0], 0x40: [0, 1, 1],
  0x41: [0, 2, 0], 0x50: [0, 1, 0], 0x51: [0, 1, 0], 0x52: [0, 0, 1],
  0x53: [0, 1, 0],
};
// two-operand arithmetic ( a b -- r ): opcodes 0x10..0x16, 0x18..0x22
const TWO = new Set([
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x18, 0x19, 0x1a,
  0x1c, 0x1d, 0x1e, 0x20, 0x21, 0x22,
]);

// Runs program bytes on input bytes; returns { stdout: number[], exit }.
function run(program, input) {
  const n = program.length;
  const D = new Int32Array(STACK_MAX);
  let sp = 0;
  const C = new Int32Array(CALLS_MAX);
  let csp = 0;
  const M = new Int32Array(MEM_WORDS);
  const out = [];
  let olen = 0;
  let inPos = 0;
  let pc = 0;
  let steps = 0;

  for (;;) {
    if (steps === STEP_LIMIT) return { stdout: out, exit: 10 };
    if (pc < 0 || pc >= n) return { stdout: out, exit: 9 };
    const code = program[pc];
    const op = OPS[code];
    if (op === undefined) return { stdout: out, exit: 5 };
    const [imm, pops, pushes] = op;
    if (pc + imm >= n) return { stdout: out, exit: 9 };
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return { stdout: out, exit: 2 };
    if (sp - pops + pushes > STACK_MAX) return { stdout: out, exit: 3 };
    pc = next;
    const b = D[sp - 1], a = D[sp - 2];
    let r = 0;
    switch (code) {
      case 0x00: return { stdout: out, exit: 0 };
      case 0x01: D[sp++] = (program[next - 1] << 24) >> 24; break;
      case 0x02:
        D[sp++] = program[next - 4] | (program[next - 3] << 8) | (program[next - 2] << 16) | (program[next - 1] << 24);
        break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: D[sp - 1] = D[sp - 2]; D[sp - 2] = b; break;
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: { const t = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = t; break; }
      case 0x10: r = (a + b) | 0; break;
      case 0x11: r = (a - b) | 0; break;
      case 0x12: r = Math.imul(a, b); break;
      case 0x13:
        if (b === 0) return { stdout: out, exit: 4 };
        r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
        break;
      case 0x14:
        if (b === 0) return { stdout: out, exit: 4 };
        r = b === -1 ? 0 : a % b | 0;
        break;
      case 0x15:
        if (b === 0) return { stdout: out, exit: 4 };
        r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
        break;
      case 0x16:
        if (b === 0) return { stdout: out, exit: 4 };
        r = (a >>> 0) % (b >>> 0) | 0;
        break;
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x18: r = a & b; break;
      case 0x19: r = a | b; break;
      case 0x1a: r = a ^ b; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x1c: r = a << (b & 31); break;
      case 0x1d: r = a >> (b & 31); break;
      case 0x1e: r = (a >>> (b & 31)) | 0; break;
      case 0x20: r = a === b ? 1 : 0; break;
      case 0x21: r = a < b ? 1 : 0; break;
      case 0x22: r = a >>> 0 < b >>> 0 ? 1 : 0; break;
      case 0x30: case 0x31: case 0x32: {
        const rel = ((program[next - 2] | (program[next - 1] << 8)) << 16) >> 16;
        let take = true;
        if (code !== 0x30) {
          const v = D[--sp];
          take = code === 0x31 ? v === 0 : v !== 0;
        }
        if (take) pc = next + rel;
        break;
      }
      case 0x33:
        if (csp === CALLS_MAX) return { stdout: out, exit: 7 };
        C[csp++] = next;
        pc = program[next - 2] | (program[next - 1] << 8);
        break;
      case 0x34:
        if (csp === 0) return { stdout: out, exit: 8 };
        pc = C[--csp];
        break;
      case 0x40:
        if (b < 0 || b >= MEM_WORDS) return { stdout: out, exit: 6 };
        D[sp - 1] = M[b];
        break;
      case 0x41:
        if (b < 0 || b >= MEM_WORDS) return { stdout: out, exit: 6 };
        sp -= 2;
        M[b] = a;
        break;
      case 0x50: {
        const s = String(D[sp - 1]);
        const bytes = [];
        for (let i = 0; i < s.length; i++) {
          const c = s.charCodeAt(i);
          if (c < 0x80) bytes.push(c);
          else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
          else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        }
        if (olen + bytes.length > OUTPUT_MAX) return { stdout: out, exit: 11 };
        sp--;
        for (let i = 0; i < bytes.length; i++) out[olen++] = bytes[i];
        break;
      }
      case 0x51:
        if (olen + 1 > OUTPUT_MAX) return { stdout: out, exit: 11 };
        out[olen++] = D[--sp] & 255;
        break;
      case 0x52: D[sp++] = inPos < input.length ? input[inPos++] : -1; break;
      case 0x53: return { stdout: out, exit: D[--sp] & 255 };
      default: break;
    }
    if (TWO.has(code)) {
      sp -= 2;
      D[sp++] = r;
    }
  }
}

const inDir = process.env.MAKEFUN_INPUT_DIR || '/input';
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
for (const id of readdirSync(inDir).sort()) {
  if (id.startsWith('.')) continue;
  const idIn = join(inDir, id), idOut = join(outDir, id);
  const program = readFileSync(join(idIn, 'program.bin'));
  let input = Buffer.alloc(0);
  try { input = readFileSync(join(idIn, 'input.bin')); } catch { /* empty input */ }
  const { stdout, exit } = run([...program], [...input]);
  mkdirSync(idOut, { recursive: true });
  writeFileSync(join(idOut, 'stdout.bin'), Buffer.from(stdout));
  writeFileSync(join(idOut, 'exit.txt'), String(exit) + '\n');
}
