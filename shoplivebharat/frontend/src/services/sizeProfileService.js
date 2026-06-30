/**
 * sizeProfileService.js
 *
 * Pure utility module (not a React component) for managing SizeProfile objects
 * in localStorage. All reads/writes are wrapped in try/catch.
 *
 * localStorage key: slb_size_profiles_{userId}  →  SizeProfile[]
 *
 * SizeProfile shape:
 * {
 *   id: string,             // uuid v4
 *   userId: string,
 *   profile_name: string,   // 1–40 chars, unique per user
 *   unit: 'cm' | 'inches',
 *   is_default: boolean,
 *   created_at: string,     // ISO 8601
 *   updated_at: string,     // ISO 8601
 *   height?, weight?, bust?, waist?, hip?,
 *   shoulder_width?, sleeve_length?, arm_circumference?,
 *   neck?, thigh?, calf?, inseam?,
 *   kurti_length?, blouse_length?, lehenga_waist?, lehenga_length?,
 *   saree_fall_preference?: string,
 *   dupatta_length_preference?: string
 * }
 */

const MAX_PROFILES = 10;

/**
 * Returns the localStorage key for a given userId.
 * @param {string} userId
 * @returns {string}
 */
function storageKey(userId) {
  return `slb_size_profiles_${userId}`;
}

/**
 * Reads and parses the profiles array for a user.
 * Returns an empty array if nothing is stored or if parsing fails.
 *
 * @param {string} userId
 * @returns {SizeProfile[]}
 */
function list(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[sizeProfileService] list: failed to read profiles', error);
    return [];
  }
}

/**
 * Persists the profiles array for a user.
 * @param {string} userId
 * @param {SizeProfile[]} profiles
 */
function saveAll(userId, profiles) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(profiles));
  } catch (error) {
    console.error('[sizeProfileService] saveAll: failed to write profiles', error);
    throw error; // surface quota / private-mode errors to the caller
  }
}

/**
 * Creates a new SizeProfile for the given user.
 *
 * Generates a uuid v4 id via crypto.randomUUID(), sets created_at and
 * updated_at to the current ISO 8601 timestamp. Throws an Error if the
 * user already has 10 profiles (the maximum allowed).
 *
 * @param {string} userId
 * @param {Partial<SizeProfile>} profileData  — must include at least profile_name and unit
 * @returns {SizeProfile} the newly created profile
 * @throws {Error} if the 10-profile cap has been reached
 */
function create(userId, profileData) {
  const profiles = list(userId);

  if (profiles.length >= MAX_PROFILES) {
    throw new Error(
      'Profile limit reached. You can have a maximum of 10 size profiles.'
    );
  }

  const now = new Date().toISOString();
  const newProfile = {
    ...profileData,
    id: crypto.randomUUID(),
    userId,
    created_at: now,
    updated_at: now,
    // If this is the first profile it becomes the default automatically
    is_default: profiles.length === 0 ? true : (profileData.is_default ?? false),
  };

  saveAll(userId, [...profiles, newProfile]);
  return newProfile;
}

/**
 * Updates an existing SizeProfile with the given patch.
 *
 * Merges the patch into the existing profile, refreshes updated_at, and
 * validates that the resulting profile_name is unique among the user's
 * profiles (excluding the profile being updated).
 *
 * @param {string} userId
 * @param {string} profileId
 * @param {Partial<SizeProfile>} patch
 * @returns {SizeProfile} the updated profile
 * @throws {Error} if the profile is not found or the new name is not unique
 */
function update(userId, profileId, patch) {
  const profiles = list(userId);
  const idx = profiles.findIndex((p) => p.id === profileId);

  if (idx === -1) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  const existing = profiles[idx];
  const merged = {
    ...existing,
    ...patch,
    id: existing.id,         // id is immutable
    userId: existing.userId, // userId is immutable
    created_at: existing.created_at, // created_at is immutable
    updated_at: new Date().toISOString(),
  };

  // Validate name uniqueness (case-sensitive, same as creation)
  const newName = merged.profile_name;
  const nameConflict = profiles.some(
    (p) => p.id !== profileId && p.profile_name === newName
  );
  if (nameConflict) {
    throw new Error(
      `A profile named "${newName}" already exists. Please choose a unique name.`
    );
  }

  const updated = [...profiles];
  updated[idx] = merged;
  saveAll(userId, updated);
  return merged;
}

/**
 * Deletes the profile with the given profileId.
 *
 * If the deleted profile was the default, the most-recently-created
 * remaining profile (sorted by created_at descending, first element)
 * is automatically promoted to default. If no profiles remain after
 * deletion, no default is set.
 *
 * @param {string} userId
 * @param {string} profileId
 * @returns {SizeProfile[]} the updated list of profiles after deletion
 * @throws {Error} if the profile is not found
 */
function deleteProfile(userId, profileId) {
  const profiles = list(userId);
  const idx = profiles.findIndex((p) => p.id === profileId);

  if (idx === -1) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  const wasDefault = profiles[idx].is_default;
  const remaining = profiles.filter((p) => p.id !== profileId);

  if (wasDefault && remaining.length > 0) {
    // Sort by created_at descending — most recently created first
    const sorted = [...remaining].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const newDefaultId = sorted[0].id;

    const withNewDefault = remaining.map((p) => ({
      ...p,
      is_default: p.id === newDefaultId,
    }));

    saveAll(userId, withNewDefault);
    return withNewDefault;
  }

  saveAll(userId, remaining);
  return remaining;
}

/**
 * Sets a single profile as the default for the user.
 *
 * Sets is_default: true on the target profile and is_default: false on
 * all other profiles belonging to the same user.
 *
 * @param {string} userId
 * @param {string} profileId
 * @returns {SizeProfile[]} the updated list of profiles
 * @throws {Error} if the profile is not found
 */
function setDefault(userId, profileId) {
  const profiles = list(userId);
  const exists = profiles.some((p) => p.id === profileId);

  if (!exists) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  const updated = profiles.map((p) => ({
    ...p,
    is_default: p.id === profileId,
  }));

  saveAll(userId, updated);
  return updated;
}

const sizeProfileService = {
  list,
  create,
  update,
  delete: deleteProfile,
  setDefault,
};

export default sizeProfileService;

// Named exports for convenience and tree-shaking
export { list, create, update, deleteProfile as deleteP, setDefault };
