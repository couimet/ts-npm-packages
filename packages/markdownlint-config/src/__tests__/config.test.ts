import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const nodeRequire = createRequire(__filename);

const configPath = path.resolve(__dirname, '../../index.json');
const config = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;

const cli2Bin = path.join(path.dirname(nodeRequire.resolve('markdownlint-cli2')), 'markdownlint-cli2-bin.mjs');

describe('@couimet/markdownlint-config', () => {
  it('ships the couimet defaults', () => {
    expect(config.MD013).toBe(false);
    expect(config.MD024).toEqual({ siblings_only: true });
    expect(config.MD033).toBe(false);
  });

  it('enforces aligned table columns (MD060)', () => {
    expect(config.MD060).toEqual({ style: 'aligned' });
  });

  it('passes aligned tables and rejects misaligned ones', () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'markdownlint-config-'));
    try {
      writeFileSync(path.join(tmp, '.markdownlint-cli2.jsonc'), JSON.stringify({ config: { extends: configPath } }));
      const aligned = path.join(tmp, 'aligned.md');
      const misaligned = path.join(tmp, 'misaligned.md');
      writeFileSync(aligned, '# Fixture\n\n| Name  | Value |\n| ----- | ----- |\n| alpha | 1     |\n');
      writeFileSync(misaligned, '# Fixture\n\n| Name  | Value |\n| ----- | ----- |\n| alpha | 1 |\n');
      expect(() => execFileSync(process.execPath, [cli2Bin, aligned], { cwd: tmp })).not.toThrow();
      expect(() => execFileSync(process.execPath, [cli2Bin, misaligned], { cwd: tmp })).toThrow();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('auto-aligns misaligned tables with --fix when MD060A is registered', () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'markdownlint-config-'));
    try {
      const rulePath = nodeRequire.resolve('markdownlint-rule-force-align-table-columns');
      writeFileSync(path.join(tmp, '.markdownlint-cli2.jsonc'), JSON.stringify({ customRules: [rulePath], config: { extends: configPath } }));
      const file = path.join(tmp, 'misaligned.md');
      writeFileSync(file, '# Fixture\n\n| Name | Value |\n| ---- | ----- |\n| alpha | 1 |\n');
      execFileSync(process.execPath, [cli2Bin, '--fix', file], { cwd: tmp });
      expect(readFileSync(file, 'utf8')).toBe('# Fixture\n\n| Name  | Value |\n| ----- | ----- |\n| alpha | 1     |\n');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('ships a default cli2 config that enforces aligned tables without auto-fix', () => {
    const defaultFile = path.join(path.dirname(configPath), 'markdownlint-cli2.jsonc');
    expect(readFileSync(defaultFile, 'utf8')).not.toContain('customRules');
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'markdownlint-config-'));
    try {
      const file = path.join(tmp, 'misaligned.md');
      writeFileSync(file, '# Fixture\n\n| Name | Value |\n| ---- | ----- |\n| alpha | 1 |\n');
      expect(() => execFileSync(process.execPath, [cli2Bin, '--config', defaultFile, file], { cwd: tmp })).toThrow();
      expect(() => execFileSync(process.execPath, [cli2Bin, '--config', defaultFile, '--fix', file], { cwd: tmp })).toThrow();
      expect(readFileSync(file, 'utf8')).toBe('# Fixture\n\n| Name | Value |\n| ---- | ----- |\n| alpha | 1 |\n');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
