import type { JestConfigWithTsJest } from "ts-jest";
import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const config: JestConfigWithTsJest = {
    preset: "ts-jest",
    testEnvironment: "./tests/CustomEnvironment.ts",
    roots: [
        "./tests/"
    ],
    modulePaths: [ compilerOptions.baseUrl ],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths)
};

export default config;
