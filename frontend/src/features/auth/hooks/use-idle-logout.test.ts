import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdleLogout } from './use-idle-logout';

const MINUTE = 60_000;
const SECOND = 1000;

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-11-02T08:00:00Z'));
});

function setup({ enabled = true, idleMinutes = 5 } = {}) {
	const onTimeout = vi.fn();
	const hook = renderHook(() =>
		useIdleLogout({ enabled, idleMinutes, onTimeout }),
	);
	return { onTimeout, ...hook };
}

function advance(milliseconds: number) {
	act(() => {
		vi.advanceTimersByTime(milliseconds);
	});
}

function touch(eventName = 'pointerdown') {
	act(() => {
		window.dispatchEvent(new Event(eventName));
	});
}

describe('useIdleLogout', () => {
	it('times out after the idle time without activity', () => {
		const { onTimeout } = setup({ idleMinutes: 5 });

		advance(5 * MINUTE - SECOND);
		expect(onTimeout).not.toHaveBeenCalled();

		advance(SECOND);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});

	it('retries the timeout every 30 seconds until the user stays', () => {
		const { onTimeout, result } = setup({ idleMinutes: 1 });
		advance(MINUTE);

		advance(29 * SECOND);
		expect(onTimeout).toHaveBeenCalledTimes(1);
		advance(SECOND);
		expect(onTimeout).toHaveBeenCalledTimes(2);

		act(() => result.current.stayLoggedIn());
		advance(59 * SECOND);
		expect(onTimeout).toHaveBeenCalledTimes(2);
	});

	it('times out again after a full idle time once the user stayed after a timeout', () => {
		const { onTimeout, result } = setup({ idleMinutes: 1 });
		advance(MINUTE);
		act(() => result.current.stayLoggedIn());

		advance(MINUTE);

		expect(onTimeout).toHaveBeenCalledTimes(2);
	});

	it('stops tracking after unmount', () => {
		const { onTimeout, unmount } = setup({ idleMinutes: 1 });
		unmount();

		touch();
		advance(10 * MINUTE);
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});

		expect(onTimeout).not.toHaveBeenCalled();
	});

	it('drops the warning and never times out when disabled mid-warning', () => {
		const onTimeout = vi.fn();
		const { result, rerender } = renderHook(
			({ enabled }) => useIdleLogout({ enabled, idleMinutes: 1, onTimeout }),
			{ initialProps: { enabled: true } },
		);
		advance(40 * SECOND);
		expect(result.current.state.status).toBe('warning');

		rerender({ enabled: false });
		advance(10 * MINUTE);

		expect(result.current.state).toEqual({ status: 'active' });
		expect(onTimeout).not.toHaveBeenCalled();
	});

	it.each(['pointerdown', 'keydown', 'touchstart'])(
		'postpones the deadline on %s',
		(eventName) => {
			const { onTimeout, result } = setup({ idleMinutes: 5 });

			advance(4 * MINUTE);
			touch(eventName);
			advance(4 * MINUTE);

			expect(onTimeout).not.toHaveBeenCalled();
			expect(result.current.state).toEqual({ status: 'active' });

			advance(MINUTE);
			expect(onTimeout).toHaveBeenCalledTimes(1);
		},
	);

	it('counts down the last 30 seconds', () => {
		const { result } = setup({ idleMinutes: 1 });

		advance(30 * SECOND - 1);
		expect(result.current.state).toEqual({ status: 'active' });

		advance(1);
		expect(result.current.state).toEqual({
			status: 'warning',
			secondsLeft: 30,
		});

		advance(10 * SECOND);
		expect(result.current.state).toEqual({
			status: 'warning',
			secondsLeft: 20,
		});
	});

	it('ignores activity during the warning until the user chooses to stay', () => {
		const { onTimeout, result } = setup({ idleMinutes: 1 });
		advance(40 * SECOND);

		touch();
		advance(19 * SECOND);
		expect(result.current.state.status).toBe('warning');

		advance(SECOND);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});

	it('restarts the full idle time after stayLoggedIn', () => {
		const { onTimeout, result } = setup({ idleMinutes: 1 });
		advance(45 * SECOND);

		act(() => result.current.stayLoggedIn());
		expect(result.current.state).toEqual({ status: 'active' });

		advance(59 * SECOND);
		expect(onTimeout).not.toHaveBeenCalled();

		advance(SECOND);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});

	it('does nothing while disabled', () => {
		const { onTimeout, result } = setup({ enabled: false, idleMinutes: 1 });

		advance(10 * MINUTE);

		expect(onTimeout).not.toHaveBeenCalled();
		expect(result.current.state).toEqual({ status: 'active' });
	});

	it('times out right away when the tab wakes up after the deadline passed', () => {
		const { onTimeout } = setup({ idleMinutes: 5 });

		vi.setSystemTime(Date.now() + 6 * MINUTE);
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});

		expect(onTimeout).toHaveBeenCalledTimes(1);
	});
});
