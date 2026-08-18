// A minimal glob matcher for manifest patterns: `*` within a segment, `**` across
// segments, `?` for one character. No dependency, no surprises.
const cache = new Map();

function compile(pattern) {
  const cached = cache.get(pattern);
  if (cached) return cached;

  let source = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === '*' && pattern[i + 1] === '*') {
      i += 1;
      if (pattern[i + 1] === '/') {
        i += 1;
        source += '(?:.*/)?';
      } else {
        source += '.*';
      }
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else if ('.+^${}()|[]\\'.includes(char)) {
      source += `\\${char}`;
    } else {
      source += char;
    }
  }

  const regex = new RegExp(`^${source}$`);
  cache.set(pattern, regex);
  return regex;
}

export const matches = (path, pattern) => compile(pattern).test(path);
