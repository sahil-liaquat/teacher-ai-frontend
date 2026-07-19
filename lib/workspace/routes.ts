export function workspaceHomeRoute() {
  return "/dashboard/my-workspace";
}

export function workspaceClassRoute(classId: string) {
  const query = new URLSearchParams({ class: classId });
  return `${workspaceHomeRoute()}?${query.toString()}`;
}

export function topicWorkspaceRoute(workspaceId: string, topicId: string) {
  return `/dashboard/my-workspace/topic/${encodeURIComponent(workspaceId)}/${encodeURIComponent(topicId)}`;
}

export function ensureWorkspaceGeneratorContext(href: string, workspaceId: string, topicId: string) {
  const [path, rawQuery = ""] = href.split("?");
  const query = new URLSearchParams(rawQuery);
  query.set("workspace", workspaceId);
  query.set("workspace_topic", topicId);
  query.set("return_to", topicWorkspaceRoute(workspaceId, topicId));
  return `${path}?${query.toString()}`;
}

export function returnTopicRoute(params: URLSearchParams) {
  const workspaceId = params.get("workspace");
  const topicId = params.get("workspace_topic");
  if (!workspaceId || !topicId) return null;
  return topicWorkspaceRoute(workspaceId, topicId);
}

export function appendWorkspaceContext(path: string, source: URLSearchParams) {
  const [pathname, rawQuery = ""] = path.split("?");
  const target = new URLSearchParams(rawQuery);
  for (const key of ["workspace", "workspace_topic", "return_to"]) {
    const value = source.get(key);
    if (value) target.set(key, value);
  }
  const query = target.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
