/**
 * Utility functions for handling group URL redirects
 *
 * This module provides functionality for renaming groups while maintaining
 * old URLs through automatic redirects. When a group is renamed, old URLs
 * will automatically redirect to the new group name, preserving user IDs
 * and any URL fragments.
 *
 * PWA Support:
 * - Works in standalone mode on iOS/Android
 * - Handles offline scenarios gracefully
 * - Maintains proper navigation history
 *
 * Backend API Requirements:
 *
 * Endpoint: GET /check-group-redirect/:groupId
 *
 * Response format:
 * {
 *   "hasRedirect": boolean,
 *   "newGroupId": string | null
 * }
 *
 * Examples:
 * - GET /check-group-redirect/old-group-name
 *   Response: { "hasRedirect": true, "newGroupId": "new-group-name" }
 *
 * - GET /check-group-redirect/current-group-name
 *   Response: { "hasRedirect": false }
 *
 * Usage:
 * When users visit /old-group-name/user123, they will be automatically
 * redirected to /new-group-name/user123, and their localStorage will be
 * updated to reflect the new group name.
 */

/**
 * Checks if a group has been renamed and returns redirect information
 * @param {string} groupId - The current group ID from the URL
 * @returns {Promise<{hasRedirect: boolean, newGroupId?: string}>}
 */
export const checkGroupRedirect = async (groupId) => {
  try {
    // Check cache first for offline scenarios
    const cached = getCachedRedirectInfo(groupId);
    if (cached && !navigator.onLine) {
      console.log("Using cached redirect info (offline)");
      return cached;
    }

    // Check if we're online before making the request
    if (!navigator.onLine) {
      console.log("Offline: Skipping group redirect check");
      return { hasRedirect: false };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for mobile networks

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/check-group-redirect/${groupId}`,
      {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache" // Ensure fresh data for redirects
        }
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const redirectInfo = {
        hasRedirect: data.hasRedirect || false,
        newGroupId: data.newGroupId || null
      };

      // Cache the result for future offline use
      cacheRedirectInfo(
        groupId,
        redirectInfo.hasRedirect,
        redirectInfo.newGroupId
      );

      return redirectInfo;
    }

    return { hasRedirect: false };
  } catch (error) {
    if (error.name === "AbortError") {
      console.log(
        "Group redirect check timed out - continuing with original URL"
      );
    } else {
      console.error("Error checking group redirect:", error);
    }

    // Fallback to cache if available
    const cached = getCachedRedirectInfo(groupId);
    if (cached) {
      console.log("Using cached redirect info (fallback)");
      return cached;
    }

    return { hasRedirect: false };
  }
};

/**
 * Performs a redirect if needed for group URLs
 * PWA-optimized to work properly in standalone mode
 * @param {string} groupId - The current group ID from the URL
 * @param {string} additionalPath - Additional path components (like userId)
 * @returns {Promise<boolean>} - Returns true if a redirect was performed
 */
export const handleGroupRedirect = async (groupId, additionalPath = "") => {
  const redirectInfo = await checkGroupRedirect(groupId);

  if (redirectInfo.hasRedirect && redirectInfo.newGroupId) {
    // Update localStorage to reflect the new group name
    updateLocalStorageForGroupRename(groupId, redirectInfo.newGroupId);

    const hash = window.location.hash;
    const newUrl = `/${redirectInfo.newGroupId}${additionalPath}${hash}`;

    // For PWAs, use window.location.href to ensure proper navigation
    // This works correctly in both browser and standalone mode
    window.location.href = newUrl;
    return true;
  }

  return false;
};

/**
 * Updates localStorage when a group is renamed to maintain user's group list
 * @param {string} oldGroupId - The old group ID
 * @param {string} newGroupId - The new group ID
 */
export const updateLocalStorageForGroupRename = (oldGroupId, newGroupId) => {
  try {
    const myGroups = JSON.parse(localStorage.getItem("myGroups") || "[]");
    const updatedGroups = myGroups.map((group) =>
      group.groupId === oldGroupId ? { ...group, groupId: newGroupId } : group
    );
    localStorage.setItem("myGroups", JSON.stringify(updatedGroups));

    // Log for debugging in PWA context
    if (process.env.NODE_ENV === "development") {
      console.log(`Updated localStorage: ${oldGroupId} → ${newGroupId}`);
    }
  } catch (error) {
    console.error("Error updating localStorage for group rename:", error);
  }
};

/**
 * Cache redirect information locally to improve PWA performance
 * @param {string} groupId - The group ID to cache
 * @param {boolean} hasRedirect - Whether this group has a redirect
 * @param {string|null} newGroupId - The new group ID if redirected
 */
export const cacheRedirectInfo = (groupId, hasRedirect, newGroupId = null) => {
  try {
    const cache = JSON.parse(
      localStorage.getItem("groupRedirectCache") || "{}"
    );
    cache[groupId] = {
      hasRedirect,
      newGroupId,
      timestamp: Date.now()
    };

    // Clean old cache entries (older than 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    Object.keys(cache).forEach((key) => {
      if (cache[key].timestamp < oneDayAgo) {
        delete cache[key];
      }
    });

    localStorage.setItem("groupRedirectCache", JSON.stringify(cache));
  } catch (error) {
    console.error("Error caching redirect info:", error);
  }
};

/**
 * Get cached redirect information for offline scenarios
 * @param {string} groupId - The group ID to check
 * @returns {object|null} - Cached redirect info or null
 */
export const getCachedRedirectInfo = (groupId) => {
  try {
    const cache = JSON.parse(
      localStorage.getItem("groupRedirectCache") || "{}"
    );
    const cached = cache[groupId];

    if (cached && cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
      return {
        hasRedirect: cached.hasRedirect,
        newGroupId: cached.newGroupId
      };
    }

    return null;
  } catch (error) {
    console.error("Error reading cached redirect info:", error);
    return null;
  }
};
