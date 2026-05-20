#!/usr/bin/env sh
set -eu

PROJECT_NAME="sang-des-anciens-rogue-lite"
DIST_DIR="dist/${PROJECT_NAME}/browser"
WORKTREE_DIR=".deploy-gh-pages"
REMOTE_NAME="origin"
PAGES_BRANCH="gh-pages"

npm run build:github-pages

if [ ! -d "${DIST_DIR}" ]; then
  echo "Build output not found: ${DIST_DIR}" >&2
  exit 1
fi

if [ -d "${WORKTREE_DIR}/.git" ] || [ -f "${WORKTREE_DIR}/.git" ]; then
  git worktree remove "${WORKTREE_DIR}" --force
elif [ -d "${WORKTREE_DIR}" ]; then
  rm -rf "${WORKTREE_DIR}"
fi

if git ls-remote --exit-code --heads "${REMOTE_NAME}" "${PAGES_BRANCH}" >/dev/null 2>&1; then
  git worktree add --track -B "${PAGES_BRANCH}" "${WORKTREE_DIR}" "${REMOTE_NAME}/${PAGES_BRANCH}"
else
  git worktree add -B "${PAGES_BRANCH}" "${WORKTREE_DIR}"
fi

find "${WORKTREE_DIR}" -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +
cp -R "${DIST_DIR}/." "${WORKTREE_DIR}/"
cp "${WORKTREE_DIR}/index.html" "${WORKTREE_DIR}/404.html"
touch "${WORKTREE_DIR}/.nojekyll"

git -C "${WORKTREE_DIR}" add --all

if git -C "${WORKTREE_DIR}" diff --cached --quiet; then
  echo "No GitHub Pages changes to deploy."
else
  git -C "${WORKTREE_DIR}" commit -m "Deploy GitHub Pages"
  git -C "${WORKTREE_DIR}" push "${REMOTE_NAME}" "${PAGES_BRANCH}"
fi

git worktree remove "${WORKTREE_DIR}" --force
