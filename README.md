# tiny-stack-vm-01

A tiny stack virtual machine for the make.fun tiny-stack-vm-01 bounty.

[![make.fun · tiny-stack-vm-01](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

main.ts interprets make.fun's tiny stack ISA: 32-bit wrapping arithmetic,
a 256-value stack, 64-deep calls, 256 words of memory, the ten traps, and
the step and output limits, mirroring the reference VM's check order.
