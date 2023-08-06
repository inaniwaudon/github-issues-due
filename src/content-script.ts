import { Octokit } from "@octokit/rest";
import colorConvert from "color-convert";

const createIssueItemElement = (
  id: number,
  number: number,
  title: string,
  owner: string,
  repo: string,
  author: string,
  labels: {
    name: string;
    color?: string | null;
  }[]
) => {
  const checkbox = `<label class="flex-shrink-0 py-2 pl-3  d-none d-md-block">
    <input type="checkbox" data-check-all-item="" class="js-issues-list-check" name="issues[]" value="${number}" aria-labelledby="issue_${number}_link" autocomplete="off">
  </label>`;
  const openDiv = `<div class="flex-shrink-0 pt-2 pl-3">
    <span class="tooltipped tooltipped-e" aria-label="Open issue">
      <svg class="octicon octicon-issue-opened open" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
    </span>
  </div>`;

  // label
  const labelAnchors = labels
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .flatMap((label) => {
      let style = "";
      if (label.color) {
        const [r, g, b] = colorConvert.hex.rgb(label.color);
        const [h, s, l] = colorConvert.hex.hsl(label.color);
        style = `--label-r:${r};--label-g:${g};--label-b:${b};--label-h:${h};--label-s:${s};--label-l:${l};`;
      }
      return `<a href="/inaniwaudon/tasks/issues?q=is%3Aissue+is%3Aopen+label%3A${label.name}" data-name="${label.name}" style="${style}" data-view-component="true" class="IssueLabel hx_IssueLabel" data-turbo-frame="repo-content-turbo-frame">
      ${label.name}
    </a>`;
    });
  const labelSpan =
    labelAnchors.length > 0
      ? `<span class="lh-default d-block d-md-inline">${labelAnchors.join(
          " "
        )}</span>`
      : "";

  const content = `<div class="d-flex Box-row--drag-hide position-relative">
    ${checkbox}
    ${openDiv}
    <div class="flex-auto min-width-0 p-2 pr-3 pr-md-2">
      <a id="issue_${number}_link" class="Link--primary v-align-middle no-underline h4 js-navigation-open markdown-title" data-hovercard-type="issue" data-hovercard-url="/${owner}/${repo}/issues/${number}/hovercard" href="/${owner}/${repo}/issues/${number}" data-turbo-frame="repo-content-turbo-frame">${title}</a>
      ${labelSpan}
      <div class="d-flex mt-1 text-small color-fg-muted">
        <span class="opened-by">
          #${number}
            opened <relative-time datetime="2023-08-03T19:18:50Z" class="no-wrap" title="Aug 4, 2023, 4:18 AM GMT+9">Aug 4, 2023</relative-time> by
            <a class="Link--muted" title="Open issues created by ${author}" data-hovercard-type="user" data-hovercard-url="/users/${author}/hovercard" data-octo-click="hovercard-link-click" data-octo-dimensions="link_type:self" href="/${owner}/${repo}/issues?q=is%3Aissue+is%3Aopen+author%3A${author}" data-turbo-frame="repo-content-turbo-frame">${author}</a>            
        </span>
        <span class="d-none d-md-inline-flex"></span>
      </div>
    </div>
    <a class="d-block d-md-none position-absolute top-0 bottom-0 left-0 right-0" aria-label="Link to Issue. ${title}" href="/${owner}/${repo}/issues/${number}" data-turbo-frame="repo-content-turbo-frame"></a>
  </div>`;

  const div = document.createElement("div");
  div.id = "issue_14";
  div.className =
    "Box-row Box-row--focus-gray p-0 mt-0 js-navigation-item js-issue-row navigation-focus";
  div.setAttribute("data-id", id.toString());
  div.setAttribute("data-pjax", "#repo-content-pjax-container");
  div.setAttribute("data-turbo-frame", "repo-content-turbo-frame");
  div.innerHTML = content;
  return div;
};

const getDate = (line: string) => {
  const result = line
    .replace(/\s+/g, "")
    .match(/[Dd]ue:(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
  if (result) {
    try {
      return new Date(
        parseInt(result[1]),
        parseInt(result[2]) - 1,
        parseInt(result[3])
      );
    } catch (e) {
      // ignore
    }
  }
  return null;
};

(async () => {
  const splitedPaths = location.pathname.split("/");
  if (splitedPaths.length < 3) {
    return;
  }
  const owner = splitedPaths[1];
  const repo = splitedPaths[2];

  const issuesWrapper = document.querySelector(
    '[aria-label="Issues"][role="group"]'
  );
  const enabled = true;
  if (!issuesWrapper || !enabled) {
    return;
  }

  // get issues
  const octokit = new Octokit({ auth: TOKEN });
  const issues = await octokit.issues.listForRepo({
    owner,
    repo,
    per_page: 100,
  });
  if (issues.status !== 200) {
    return;
  }

  issuesWrapper.innerHTML = "";

  for (const issue of issues.data) {
    const labels: {
      name: string;
      color?: string | null;
    }[] = [];
    // label
    for (const label of issue.labels) {
      if (typeof label === "object" && label.name) {
        labels.push({ name: label.name, color: label.color });
      }
    }

    // check due date
    let dueDate: Date | null = null;
    if (issue.body) {
      for (const line of issue.body.split("\n")) {
        dueDate = getDate(line);
      }
    }

    const element = createIssueItemElement(
      issue.id,
      issue.number,
      issue.title,
      owner,
      repo,
      issue.user?.login!,
      labels
    );
    console.log(element);
    issuesWrapper.appendChild(element);
  }
})();
