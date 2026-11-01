const openChannels = new Set<FakeBroadcastChannel>();

/**
 * In-memory `BroadcastChannel` for jsdom: delivers a posted message asynchronously to every other open channel with the same name.
 */
export class FakeBroadcastChannel extends EventTarget {
	readonly name: string;

	constructor(name: string) {
		super();
		this.name = name;
		openChannels.add(this);
	}

	postMessage(message: unknown): void {
		const data = structuredClone(message);
		for (const channel of openChannels) {
			if (channel !== this && channel.name === this.name) {
				queueMicrotask(() => channel.deliver(data));
			}
		}
	}

	close(): void {
		openChannels.delete(this);
	}

	private deliver(data: unknown): void {
		if (openChannels.has(this)) {
			this.dispatchEvent(new MessageEvent('message', { data }));
		}
	}
}

/**
 * Closes every fake channel left open by the previous test.
 */
export function closeFakeBroadcastChannels(): void {
	openChannels.clear();
}
