/**
 * Mock Supabase Service (Local Storage Edition)
 * Replaces the real Supabase library with an identical API using browser storage.
 */

const STORAGE_KEY_USERS = 'crisisnav_users';
const STORAGE_KEY_SESSION = 'crisisnav_session';
const STORAGE_KEY_PROFILES = 'crisisnav_profiles';

// Helper to get all users
const getUsers = () => JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
const saveUsers = (users) => localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

// Helper to get sessions
const getSession = () => JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION) || 'null');
const saveSession = (session) => localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));

// Helper to get profiles
const getProfiles = () => JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
const saveProfiles = (profiles) => localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));

export const supabase = {
    auth: {
        async signUp({ email, password, options }) {
            const users = getUsers();
            if (users.find(u => u.email === email)) {
                return { data: { user: null }, error: { message: 'User already exists.' } };
            }

            const newUser = {
                id: crypto.randomUUID(),
                email,
                user_metadata: options?.data || {},
                created_at: new Date().toISOString()
            };

            users.push({ ...newUser, password }); // In a real app we'd hash this
            saveUsers(users);

            // Auto-create profile
            const profiles = getProfiles();
            profiles.push({
                id: newUser.id,
                ...newUser.user_metadata,
                updated_at: newUser.created_at
            });
            saveProfiles(profiles);

            const session = { user: newUser, expires_at: Date.now() + 3600000 };
            saveSession(session);

            return { data: { user: newUser, session }, error: null };
        },

        async signInWithPassword({ email, password }) {
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                return { data: { user: null, session: null }, error: { message: 'Invalid credentials.' } };
            }

            const sessionUser = { ...user };
            delete sessionUser.password;

            const session = { user: sessionUser, expires_at: Date.now() + 3600000 };
            saveSession(session);

            return { data: { user: sessionUser, session }, error: null };
        },

        async signInWithOAuth({ provider, options }) {
            // Mock Google Login as just a direct login to 'guest' user
            const guestUser = {
                id: 'google-mock-id',
                email: 'google-user@example.com',
                user_metadata: { full_name: 'Google User', avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop' }
            };
            const session = { user: guestUser };
            saveSession(session);
            window.location.href = options.redirectTo || 'index.html';
            return { data: {}, error: null };
        },

        async signOut() {
            saveSession(null);
            localStorage.removeItem('isLoggedIn');
            return { error: null };
        },

        async getSession() {
            const session = getSession();
            return { data: { session }, error: null };
        },

        async getUser() {
            const session = getSession();
            return { data: { user: session?.user || null }, error: null };
        }
    },

    from(table) {
        if (table === 'profiles') {
            return {
                select() {
                    return {
                        eq(field, value) {
                            return {
                                async single() {
                                    const profiles = getProfiles();
                                    const profile = profiles.find(p => p[field] === value);
                                    return { data: profile || null, error: profile ? null : { message: 'Not found' } };
                                }
                            };
                        }
                    };
                },
                upsert(data) {
                    const profiles = getProfiles();
                    const index = profiles.findIndex(p => p.id === data.id);
                    if (index !== -1) {
                        profiles[index] = { ...profiles[index], ...data, updated_at: new Date().toISOString() };
                    } else {
                        profiles.push({ ...data, updated_at: new Date().toISOString() });
                    }
                    saveProfiles(profiles);
                    return { data, error: null };
                }
            };
        }
        return { data: null, error: { message: 'Table not supported in mock.' } };
    }
};
