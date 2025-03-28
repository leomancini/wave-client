export const formatDateTime = (date, type = "long") => {
  const today = new Date().toLocaleDateString("en-US");
  const yesterday = new Date(
    new Date().setDate(new Date().getDate() - 1)
  ).toLocaleDateString("en-US");

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  const formattedDateWithYear = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const formattedTime = new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  if (type === "short") {
    if (today === new Date(date).toLocaleDateString("en-US")) {
      return formattedTime;
    } else if (yesterday === new Date(date).toLocaleDateString("en-US")) {
      return `Yesterday`;
    } else {
      return formattedDate;
    }
  } else {
    if (today === new Date(date).toLocaleDateString("en-US")) {
      return `Today at ${formattedTime}`;
    } else if (yesterday === new Date(date).toLocaleDateString("en-US")) {
      return `Yesterday at ${formattedTime}`;
    } else {
      return `${formattedDateWithYear} at ${formattedTime}`;
    }
  }
};
