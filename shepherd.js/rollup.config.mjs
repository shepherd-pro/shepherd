import autoprefixer from 'autoprefixer';
import { execaCommand } from 'execa';
import fs from 'fs';
import path from 'node:path';
// import { globSync } from 'glob';
import { fileURLToPath } from 'node:url';
import cssnanoPlugin from 'cssnano';
import { babel } from '@rollup/plugin-babel';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import filesize from 'rollup-plugin-filesize';
import license from 'rollup-plugin-license';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import sveltePreprocess from 'svelte-preprocess';
import svelte from 'rollup-plugin-svelte';
import { visualizer } from 'rollup-plugin-visualizer';
import { emitDts } from 'svelte2tsx';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const banner = ['/*!', pkg.name, pkg.version, '*/\n'].join(' ');

const env = process.env.DEVELOPMENT ? 'development' : 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plugins = [
  svelte({
    preprocess: sveltePreprocess({
      typescript: true
    }),
    emitCss: true
  }),
  nodeResolve({
    browser: true,
    exportConditions: ['svelte'],
    extensions: ['.js', '.json', '.mjs', '.svelte', '.ts'],
    modulesOnly: true
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(env)
  }),
  babel({
    extensions: ['.cjs', '.js', '.ts', '.mjs', '.html', '.svelte']
  }),
  postcss({
    plugins: [autoprefixer, cssnanoPlugin],
    extract: 'css/shepherd.css'
  }),
  license({
    banner
  }),
  filesize(),
  visualizer()
];

// If we are running with --environment DEVELOPMENT, serve via browsersync for local development
if (process.env.DEVELOPMENT) {
  plugins.push(
    serve({ contentBase: ['.', 'dist', '../test/cypress/dummy'], open: true })
  );
  plugins.push(livereload());
}

// TODO: one day try to ship multiple files instead of one big one
// const inputFiles = Object.fromEntries(
//   globSync('src/**/*.{svelte,ts}').map((file) => [
//     // This remove `src/` as well as the file extension from each
//     // file, so e.g. src/nested/foo.js becomes nested/foo
//     path.relative(
//       'src',
//       file.slice(0, file.length - path.extname(file).length)
//     ),
//     // This expands the relative paths to absolute paths, so e.g.
//     // src/nested/foo becomes /project/src/nested/foo.js
//     fileURLToPath(new URL(file, import.meta.url))
//   ])
// );

export default [
  {
    input: 'src/shepherd.ts', // inputFiles,

    output: {
      dir: 'dist/esm',
      entryFileNames: (chunkInfo) => {
        const isSvelte = chunkInfo.facadeModuleId.endsWith('svelte');
        return `${chunkInfo.name}${isSvelte ? '.svelte' : '.mjs'}`;
      },
      format: 'es',
      sourcemap: true
    },
    plugins: [
      ...plugins,
      {
        name: 'Build Declarations',
        closeBundle: async () => {
          console.log('Generating Svelte declarations for ESM');

          await emitDts({
            svelteShimsPath: import.meta.resolve(
              'svelte2tsx/svelte-shims-v4.d.ts'
            ),
            declarationDir: 'tmp/svelte'
          });

          console.log('Generating TSC declarations for ESM');

          await execaCommand(
            `pnpm tsc --module esnext --moduleResolution bundler --declarationDir dist/esm`,
            { stdio: 'inherit' }
          );

          fs.cpSync(
            path.join(__dirname, 'tmp/svelte/components'),
            path.join(__dirname, 'dist/esm/components'),
            { recursive: true }
          );
        }
      }
    ]
  },
  {
    input: 'src/shepherd.ts', // inputFiles,

    output: {
      dir: 'dist/cjs',
      entryFileNames: (chunkInfo) => {
        const isSvelte = chunkInfo.facadeModuleId.endsWith('svelte');
        return `${chunkInfo.name}${isSvelte ? '.svelte' : '.cjs'}`;
      },
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      ...plugins,
      {
        name: 'Build Declarations',
        closeBundle: async () => {
          console.log('Generating Svelte declarations for CJS');

          await emitDts({
            svelteShimsPath: import.meta.resolve(
              'svelte2tsx/svelte-shims-v4.d.ts'
            ),
            declarationDir: 'tmp/svelte'
          });

          console.log('Generating TSC declarations for CJS');

          await execaCommand(
            `pnpm tsc --module commonjs --moduleResolution node10 --declarationDir dist/cjs --verbatimModuleSyntax false`,
            { stdio: 'inherit' }
          );

          console.log('Copy over Svelte declaration files');

          fs.cpSync(
            path.join(__dirname, 'tmp/svelte/components'),
            path.join(__dirname, 'dist/cjs/components'),
            { recursive: true }
          );

          console.log('Rename .d.ts to .d.cts');

          await execaCommand(`renamer --find .ts --replace .cts dist/cjs/**`, {
            stdio: 'inherit'
          });

          console.log('Fix CJS export default -> export =');

          const declarationFile = path.join(
            __dirname,
            'dist/cjs',
            'shepherd.d.cts'
          );
          let content = fs.readFileSync(declarationFile, 'utf8');
          content = content.replace(
            /export default Shepherd/g,
            'export = Shepherd'
          );
          fs.writeFileSync(declarationFile, content);
        }
      }
    ]
  }
];
