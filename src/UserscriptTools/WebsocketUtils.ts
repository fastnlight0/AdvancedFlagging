import { Store } from './Store';

export class WebsocketUtils {
    public websocket: WebSocket | null = null;

    private readonly url: string;
    private readonly id: number;
    private readonly timeout: number;
    // message sent when the websocket opens
    // for authentication
    private readonly auth: string;

    constructor(
        url: string,
        // id of the post to watch
        id: number,
        auth?: string,
        timeout = 1e4
    ) {
        this.url = url;
        this.id = id;
        this.auth = auth || '';
        this.timeout = timeout;

        this.initWebsocket();
    }

    public async waitForReport(
        // called every time a new WS message is received
        // returns the ids of the posts reported to the bot
        callback: (event: MessageEvent<string>) => number[]
    ): Promise<void> {
        if (!this.websocket || this.websocket.readyState > 1) {
            this.websocket = null;

            if (Store.dryRun) {
                console.log('Failed to connect to', this.url, 'WebSocket');
            }

            return;
        }

        await this.withTimeout<void>(
            this.timeout,
            new Promise<void>(resolve => {
                this.websocket?.addEventListener(
                    'message',
                    (event: MessageEvent<string>) => {
                        const ids = callback(event);

                        if (Store.dryRun) {
                            console.log('New message from', this.url, event.data);
                            console.log('Comparing', ids, 'to', this.id);
                        }

                        if (ids.includes(this.id)) resolve();
                    });
            })
        );
    }

    private initWebsocket(): void {
        this.websocket = new WebSocket(this.url);

        if (this.auth) {
            this.websocket.addEventListener('open', () => {
                this.websocket?.send(this.auth);
            });
        }

        if (Store.dryRun) {
            console.log('WebSocket', this.url, 'initialised.');
        }
    }

    private closeWebsocket(): void {
        // websocket already closed
        if (!this.websocket) return;

        this.websocket.close();
        this.websocket = null;

        if (Store.dryRun) {
            console.log('Closed connection to', this.url);
        }
    }

    private async withTimeout<T>(millis: number, promise: Promise<T>): Promise<void> {
        let time: NodeJS.Timeout | undefined;

        const timeout = new Promise<void>(resolve => {
            time = setTimeout(() => {
                if (Store.dryRun) {
                    console.log('WebSocket connection timeouted after', millis, 'ms');
                }

                resolve();
            }, millis);
        });

        await Promise
            .race([ promise, timeout ])
            .finally(() => {
                clearTimeout(time);
                this.closeWebsocket();
            });
    }
}