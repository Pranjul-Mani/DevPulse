import { Octokit } from "octokit";

const getOctokit = (token) => {
  return new Octokit({ auth: token });
};

export const fetchRepoInfo = async (token, owner, repo) => {
  const octokit = getOctokit(token);
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
};

export const fetchRepoTree = async (token, owner, repo, branch = "main") => {
  const octokit = getOctokit(token);

  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: "true",
    });

    return data.tree
      .filter((item) => item.type === "blob")
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        size: item.size,
        type: item.type,
      }));
  } catch (error) {
    if (error.status === 409) {
      return [];
    }
    throw error;
  }
};

export const fetchFileContent = async (token, owner, repo, path, ref) => {
  const octokit = getOctokit(token);

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return data.content || "";
};

export const fetchAllFiles = async (token, owner, repo, branch = "main") => {
  const tree = await fetchRepoTree(token, owner, repo, branch);
  const codeExtensions = new Set([
    ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs",
    ".rb", ".php", ".c", ".cpp", ".h", ".hpp", ".cs", ".swift",
    ".kt", ".scala", ".vue", ".svelte", ".html", ".css", ".scss",
    ".json", ".yaml", ".yml", ".md", ".sql", ".sh", ".bash",
    ".toml", ".xml", ".graphql", ".prisma",
  ]);

  const codeFiles = tree.filter((file) => {
    const ext = "." + file.path.split(".").pop()?.toLowerCase();
    return (
      codeExtensions.has(ext) &&
      file.size < 100000 &&
      !file.path.includes("node_modules") &&
      !file.path.includes("dist/") &&
      !file.path.includes("build/") &&
      !file.path.includes(".min.") &&
      !file.path.includes("package-lock") &&
      !file.path.includes("yarn.lock")
    );
  });

  const files = [];
  const batchSize = 5;

  for (let i = 0; i < codeFiles.length; i += batchSize) {
    const batch = codeFiles.slice(i, i + batchSize);
    const contents = await Promise.all(
      batch.map(async (file) => {
        try {
          const content = await fetchFileContent(token, owner, repo, file.path, branch);
          return { path: file.path, content, size: file.size };
        } catch {
          return null;
        }
      })
    );
    files.push(...contents.filter(Boolean));

    if (i + batchSize < codeFiles.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return files;
};

export const fetchCommitDiff = async (token, owner, repo, sha) => {
  const octokit = getOctokit(token);

  const { data } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  return {
    sha: data.sha,
    message: data.commit.message,
    author: {
      name: data.commit.author?.name,
      email: data.commit.author?.email,
      avatar: data.author?.avatar_url,
    },
    timestamp: data.commit.author?.date,
    files: data.files?.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch?.slice(0, 3000),
    })) || [],
    diff: data.files?.map((f) => `--- ${f.filename}\n${f.patch || ""}`).join("\n\n").slice(0, 10000) || "",
  };
};

export const fetchPRData = async (token, owner, repo, prNumber) => {
  const octokit = getOctokit(token);

  const [prResponse, filesResponse, commentsResponse] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number: prNumber }),
    octokit.rest.pulls.listFiles({ owner, repo, pull_number: prNumber }),
    octokit.rest.issues.listComments({ owner, repo, issue_number: prNumber }),
  ]);

  const diff = filesResponse.data
    .map((f) => `--- ${f.filename}\n${f.patch || ""}`)
    .join("\n\n")
    .slice(0, 10000);

  const comments = commentsResponse.data
    .map((c) => `@${c.user?.login}: ${c.body}`)
    .join("\n")
    .slice(0, 2000);

  return {
    title: prResponse.data.title,
    body: prResponse.data.body,
    state: prResponse.data.state,
    user: prResponse.data.user?.login,
    diff,
    comments,
    filesChanged: filesResponse.data.length,
    additions: prResponse.data.additions,
    deletions: prResponse.data.deletions,
  };
};

export const buildFileTree = (files) => {
  const tree = [];
  const pathMap = {};

  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      if (!pathMap[fullPath]) {
        const node = {
          name: part,
          path: fullPath,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        };
        pathMap[fullPath] = node;
        currentLevel.push(node);
      }

      if (!isFile) {
        currentLevel = pathMap[fullPath].children;
      }
    }
  }

  return tree;
};
