import { Octokit } from "@octokit/rest";
import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import colorConvert from "color-convert";
import {
  displayGitHubDate,
  displayHyphenedDate,
  getDueDateFromBody,
} from "./utils";

const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_TOKEN });
type IssuesListForRepoType = GetResponseTypeFromEndpointMethod<
  typeof octokit.issues.listForRepo
>;

let insertedDueAnchors: HTMLAnchorElement[] = [];
let insertedDueSpans: HTMLSpanElement[] = [];

const createIssueItemElement = (
  id: number,
  number: number,
  title: string,
  owner: string,
  repo: string,
  author: string,
  createdAt: Date,
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

  // opened by
  const createdAtDate = displayGitHubDate(createdAt, false);
  const createdAtDateTime = displayGitHubDate(createdAt, false);
  const openedBy = `<span class="opened-by">
    #${number}
    opened <relative-time datetime="${createdAt.toISOString()}" class="no-wrap" title="${createdAtDateTime}">${createdAtDate}</relative-time> by
    <a class="Link--muted" title="Open issues created by ${author}" data-hovercard-type="user" data-hovercard-url="/users/${author}/hovercard" data-octo-click="hovercard-link-click" data-octo-dimensions="link_type:self" href="/${owner}/${repo}/issues?q=is%3Aissue+is%3Aopen+author%3A${author}" data-turbo-frame="repo-content-turbo-frame">${author}</a>
  </span>`;

  const content = `<div class="d-flex Box-row--drag-hide position-relative">
    ${checkbox}
    ${openDiv}
    <div class="flex-auto min-width-0 p-2 pr-3 pr-md-2">
      <a id="issue_${number}_link" class="Link--primary v-align-middle no-underline h4 js-navigation-open markdown-title" data-hovercard-type="issue" data-hovercard-url="/${owner}/${repo}/issues/${number}/hovercard" href="/${owner}/${repo}/issues/${number}" data-turbo-frame="repo-content-turbo-frame">${title}</a>
      ${labelSpan}
      <div class="d-flex mt-1 text-small color-fg-muted">
        ${openedBy}
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

const replaceIssuesWithDueDate = (
  issues: IssuesListForRepoType,
  issuesDiv: HTMLDivElement,
  owner: string,
  repo: string
) => {
  const issuesContainer = issuesDiv.getElementsByTagName("div")[0];
  if (!issuesContainer) {
    return;
  }
  issuesContainer.innerHTML = "";

  const sortedIssues = [...issues.data].sort((a, b) => {
    const aDue = getDueDateFromBody(a.body);
    const bDue = getDueDateFromBody(b.body);
    if (aDue && bDue) {
      return aDue.getTime() - bDue.getTime();
    }
    if (aDue && !bDue) {
      return -1;
    }
    if (!aDue && bDue) {
      return 1;
    } else {
      return b.number - a.number;
    }
  });

  for (const issue of sortedIssues) {
    // label
    const labels: {
      name: string;
      color?: string | null;
    }[] = [];
    for (const label of issue.labels) {
      if (typeof label === "object" && label.name) {
        labels.push({ name: label.name, color: label.color });
      }
    }

    const element = createIssueItemElement(
      issue.id,
      issue.number,
      issue.title,
      owner,
      repo,
      issue.user?.login!,
      new Date(issue.created_at),
      labels
    );
    issuesContainer.appendChild(element);
  }
};

const reset = () => {
  for (const element of [...insertedDueAnchors, ...insertedDueSpans]) {
    element.remove();
  }
  insertedDueAnchors = [];
  insertedDueSpans = [];
};

const reload = async () => {
  // url
  const splitedPaths = location.pathname.split("/");
  if (splitedPaths.length < 3) {
    return;
  }
  const owner = splitedPaths[1];
  const repo = splitedPaths[2];
  const searchParams = new URL(location.href).searchParams;
  const queryContainsDue = (searchParams.get("q") || "")
    .split(" ")
    .includes("is:due");

  const enabled = true;
  if (!enabled) {
    return true;
  }

  // get issues
  const issues = await octokit.issues.listForRepo({
    owner,
    repo,
    per_page: 100,
  });
  if (issues.status !== 200) {
    return;
  }

  // add button to the toolbar
  const closedAnchors = document.querySelectorAll("#js-issues-toolbar a");
  if (closedAnchors[1] && closedAnchors[1].parentNode) {
    const dueAnchor = document.createElement("a");
    dueAnchor.href = "/inaniwaudon/test-due/issues?q=is:issue+is:open+is:due";
    dueAnchor.textContent = "Due date";
    dueAnchor.className = "btn-link";
    if (queryContainsDue) {
      for (const anchor of closedAnchors) {
        anchor.classList.remove("selected");
      }
      dueAnchor.classList.add("selected");
    }
    dueAnchor.setAttribute("data-ga-click", "Issues, Table state, Closed");
    dueAnchor.setAttribute("data-turbo-frame", "repo-content-turbo-frame");
    closedAnchors[1].parentNode.insertBefore(
      dueAnchor,
      closedAnchors[1].nextElementSibling
    );
    insertedDueAnchors.push(dueAnchor);
  }

  const issuesDivQuery = '[aria-label="Issues"][role="group"]';
  const issuesDiv = document.querySelector<HTMLDivElement>(
    '[aria-label="Issues"][role="group"]'
  );
  if (!issuesDiv) {
    return;
  }

  // is:due
  if (queryContainsDue) {
    replaceIssuesWithDueDate(issues, issuesDiv, owner, repo);
  }

  // insert due date
  const issueItemDivs = issuesDiv.querySelectorAll<HTMLDivElement>(
    `${issuesDivQuery} > div > div`
  );
  const nowDate = new Date();

  for (const issueDiv of issueItemDivs) {
    const id = issueDiv.dataset.id;
    const issue = issues.data.find((issue) => issue.id.toString() === id);
    if (!issue) {
      continue;
    }

    const dueDate = getDueDateFromBody(issue.body);
    if (!dueDate) {
      continue;
    }
    const dueDateText = displayHyphenedDate(dueDate);

    // insert
    const openedBySpan = issueDiv.querySelector(".opened-by");
    if (openedBySpan && openedBySpan.parentNode) {
      const dueSpan = document.createElement("span");
      dueSpan.textContent = `– Due: ${dueDateText}`;
      dueSpan.style.marginLeft = "4px";
      openedBySpan.parentNode.insertBefore(
        dueSpan,
        openedBySpan.nextElementSibling
      );
      insertedDueSpans.push(dueSpan);
    }

    // styling
    const leftDays =
      (dueDate.getTime() - nowDate.getTime()) / (24 * 60 * 60 * 1000);
    if (leftDays < import.meta.env.VITE_DANGER_DAYS) {
      issueDiv.style.background = "var(--color-danger-subtle)";
    }
  }
};

(() => {
  let url = "";
  const callback = () => {
    if (location.href !== url) {
      url = location.href;
      reset();
      reload();
    }
  };
  const observer = new MutationObserver(callback);
  observer.observe(document.body, { attributes: true, childList: true });
  reload();
})();
