#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const skillsDir = path.resolve(process.cwd(), 'skills');
const errors = [];

function frontmatter(text, file) {
  const normalized = text.replaceAll('\r\n', '\n');
  if (!normalized.startsWith('---\n')) {
    errors.push(`${file}: missing opening YAML frontmatter delimiter`);
    return null;
  }

  const closing = normalized.indexOf('\n---\n', 4);
  if (closing < 0) {
    errors.push(`${file}: missing closing YAML frontmatter delimiter`);
    return null;
  }
  return normalized.slice(4, closing);
}

function yamlField(source, key) {
  const lines = source.split('\n');
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index < 0) return null;

  const inline = lines[index].slice(key.length + 1).trim();
  if (inline && inline !== '>' && inline !== '|') {
    return inline.replace(/^(['"])(.*)\1$/, '$2').trim();
  }

  const continuation = [];
  for (const line of lines.slice(index + 1)) {
    if (line && !/^\s/.test(line)) break;
    if (line.trim()) continuation.push(line.trim());
  }
  return continuation.join(' ').trim();
}

const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

for (const directory of skillDirs) {
  const skillFile = path.join(skillsDir, directory.name, 'SKILL.md');
  const relative = path.relative(process.cwd(), skillFile);
  if (!fs.existsSync(skillFile)) {
    errors.push(`${relative}: missing SKILL.md`);
    continue;
  }

  const metadata = frontmatter(fs.readFileSync(skillFile, 'utf8'), relative);
  if (metadata === null) continue;

  const name = yamlField(metadata, 'name');
  const description = yamlField(metadata, 'description');
  if (!name) errors.push(`${relative}: frontmatter requires a non-empty name`);
  if (!description) errors.push(`${relative}: frontmatter requires a non-empty description`);
  if (name && name !== directory.name) {
    errors.push(`${relative}: name "${name}" must match directory "${directory.name}"`);
  }
  if (name && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 63)) {
    errors.push(`${relative}: name must be lowercase kebab-case and at most 63 characters`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Validated ${skillDirs.length} portable skill definition(s).`);
