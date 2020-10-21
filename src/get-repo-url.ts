import path from "path";

/** Get URL for any asset from a repo */
export function repoAssetURL(
  url: string,
  filepath: string,
  version?: string
): string | undefined {
  let sanitizedURL = repoURL(url);
  // @ts-ignore this is a real thing
  const { hostname, pathname } = new URL(sanitizedURL);

  switch (hostname) {
    case "bitbucket.org": {
      return `https://bitbucket.org${path.join(
        "/",
        pathname,
        version || "HEAD",
        filepath
      )}`;
    }
    case "github.com": {
      const [repo, dir] = pathname.split("/tree/");
      return `https://raw.githubusercontent.com${path.join(
        "/",
        repo,
        version || "HEAD",
        dir ? dir.replace(/[^/]+/, "") : "",
        filepath
      )}`;
    }
    case "gitlab.com": {
      return `https://gitlab.com${path.join(
        "/",
        pathname,
        "-",
        "raw",
        version || "HEAD",
        filepath
      )}`;
    }
    default: {
      return undefined; // Dunno what this is; return as-is
    }
  }
}

/** Turn repo URL into normal URL */
export function repoURL(url: string): string {
  return url
    .trim()
    .replace(/^git\+/i, "")
    .replace(/\.git$/i, "")
    .replace(/git@/, "")
    .replace(/(bitbucket|github|gitlab)\.([a-z]+):/, "$1.$2/")
    .replace(/bitbucket:/, "$1.org/")
    .replace(/(github|gitlab):/, "$1.com/")
    .replace(/^(http\s*:\/\/|https\s*:\/\/|\/\/)?/, "https://");
}
