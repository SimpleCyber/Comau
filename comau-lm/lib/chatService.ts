import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc,
    Timestamp,
    deleteDoc,
    arrayUnion
} from "firebase/firestore";

export type Message = {
    id?: string;
    role: "user" | "model";
    content: string;
    createdAt?: Timestamp;
    senderId?: string; // For group chats to know who sent it
    senderName?: string;
    senderPhotoURL?: string;
};

export type Chat = {
    id: string;
    userId: string; // The creator or owner
    title: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastMessage?: string;
    type?: "personal" | "group"; // New field to distinguish chat type
    members?: string[]; // Array of user IDs for group chats
    projectId?: string; // To place the chat inside a folder
};

export type Project = {
    id: string;
    userId: string;
    name: string;
    createdAt: Timestamp;
};

export const chatService = {
    // ---- PROJECT METHODS ----
    async createProject(userId: string, name: string): Promise<string> {
        const docRef = await addDoc(collection(db, "projects"), {
            userId,
            name,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    async getUserProjects(userId: string): Promise<Project[]> {
        const q = query(
            collection(db, "projects"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Project[];
    },

    async deleteProject(projectId: string) {
        // Find chats within this project and remove their projectId
        const q = query(collection(db, "chats"), where("projectId", "==", projectId));
        const chatsSnapshot = await getDocs(q);
        const promises = chatsSnapshot.docs.map(d => updateDoc(doc(db, "chats", d.id), { projectId: null }));
        await Promise.all(promises);

        await deleteDoc(doc(db, "projects", projectId));
    },

    async updateChatProject(chatId: string, projectId: string | null) {
        await updateDoc(doc(db, "chats", chatId), { projectId });
    },

    // ---- CHAT METHODS ----
    async createChat(userId: string, firstMessage: string, type: "personal" | "group" = "personal"): Promise<string> {
        const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "");
        const chatData: any = {
            userId,
            title,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: firstMessage,
            type,
        };

        if (type === "group") {
            chatData.members = [userId];
        }

        const docRef = await addDoc(collection(db, "chats"), chatData);
        return docRef.id;
    },

    async joinGroupChat(chatId: string, userId: string) {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            members: arrayUnion(userId)
        });
    },

    async getUserChats(userId: string): Promise<Chat[]> {
        // Fetch personal chats and group chats where the user is a member or owner
        const personalQuery = query(
            collection(db, "chats"),
            where("userId", "==", userId),
            orderBy("updatedAt", "desc")
        );
        const personalSnapshot = await getDocs(personalQuery);
        let personalChats = personalSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Chat[];

        // Fetching group chats requires a separate query or an array-contains query if user is in members.
        // To cover cases where the user didn't create the chat but joined it:
        const groupQuery = query(
            collection(db, "chats"),
            where("members", "array-contains", userId),
            orderBy("updatedAt", "desc")
        );
        const groupSnapshot = await getDocs(groupQuery);
        const groupChats = groupSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Chat[];

        // Combine and deduplicate
        const allChats = [...personalChats, ...groupChats];
        const uniqueChats = Array.from(new Map(allChats.map(c => [c.id, c])).values());

        // Sort by updatedAt descending
        uniqueChats.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());

        return uniqueChats;
    },

    async getChat(chatId: string): Promise<Chat | null> {
        const docRef = doc(db, "chats", chatId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Chat;
        }
        return null;
    },

    async addMessage(
        chatId: string,
        role: "user" | "model",
        content: string,
        senderId?: string,
        senderName?: string,
        senderPhotoURL?: string
    ) {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const msgData: any = {
            role,
            content,
            createdAt: serverTimestamp(),
        };
        if (senderId) msgData.senderId = senderId;
        if (senderName) msgData.senderName = senderName;
        if (senderPhotoURL) msgData.senderPhotoURL = senderPhotoURL;

        await addDoc(messagesRef, msgData);

        // Update the chat's updatedAt and lastMessage
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            updatedAt: serverTimestamp(),
            lastMessage: content,
        });
    },

    async getChatMessages(chatId: string): Promise<Message[]> {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Message[];
    },

    async deleteChat(chatId: string) {
        await deleteDoc(doc(db, "chats", chatId));
    }
};
