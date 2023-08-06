# github-issues-due

Chrome Extension to specify a due date for a GitHub Issue.

![Screenshot](thumbnail.webp)

## Abstract

GitHub's Issues feature is very useful as a task management tool. On the other hand, setting a due date to each issue requires relate to milestone, which can be a bit complicated.

This extension implements the specification a due date to an issue easily by writing `due: 2023-08-07` in the body of the issue.

## How to use

1. Get a personal access token from [Developper Settings](https://github.com/settings/apps). It requires a permission to read issues for all repositories.

1. write environments to `.env`.

    ```
    VITE_GITHUB_TOKEN=github_pat_***
    VITE_DANGER_DAYS=1
    ```

2. Execute following commands. The built files will be generated under `/dist`.

    ```
    yarn
    yarn run build
    ```

3. When opening an issue, specify the due date in the body of the issue using the following notation.

    ```
    due: yyyy-mm-dd
    due: yyyy-m-d
    due: yyyy/mm/dd
    due: yyyy/m/d
    ```

4. The description of `Due: yyyy-mm-dd` will appear in the list of opened issues. By clicking on the link of [Due Date], the issues are sorted by the order of their due dates.

## Liscense

(c) 2023 inaniwaudon. This software is released under the MIT Liscense.
