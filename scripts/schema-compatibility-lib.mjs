function asSet(value) {
  return new Set(Array.isArray(value) ? value : []);
}

function sameType(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function findBreakingChanges(baseline, current) {
  const changes = [];

  function compareNode(before, after, path) {
    if (!after) {
      changes.push(`${path}: schema node removed`);
      return;
    }

    if (!sameType(before.type, after.type)) {
      changes.push(`${path}: type changed`);
    }

    if (Object.hasOwn(before, "const") && before.const !== after.const) {
      changes.push(`${path}: const changed`);
    }

    if (Array.isArray(before.enum)) {
      const afterEnum = asSet(after.enum);
      for (const value of before.enum) {
        if (!afterEnum.has(value)) {
          changes.push(`${path}: enum value removed: ${JSON.stringify(value)}`);
        }
      }
    }

    const beforeRequired = asSet(before.required);
    const afterRequired = asSet(after.required);
    for (const name of afterRequired) {
      if (!beforeRequired.has(name)) {
        changes.push(`${path}: property became required: ${name}`);
      }
    }

    const beforeProperties = before.properties ?? {};
    const afterProperties = after.properties ?? {};
    for (const [name, child] of Object.entries(beforeProperties)) {
      if (!Object.hasOwn(afterProperties, name)) {
        changes.push(`${path}/properties/${name}: property removed`);
        continue;
      }
      compareNode(child, afterProperties[name], `${path}/properties/${name}`);
    }

    if (before.additionalProperties !== false && after.additionalProperties === false) {
      changes.push(`${path}: additionalProperties became false`);
    }

    if (
      typeof before.pattern === "string" &&
      typeof after.pattern === "string" &&
      before.pattern !== after.pattern
    ) {
      changes.push(`${path}: pattern changed`);
    }

    if (
      typeof before.format === "string" &&
      typeof after.format === "string" &&
      before.format !== after.format
    ) {
      changes.push(`${path}: format changed`);
    }

    if (before.uniqueItems !== true && after.uniqueItems === true) {
      changes.push(`${path}: uniqueItems became true`);
    }

    const tighteningRules = [
      ["minLength", (a, b) => b > a],
      ["minimum", (a, b) => b > a],
      ["minItems", (a, b) => b > a],
      ["maxLength", (a, b) => b < a],
      ["maximum", (a, b) => b < a],
      ["maxItems", (a, b) => b < a]
    ];

    for (const [key, isTighter] of tighteningRules) {
      if (
        typeof before[key] === "number" &&
        typeof after[key] === "number" &&
        isTighter(before[key], after[key])
      ) {
        changes.push(`${path}: ${key} tightened`);
      }
    }
  }

  compareNode(baseline, current, "#");

  const beforeDefs = baseline.$defs ?? {};
  const afterDefs = current.$defs ?? {};

  for (const [name, definition] of Object.entries(beforeDefs)) {
    if (!Object.hasOwn(afterDefs, name)) {
      changes.push(`#/$defs/${name}: definition removed`);
      continue;
    }
    compareNode(definition, afterDefs[name], `#/$defs/${name}`);
  }

  return changes;
}

export function migrationEvidenceRequired(changes) {
  return changes.length > 0;
}
