import fs from 'fs';
import path from 'path';
import yargs from 'yargs-parser';
import * as colors from 'kleur/colors';
import { repoURL } from './get-repo-url';

function runCheck({ pass, title, url }) {
  try {
    const result = pass();
    if (result) {
      console.error(colors.green(`✓`) + colors.dim(` ${title}`));

    } else if (!result) {
      console.error(colors.red(`✖ ${title}`));
      console.error('');
      console.error(colors.red('check failed:'), title);
      console.error(colors.red('  how to fix:'), url);
      process.exit(1);
    }
  } catch (err) {
    console.error('run failed (internal tool error, please report this!)');
    throw err;
  }
}

export async function cli(args: string[]) {
  const cliFlags = yargs(args, {});
  const cwd = cliFlags.cwd ? path.resolve(cliFlags.cwd) : process.cwd();
  const files = fs.readdirSync(cwd);

  // Check: Has a package.json
  runCheck({
    title: 'package.json',
    url: 'https://docs.skypack.dev/package-authors/package-checks#esm',
    pass: () => {
      return !!files.includes('package.json');
    },
  });

  // Load package.json
  const pkg = await fs.promises
    .readFile(path.join(cwd, 'package.json'), {
      encoding: 'utf-8',
    })
    .then((packageJsonContents) => JSON.parse(packageJsonContents));

  // Check: Has ESM
  runCheck({
    title: 'ES Module Entrypoint',
    url: 'https://docs.skypack.dev/package-authors/package-checks#esm',
    pass: () => {
      if (pkg.type === 'module') {
        return true;
      }
      if (pkg.module) {
        return true;
      }
      if (typeof pkg.main === 'string' && pkg.main.endsWith('.mjs')) {
        return true;
      }
      if (
        pkg.exports &&
        (pkg.exports['import'] ||
          !!Object.values(pkg.exports).find(
            (x: any) => typeof x === 'object' && x.import,
          ))
      ) {
        return true;
      }
      return false;
    },
  });
  // Check: Export Map
  runCheck({
    title: 'Export Map',
    url: 'https://docs.skypack.dev/package-authors/package-checks#export-map',
    pass: () => {
      return !!pkg.exports;
    },
  });
  // Check: Has "files"
  runCheck({
    title: 'No Unnecessary Files',
    url: 'https://docs.skypack.dev/package-authors/package-checks#files',
    pass: () => {
      return !!pkg.files || !!files.includes('.npmignore');
    },
  });
  // Check: Has "keywords"
  runCheck({
    title: 'Keywords',
    url: 'https://docs.skypack.dev/package-authors/package-checks#keywords',
    pass: () => {
      return !!pkg.keywords;
    },
  });
  // Check: Has "keywords"
  runCheck({
    title: 'Keywords (Empty)',
    url: 'https://docs.skypack.dev/package-authors/package-checks#keywords',
    pass: () => {
      return !!pkg.keywords.length;
    },
  });
  // Check: Has "license"
  runCheck({
    title: 'License',
    url: 'https://docs.skypack.dev/package-authors/package-checks#license',

    pass: () => {
      return !!pkg.license;
    },
  });
  // Check: Has "repository url"
  runCheck({
    title: 'Repository URL',
    url: 'https://docs.skypack.dev/package-authors/package-checks#repository',
    pass: () => {
      let repositoryUrl: string | undefined;
      if (!pkg.repository) {
        return false;
      }
      if (typeof pkg.repository === 'string') {
        return true;
      }
      if (pkg.repository.url) {
        return !!new URL(repoURL(pkg.repository.url));
      }
      return false;
    },
  });
  // Check: Has types
  runCheck({
    title: 'TypeScript Types',
    url: 'https://docs.skypack.dev/package-authors/package-checks#types',
    pass: () => {
      const isOk = !!pkg.types || !!pkg.typings || !!pkg.typesVersions;
      if (isOk) {
        return true;
      }
      if (files.includes('index.d.ts')) {
        console.error(
          colors.yellow(
            '"./index.d.ts" file found, but package.json "types" entry is missing.',
          ),
        );
        console.error(
          colors.yellow(
            'Learn more about why this is still required: https://github.com/skypackjs/package-check/issues/6#issuecomment-714840634',
          ),
        );
        return false;
      }
      return false;
    },
  });
  // Check: Has "README"
  runCheck({
    title: 'README',
    url: 'https://docs.skypack.dev/package-authors/package-checks#readme',
    pass: () => {
      return !!files.find((f) => /^readme\.?/i.test(f));
    },
  });

  console.error('');
    console.error(
    colors.green(`[100/100] ${pkg.name} passes all quality checks.`),
  );
}
