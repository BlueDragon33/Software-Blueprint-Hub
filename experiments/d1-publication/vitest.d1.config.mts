import {defineConfig} from "vitest/config";
export default defineConfig({test:{include:["experiments/d1-publication/tests/*.test.ts"],fileParallelism:false,testTimeout:15000,hookTimeout:15000}});
