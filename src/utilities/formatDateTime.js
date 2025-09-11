export const formatDateTime = (date, type = "long") => {
  const now = new Date();
  const today = now.toLocaleDateString("en-US");
  const yesterday = new Date(
    new Date().setDate(new Date().getDate() - 1)
  ).toLocaleDateString("en-US");

  const inputDate = new Date(date);
  const currentYear = now.getFullYear();
  const inputYear = inputDate.getFullYear();
  const isCurrentYear = inputYear === currentYear;

  // Calculate days difference
  const daysDifference = Math.floor((now - inputDate) / (1000 * 60 * 60 * 24));
  const isWithinWeek = daysDifference >= 0 && daysDifference < 7;

  const formattedDate = inputDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  const formattedDateWithYear = inputDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const formattedTime = inputDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  const dayOfWeek = inputDate.toLocaleDateString("en-US", {
    weekday: "long"
  });

  if (type === "short") {
    if (today === inputDate.toLocaleDateString("en-US")) {
      return formattedTime;
    } else if (yesterday === inputDate.toLocaleDateString("en-US")) {
      return `Yesterday`;
    } else if (isWithinWeek && daysDifference > 1) {
      return dayOfWeek;
    } else {
      return formattedDate;
    }
  } else {
    if (today === inputDate.toLocaleDateString("en-US")) {
      return `Today at ${formattedTime}`;
    } else if (yesterday === inputDate.toLocaleDateString("en-US")) {
      return `Yesterday at ${formattedTime}`;
    } else if (isWithinWeek && daysDifference > 1) {
      return `${dayOfWeek} at ${formattedTime}`;
    } else {
      // Only show year if it's not the current year
      const dateToUse = isCurrentYear ? formattedDate : formattedDateWithYear;
      return `${dateToUse} at ${formattedTime}`;
    }
  }
};

/**
 * Converts URLs in text to clickable links
 * @param {string} text - The text to process
 * @returns {Array} Array of text and link elements
 */
export const parseUrlsInText = (text) => {
  if (!text) return [];

  // URL regex pattern that matches http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index)
      });
    }

    // Add the URL as a link, but hide the protocol in display text
    const fullUrl = match[0];
    const displayText = fullUrl.replace(/^https?:\/\//, "");

    parts.push({
      type: "link",
      content: displayText,
      url: fullUrl
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex)
    });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
};
