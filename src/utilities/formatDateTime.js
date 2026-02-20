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

/**
 * Parses comment text for URLs and @mentions.
 * For @mentions, checks if the name after @ matches any group member (case-insensitive).
 * Tries longest user name match first (greedy).
 * @param {string} text - The comment text to process
 * @param {Array} users - Array of {id, name} group members
 * @returns {Array} Array of {type: "text"|"link"|"mention", content, url?, userId?}
 */
export const parseCommentText = (text, users = []) => {
  if (!text) return [];

  // First pass: find all URLs so we don't match @mentions inside URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlRanges = [];
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    urlRanges.push({ start: urlMatch.index, end: urlMatch.index + urlMatch[0].length });
  }

  const isInsideUrl = (index) =>
    urlRanges.some((r) => index >= r.start && index < r.end);

  // Ensure Claude is always a matchable mention
  const allUsers = users.some((u) => u.name.toLowerCase() === "claude")
    ? users
    : [...users, { id: "claude-ai", name: "Claude" }];

  // Sort users by name length descending for greedy matching
  const sortedUsers = [...allUsers].sort((a, b) => b.name.length - a.name.length);

  // Find all mention positions
  const mentions = [];
  const atRegex = /@/g;
  let atMatch;
  while ((atMatch = atRegex.exec(text)) !== null) {
    if (isInsideUrl(atMatch.index)) continue;

    const afterAt = text.slice(atMatch.index + 1);
    for (const user of sortedUsers) {
      if (afterAt.toLowerCase().startsWith(user.name.toLowerCase())) {
        // Check that the character after the name is a word boundary
        const charAfter = afterAt[user.name.length];
        if (!charAfter || /[^a-zA-Z0-9]/.test(charAfter)) {
          mentions.push({
            start: atMatch.index,
            end: atMatch.index + 1 + user.name.length,
            name: user.name,
            originalText: afterAt.slice(0, user.name.length),
            userId: user.id
          });
          break; // Found longest match, stop
        }
      }
    }
  }

  // Now build parts array combining URLs and mentions, processing left to right
  const specialRanges = [
    ...urlRanges.map((r) => ({ ...r, type: "url" })),
    ...mentions.map((m) => ({ start: m.start, end: m.end, type: "mention", name: m.name, originalText: m.originalText, userId: m.userId }))
  ].sort((a, b) => a.start - b.start);

  const parts = [];
  let lastIndex = 0;

  for (const range of specialRanges) {
    if (range.start < lastIndex) continue; // Skip overlapping ranges

    if (range.start > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, range.start) });
    }

    if (range.type === "url") {
      const fullUrl = text.slice(range.start, range.end);
      parts.push({
        type: "link",
        content: fullUrl.replace(/^https?:\/\//, ""),
        url: fullUrl
      });
    } else if (range.type === "mention") {
      parts.push({
        type: "mention",
        content: range.name,
        originalText: range.originalText,
        userId: range.userId
      });
    }

    lastIndex = range.end;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
};
