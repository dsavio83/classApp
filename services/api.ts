import { Class, Subject, Unit, SubUnit, Lesson, Content, ResourceType, GroupedContent, ResourceCounts, User, PlatformStats, QuestionPaperMetadata } from '../types';

const API_BASE = 'http://localhost:5000/api';

// Helper for fetch requests
const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            // Add Authorization header here if token exists in localStorage/Context
        },
        ...options,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
};

export const uploadFile = async (formData: FormData): Promise<any> => {
    const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
        // Content-Type header is automatically set by browser with boundary for FormData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
};

// --- Hierarchy ---

export const getClasses = (): Promise<Class[]> => apiRequest('/classes');
export const addClass = (name: string): Promise<Class> => apiRequest('/classes', { method: 'POST', body: JSON.stringify({ name }) });
export const updateClass = (id: string, name: string): Promise<Class> => apiRequest(`/classes/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteClass = (id: string): Promise<{ success: boolean }> => apiRequest(`/classes/${id}`, { method: 'DELETE' });

export const getSubjectsByClassId = (classId: string): Promise<Subject[]> => apiRequest(`/subjects?classId=${classId}`);
export const addSubject = (name: string, classId: string): Promise<Subject> => apiRequest('/subjects', { method: 'POST', body: JSON.stringify({ name, classId }) });
export const updateSubject = (id: string, name: string): Promise<Subject> => apiRequest(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteSubject = (id: string): Promise<{ success: boolean }> => apiRequest(`/subjects/${id}`, { method: 'DELETE' });

export const getUnitsBySubjectId = (subjectId: string): Promise<Unit[]> => apiRequest(`/units?subjectId=${subjectId}`);
export const addUnit = (name: string, subjectId: string): Promise<Unit> => apiRequest('/units', { method: 'POST', body: JSON.stringify({ name, subjectId }) });
export const updateUnit = (id: string, name: string): Promise<Unit> => apiRequest(`/units/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteUnit = (id: string): Promise<{ success: boolean }> => apiRequest(`/units/${id}`, { method: 'DELETE' });

export const getSubUnitsByUnitId = (unitId: string): Promise<SubUnit[]> => apiRequest(`/subUnits?unitId=${unitId}`);
export const addSubUnit = (name: string, unitId: string): Promise<SubUnit> => apiRequest('/subUnits', { method: 'POST', body: JSON.stringify({ name, unitId }) });
export const updateSubUnit = (id: string, name: string): Promise<SubUnit> => apiRequest(`/subUnits/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteSubUnit = (id: string): Promise<{ success: boolean }> => apiRequest(`/subUnits/${id}`, { method: 'DELETE' });

export const getLessonsBySubUnitId = (subUnitId: string): Promise<Lesson[]> => apiRequest(`/lessons?subUnitId=${subUnitId}`);
export const addLesson = (name: string, subUnitId: string): Promise<Lesson> => apiRequest('/lessons', { method: 'POST', body: JSON.stringify({ name, subUnitId }) });
export const updateLesson = (id: string, name: string): Promise<Lesson> => apiRequest(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteLesson = (id: string): Promise<{ success: boolean }> => apiRequest(`/lessons/${id}`, { method: 'DELETE' });

// --- Content ---

export const getContentsByLessonId = (lessonId: string, types?: ResourceType[]): Promise<GroupedContent[]> => {
    let url = `/content?lessonId=${lessonId}`;
    console.log('[API] getContentsByLessonId called:', { lessonId, types, url });
    if (types && types.length > 0) {
        // Add type filter to URL - backend supports single type parameter
        url += `&type=${types[0]}`;
        console.log('[API] getContentsByLessonId with type filter:', url);
    }
    return apiRequest(url);
};

// Flashcard-specific API
export const getFlashcardsByLessonId = async (lessonId: string): Promise<{ success: boolean; lessonId: string; count: number; flashcards: Content[] }> => {
    console.log('[API] getFlashcardsByLessonId called:', { lessonId });
    const response: { success: boolean; lessonId: string; count: number; flashcards: Content[] } = await apiRequest(`/flashcards/${lessonId}`);
    console.log('[API] getFlashcardsByLessonId response:', response);
    return response;
};

// Enhanced Q&A-specific APIs
export interface QAFilters {
    questionType?: string;
    cognitiveProcess?: string;
    marks?: number;
    limit?: number;
    skip?: number;
}

export interface QAStats {
    totalQA: number;
    avgMarks: number;
    questionTypes: string[];
    cognitiveProcesses: string[];
    marksDistribution: { _id: number; count: number }[];
}

export const getQAByLessonId = async (
    lessonId: string,
    filters?: QAFilters
): Promise<any> => {
    console.log('[API] getQAByLessonId called:', { lessonId, filters });

    let url = `/qa/${lessonId}`;
    const params = new URLSearchParams();

    if (filters) {
        if (filters.questionType) params.append('questionType', filters.questionType);
        if (filters.cognitiveProcess) params.append('cognitiveProcess', filters.cognitiveProcess);
        if (filters.marks) params.append('marks', filters.marks.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.skip) params.append('skip', filters.skip.toString());
    }

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await apiRequest(url);
    console.log('[API] getQAByLessonId response:', response);
    return response;
};

export const getQAStatsByLessonId = async (lessonId: string): Promise<any> => {
    console.log('[API] getQAStatsByLessonId called:', { lessonId });
    const response = await apiRequest(`/qa/${lessonId}/stats`);
    console.log('[API] getQAStatsByLessonId response:', response);
    return response;
};

// Helper function to get all Q&A with common filters
export const getQAWithFilters = async (
    lessonId: string,
    options: {
        questionType?: 'Basic' | 'Average' | 'Profound';
        cognitiveProcess?: 'CP1' | 'CP2' | 'CP3' | 'CP4' | 'CP5' | 'CP6' | 'CP7';
        marks?: number;
        limit?: number;
    } = {}
) => {
    const filters: QAFilters = {};

    if (options.questionType) filters.questionType = options.questionType;
    if (options.cognitiveProcess) filters.cognitiveProcess = options.cognitiveProcess;
    if (options.marks) filters.marks = options.marks;
    if (options.limit) filters.limit = options.limit;

    return getQAByLessonId(lessonId, filters);
};

export const getCountsByLessonId = async (lessonId: string): Promise<ResourceCounts> => {
    // Optimization: Create a specific endpoint for counts if needed. 
    // For now, fetch all content and count client-side or use the grouped response
    const grouped: GroupedContent[] = await getContentsByLessonId(lessonId);
    const counts: ResourceCounts = {};
    grouped.forEach(g => {
        counts[g.type] = g.count;
    });
    return counts;
};

export const addContent = (contentData: Omit<Content, '_id'>): Promise<Content> => {
    // Logic for title generation from body (if notes) should ideally move to backend or stay here.
    // Keeping it simple: sending data as is.
    console.log('[API] addContent called:', contentData);
    return apiRequest('/content', { method: 'POST', body: JSON.stringify(contentData) });
};

export const addMultipleContent = async (contentsData: Omit<Content, '_id'>[]): Promise<Content[]> => {
    // Sequential uploads or parallel. Backend doesn't have bulk insert yet.
    const promises = contentsData.map(c => addContent(c));
    return Promise.all(promises);
};

export const updateContent = (id: string, updates: Partial<Omit<Content, '_id'>>): Promise<Content> =>
    apiRequest(`/content/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

export const deleteContent = (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/content/${id}`, { method: 'DELETE' });

export const incrementViewCount = (id: string): Promise<{ success: boolean; viewCount: number }> =>
    apiRequest(`/content/${id}/view`, { method: 'POST' });

// --- Breadcrumbs ---
// Backend doesn't have a breadcrumb endpoint yet, so we might need to fetch hierarchy up.
// OR we can implement a simple endpoint.
// For now, let's implement a client-side fetch chain or assume backend has it (I'll add it to backend if needed, but I didn't add it in previous step).
// WAIT: I didn't add /breadcrumbs to api/routes/index.js.
// I will implement a client-side version for now to avoid breaking changes, or return empty string.
export const getBreadcrumbs = async (lessonId: string): Promise<string> => {
    // Placeholder: Real implementation would require fetching Lesson -> SubUnit -> Unit -> Subject -> Class
    // This is expensive. Better to add to backend.
    // Returning empty for now to prevent errors.
    return "";
};


// --- Auth & User ---

export const loginUser = (username: string, password: string): Promise<{ user: User, token: string }> =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const getUsers = (): Promise<User[]> => apiRequest('/users');

export const addUser = (user: Omit<User, '_id' | 'isFirstLogin'>): Promise<User> =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(user) });

export const updateUser = (id: string, updates: Partial<Omit<User, '_id'>>): Promise<User> =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

export const deleteUser = (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/users/${id}`, { method: 'DELETE' });

export const updateProfile = (id: string, data: { password: string; mobileNumber: string }): Promise<User> =>
    apiRequest(`/users/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) });

// New profile management endpoints
export const updateUserProfile = (id: string, data: { name: string; email: string; mobileNumber?: string }): Promise<{ success: boolean; user: User; message: string }> =>
    apiRequest(`/users/${id}/update-profile`, { method: 'PUT', body: JSON.stringify(data) });

export const changePassword = (id: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/users/${id}/change-password`, { method: 'PUT', body: JSON.stringify(data) });

export const getUserProfile = (id: string): Promise<{ success: boolean; user: User }> =>
    apiRequest(`/users/${id}/profile`);

// --- Stats ---

export const getPlatformStats = (): Promise<PlatformStats> => apiRequest('/stats');