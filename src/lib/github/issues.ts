type IssuePayload = {
  title: string;
  body: string;
  labels: string[];
};

type IssueResult = {
  html_url: string;
};

const GITHUB_REPO = "SH1SHANK/attendrix-web";

export async function createGithubIssue(payload: IssuePayload) {
  const token = process.env.NEXT_PRIVATE_GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GitHub token");
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Attendrix-Web",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = (await response.json()) as IssueResult & {
    message?: string;
    errors?: unknown;
  };

  if (!response.ok) {
    const message = data?.message || "GitHub issue creation failed";
    throw new Error(message);
  }

  return data;
}
