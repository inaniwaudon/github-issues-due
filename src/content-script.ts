import { getIssues, replaceIssuesWithDueDate } from "./issues";
import { displayHyphenedDate, getDueDateFromBody } from "./utils";

let insertedDueAnchors: HTMLAnchorElement[] = [];
let insertedDueSpans: HTMLSpanElement[] = [];

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

  const issues = await getIssues(owner, repo);
  if (!issues) {
    return;
  }

  // add button to the toolbar
  const closedAnchors = document.querySelectorAll("#js-issues-toolbar a");
  if (closedAnchors[1] && closedAnchors[1].parentNode) {
    const dueAnchor = document.createElement("a");
    dueAnchor.href = `/${owner}/${repo}/issues?q=is:issue+is:open+is:due`;
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

//
(() => {
  // redraw on page transitions
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
