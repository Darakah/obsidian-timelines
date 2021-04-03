import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import styles from "rollup-plugin-styles";

export default {
    input: './src/main.ts',
    output: {
        dir: '.',
        sourcemap: 'inline',
        format: 'cjs',
        exports: 'default'
    },
    external: ['obsidian'],
    plugins: [
        typescript(),
        styles(),
        nodeResolve({ browser: true }),
        commonjs(),
    ]
};