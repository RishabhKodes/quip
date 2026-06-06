export function sanitizeForLogging(body: Record<string, unknown>): Record<string, unknown> {
  return {
    question: typeof body.question === "string" ? body.question.slice(0, 100) : undefined,
    pageTitle: typeof body.pageTitle === "string" ? body.pageTitle.slice(0, 100) : undefined,
    pageUrl: typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 200) : undefined,
    selectedTextLength: typeof body.selectedText === "string" ? body.selectedText.length : 0,
    stream: body.stream,
  };
}
