import { ChatApi } from './ChatApi';
import {
    isStackOverflow,
    copypastorServer,
    username,
    copypastorKey,
    getSentMessage,
    FlagTypeFeedbacks,
    showInlineElement
} from '../GlobalVars';
import { getAllPostIds } from './sotools';

interface CopyPastorFindTargetResponseItem {
    post_id: string;
    target_url: string;
    repost: boolean;
    original_url: string;
}

type CopyPastorFindTargetResponse = {
    status: 'success';
    posts: CopyPastorFindTargetResponseItem[];
} | {
    status: 'failure';
    message: string;
};

interface CopyPastorData {
    [key: number]: { // key is the sitePostId
        copypastorId: number;
        repost: boolean;
        target_url: string;
    };
}

export class CopyPastorAPI {
    private static copypastorIds: Partial<CopyPastorData> = {};

    public name: keyof FlagTypeFeedbacks = 'Guttenberg';
    public copypastorId: number;
    public repost: boolean;
    public targetUrl: string;

    constructor(
        private readonly answerId: number,
        private readonly copypastorIcon?: HTMLDivElement
    ) {
        const copypastorObject = CopyPastorAPI.copypastorIds[this.answerId];

        this.copypastorId = copypastorObject?.copypastorId || 0;
        this.repost = copypastorObject?.repost || false;
        this.targetUrl = copypastorObject?.target_url || '';
    }

    public static async getAllCopyPastorIds(): Promise<void> {
        if (!isStackOverflow) return;

        const postUrls = getAllPostIds(false, true); // postIds as URLs excluding questions
        if (!postUrls.length) return; // make sure the array isn't empty
        await this.storeReportedPosts(postUrls as string[]);
    }

    private static storeReportedPosts(postUrls: string[]): Promise<void> {
        const url = `${copypastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
        return new Promise<void>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: { responseText: string }) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    if (responseObject.status === 'failure') return;
                    responseObject.posts.forEach(item => {
                        const sitePostId = Number(/\d+/.exec(item.target_url)?.[0]);
                        this.copypastorIds[sitePostId] = {
                            copypastorId: Number(item.post_id),
                            repost: item.repost,
                            target_url: item.target_url
                        };
                    });
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }

    public sendFeedback(feedback: string, sendFeedback: boolean): Promise<string> {
        const chatId = new ChatApi().getChatUserId();
        if (!this.copypastorId || !sendFeedback) return Promise.resolve('');

        const successMessage = getSentMessage(true, feedback, this.name);
        const failureMessage = getSentMessage(false, feedback, this.name);
        const payload = {
            post_id: this.copypastorId,
            feedback_type: feedback,
            username,
            link: `https://chat.stackoverflow.com/users/${chatId}`,
            key: copypastorKey,
        };

        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${copypastorServer}/feedback/create`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: Object.entries(payload).map(item => item.join('=')).join('&'),
                onload: (response: { status: number }) => {
                    response.status === 200 ? resolve(successMessage) : reject(failureMessage);
                },
                onerror: () => reject(failureMessage)
            });
        });
    }

    public setupIcon(): void {
        if (!this.copypastorId || !this.copypastorIcon) return;

        showInlineElement(this.copypastorIcon);
        const iconLink = this.copypastorIcon.querySelector('a');
        if (!iconLink) return;

        iconLink.href = `//copypastor.sobotics.org/posts/${this.copypastorId}`;
        iconLink.target = 'blank';
    }
}
