export function parseStandupSections(text: string) {
  const pick = (key: string) => {
    const match = text.match(new RegExp(`${key}:\\s*([^\\n]+)`, "i"));
    return match?.[1]?.trim() ?? null;
  };

  return {
    project: pick("Project"),
    achieved: pick("Achieved"),
    left: pick("Left"),
    issues: pick("Issues"),
  };
}
