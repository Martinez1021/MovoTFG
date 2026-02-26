import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

export interface WorkoutExerciseLog {
    name: string;
    muscle_group: string;
    sets: Array<{ reps: number; weight: number }>;
}

export interface WorkoutData {
    routine_name: string;
    duration_seconds: number;
    effort_score: number;          // 1-10
    total_sets: number;
    total_reps: number;
    total_weight: number;          // kg moved (reps × weight sum)
    exercises: WorkoutExerciseLog[];
    photo_base64?: string;         // optional post-workout photo
}

export interface Post {
    id: string;
    supabase_uid: string;
    user_name: string;
    user_avatar?: string;
    content: string;
    image_url?: string;
    workout_data?: WorkoutData;
    likes_count: number;
    comments_count: number;
    liked_by_me: boolean;
    created_at: string;
}

export interface Comment {
    id: string;
    post_id: string;
    supabase_uid: string;
    user_name: string;
    user_avatar?: string;
    content: string;
    created_at: string;
}

interface FeedState {
    posts: Post[];
    isLoading: boolean;
    isPosting: boolean;
    comments: Record<string, Comment[]>;
    isLoadingComments: boolean;
    isAddingComment: boolean;
    fetchPosts: () => Promise<void>;
    createPost: (content: string, imageBase64?: string) => Promise<void>;
    createWorkoutPost: (data: WorkoutData) => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
    fetchComments: (postId: string) => Promise<void>;
    addComment: (postId: string, text: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
    posts: [],
    isLoading: false,
    isPosting: false,
    comments: {},
    isLoadingComments: false,
    isAddingComment: false,

    fetchPosts: async () => {
        set({ isLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const myUid = session?.user?.id ?? null;

            const { data, error } = await supabase
                .from('feed_posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('[FeedStore] fetchPosts:', error.message);
                set({ posts: [] });
                return;
            }

            let myLikes: string[] = [];
            if (myUid && (data ?? []).length > 0) {
                const { data: likesData } = await supabase
                    .from('feed_likes')
                    .select('post_id')
                    .eq('supabase_uid', myUid);
                myLikes = (likesData ?? []).map((l: any) => l.post_id);
            }

            const posts: Post[] = (data ?? []).map((p: any) => ({
                id: p.id,
                supabase_uid: p.supabase_uid,
                user_name: p.user_name ?? 'Usuario',
                user_avatar: p.user_avatar,
                content: p.content ?? '',
                image_url: p.image_url,
                workout_data: p.workout_data ?? undefined,
                likes_count: p.likes_count ?? 0,
                comments_count: p.comments_count ?? 0,
                liked_by_me: myLikes.includes(p.id),
                created_at: p.created_at,
            }));

            set({ posts });
        } catch (e: any) {
            console.warn('[FeedStore] fetchPosts unexpected:', e?.message);
            set({ posts: [] });
        } finally {
            set({ isLoading: false });
        }
    },

    createPost: async (content, imageBase64) => {
        set({ isPosting: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('No autenticado');

            const authUser = useAuthStore.getState().user;
            const imageUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;

            const { error } = await supabase.from('feed_posts').insert({
                supabase_uid: session.user.id,
                user_name: authUser?.full_name ?? session.user.email,
                user_avatar: authUser?.avatar_url ?? null,
                content: content.trim(),
                image_url: imageUrl,
                likes_count: 0,
            });

            if (error) throw error;
            await get().fetchPosts();
        } catch (e: any) {
            console.error('[FeedStore] createPost:', e?.message);
            throw e;
        } finally {
            set({ isPosting: false });
        }
    },

    createWorkoutPost: async (data) => {
        set({ isPosting: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('No autenticado');
            const authUser = useAuthStore.getState().user;

            const effortEmoji = data.effort_score >= 9 ? '🏆' : data.effort_score >= 7 ? '🔥' : data.effort_score >= 5 ? '💪' : '🧘';
            const durationMin = Math.round(data.duration_seconds / 60);
            const content = `${effortEmoji} ${data.routine_name} · ${durationMin}min · Esfuerzo ${data.effort_score}/10`;
            const imageUrl = data.photo_base64 ? `data:image/jpeg;base64,${data.photo_base64}` : null;

            const { error } = await supabase.from('feed_posts').insert({
                supabase_uid: session.user.id,
                user_name: authUser?.full_name ?? session.user.email,
                user_avatar: authUser?.avatar_url ?? null,
                content,
                image_url: imageUrl,
                workout_data: data,
                likes_count: 0,
            });

            if (error) throw error;
            await get().fetchPosts();
        } catch (e: any) {
            console.error('[FeedStore] createWorkoutPost:', e?.message);
            throw e;
        } finally {
            set({ isPosting: false });
        }
    },

    toggleLike: async (postId) => {
        const posts = get().posts;
        const post = posts.find((p) => p.id === postId);
        if (!post) return;

        const { data: { session } } = await supabase.auth.getSession();
        const myUid = session?.user?.id;
        if (!myUid) return;

        // Optimistic update
        set({
            posts: posts.map((p) => p.id === postId
                ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
                : p
            ),
        });

        try {
            if (post.liked_by_me) {
                await supabase.from('feed_likes').delete().match({ post_id: postId, supabase_uid: myUid });
                await supabase.from('feed_posts').update({ likes_count: post.likes_count - 1 }).eq('id', postId);
            } else {
                await supabase.from('feed_likes').insert({ post_id: postId, supabase_uid: myUid });
                await supabase.from('feed_posts').update({ likes_count: post.likes_count + 1 }).eq('id', postId);
            }
        } catch {
            set({ posts }); // revert
        }
    },

    fetchComments: async (postId) => {
        set({ isLoadingComments: true });
        try {
            const { data, error } = await supabase
                .from('feed_comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            if (error) { console.warn('[FeedStore] fetchComments:', error.message); return; }
            const all = get().comments;
            set({ comments: { ...all, [postId]: data ?? [] } });
        } catch (e: any) {
            console.warn('[FeedStore] fetchComments unexpected:', e?.message);
        } finally {
            set({ isLoadingComments: false });
        }
    },

    addComment: async (postId, text) => {
        set({ isAddingComment: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('No autenticado');
            const authUser = useAuthStore.getState().user;

            const { data, error } = await supabase.from('feed_comments').insert({
                post_id: postId,
                supabase_uid: session.user.id,
                user_name: authUser?.full_name ?? session.user.email ?? 'Usuario',
                user_avatar: authUser?.avatar_url ?? null,
                content: text.trim(),
            }).select().single();

            if (error) throw error;

            // Optimistic local update
            const all = get().comments;
            const current = all[postId] ?? [];
            set({ comments: { ...all, [postId]: [...current, data] } });

            // Increment comments_count on post
            const posts = get().posts;
            const post = posts.find((p) => p.id === postId);
            if (post) {
                await supabase.from('feed_posts').update({ comments_count: (post.comments_count ?? 0) + 1 }).eq('id', postId);
                set({
                    posts: posts.map((p) => p.id === postId
                        ? { ...p, comments_count: (p.comments_count ?? 0) + 1 }
                        : p
                    ),
                });
            }
        } catch (e: any) {
            console.error('[FeedStore] addComment:', e?.message);
            throw e;
        } finally {
            set({ isAddingComment: false });
        }
    },
}));
