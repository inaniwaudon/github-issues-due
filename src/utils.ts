export const displayGitHubDate = (date: Date, dateOnly: boolean) => {
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][date.getMonth()];
  const dateStr = `${month} ${date.getDate()}, ${date.getFullYear()}`;
  const timeStr = `${date.getHours() % 12}:${date.getMinutes()} ${
    date.getHours() < 12 ? "AM" : "PM"
  } GMT+9`;
  return dateStr + (dateOnly ? "" : `, ${timeStr}`);
};

export const displayHyphenedDate = (date: Date) => {
  return (
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2)
  );
};

export const getDueDateFromBody = (body: string | undefined | null) => {
  if (!body) {
    return null;
  }
  for (const line of body.split("\n")) {
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
  }
  return null;
};
