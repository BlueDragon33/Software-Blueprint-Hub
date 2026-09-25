import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { compile } from "json-schema-to-typescript";

const root = process.cwd();
const source = resolve(root, "schemas/vertical-slice.contracts.v1.json");
const target = resolve(
  root,
  "packages/contracts/src/generated/vertical-slice.ts"
);

const schema = JSON.parse(await readFile(source, "utf8"));
const generated = await compile(
  { ...schema, title: "VerticalSliceContracts" },
  "VerticalSliceContracts",
  {
    bannerComment:
      "/* AUTO-GENERATED FROM schemas/vertical-slice.contracts.v1.json. DO NOT EDIT BY HAND. */",
    unreachableDefinitions: true,
    style: {
      singleQuote: false,
      semi: true,
      tabWidth: 2,
      useTabs: false
    }
  }
);

await mkdir(dirname(target), { recursive: true });
await writeFile(target, generated, "utf8");
console.log("Generated contract types:", target);
