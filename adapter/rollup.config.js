import typescript from '@rollup/plugin-typescript';
import image from '@rollup/plugin-image';
import serve from 'rollup-plugin-serve';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-node-polyfills';

const showAddress = () => ({ 
    load: () => console.log('\x1b[35m%s\x1b[0m', `Current registry address: http://localhost:3002/dapplet.json`) 
});

export default [{
    input: 'src/index.ts',
    output: [{
        file: 'lib/index.js',
        format: 'cjs',
        exports: 'named'
    }],
    plugins: [
        typescript(), 
        json(),
        commonjs({ transformMixedEsModules: true }),
        nodePolyfills(),
        nodeResolve({ browser: true, preferBuiltins: false }),
        image(), 
        serve({ port: 3002 }),
        showAddress()
    ]
}];