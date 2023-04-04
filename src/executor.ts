import { MapperFunction, CExecuteOptions, Resolvable } from './index';
import _ from 'the-lodash';
import { MyPromise } from './promise';

interface ItemInfo<T> {
    item: T;
    index: number;
    errors: number;
    lastError?: any;
    lastFailureMoment?: Date;
    delay: number | null;
}

export class Executor<T, R> {
    origItems: ItemInfo<T>[] = [];
    items: ItemInfo<T>[] = [];
    processing: Record<number, ItemInfo<T>> = {};
    action: MapperFunction<T, R>;
    options: CExecuteOptions;
    results: R[] = [];
    rootResolve?: (thenableOrResult: Resolvable<R[]>) => void;
    rootReject?: (error?: any) => void;
    isProcessingFailed = false;
    waitingCoolDown = false;
    pauseTillNextTry?: number;

    constructor(items: T[], action: MapperFunction<T, R>, options: CExecuteOptions) {
        for (let i = 0; i < items.length; i++) {
            const itemInfo = {
                item: items[i],
                index: i,
                errors: 0,
                delay: null,
            };
            this.origItems.push(itemInfo);
            this.items.push(itemInfo);
        }
        this.action = action;
        this.options = options;
    }

    get unfinishedCount(): number {
        return _.keys(this.processing).length;
    }

    execute(): Promise<R[]> {
        return MyPromise.construct((resolve, reject) => {
            this.rootResolve = resolve;
            this.rootReject = reject;

            this._tryProcess();
        });
    }

    private _tryProcess() {
        if (this.isProcessingFailed) {
            if (this.options.waitCompleteBeforeExit) {
                if (this.unfinishedCount === 0) {
                    this._finishFailure();
                }
            } else {
                this._finishFailure();
            }
            return;
        }

        if (this.waitingCoolDown) {
            if (this.unfinishedCount === 0) {
                this.waitingCoolDown = false;
            } else {
                return;
            }
        }

        if (this.unfinishedCount >= this.options.concurrency) {
            return;
        }

        const now = new Date();

        for (let i = 0; i < this.items.length; i++) {
            const itemInfo = this.items[i];
            if (this._canProcessItem(now, itemInfo)) {
                this.items = [...this.items.slice(0, i), ...this.items.slice(i + 1)];
                this._processItem(itemInfo);
                return;
            }
        }

        if (this.items.length > 0) {
            const pauseMs = this.pauseTillNextTry ?? 500;
            MyPromise.timeout(pauseMs).then(() => {
                this._tryProcess();
                return null;
            });
            return;
        }

        if (this.unfinishedCount === 0) {
            this._finishSuccess();
        }
    }

    private _canProcessItem(now: Date, itemInfo: ItemInfo<T>): boolean {
        if (!itemInfo.lastFailureMoment) {
            return true;
        }

        if (itemInfo.delay) {
            const diff = now.valueOf() - itemInfo.lastFailureMoment.valueOf();
            if (diff >= itemInfo.delay) {
                return true;
            } else {
                if (!this.pauseTillNextTry) {
                    this.pauseTillNextTry = diff;
                } else {
                    this.pauseTillNextTry = Math.min(this.pauseTillNextTry!, diff);
                }
            }
        } else {
            return true;
        }

        return false;
    }

    private _processItem(itemInfo: ItemInfo<T>) {
        this.processing[itemInfo.index] = itemInfo;
        try {
            const actionResult = this.action(itemInfo.item);
            Promise.resolve(actionResult)
                .then((result) => {
                    this._handleItemFinished(itemInfo, result);
                    return null;
                })
                .catch((reason) => {
                    this._handleItemFailed(itemInfo, reason);
                    return null;
                });
        } catch (reason) {
            this._handleItemFailed(itemInfo, reason);
        }

        this._tryProcess();
    }

    private _handleItemFinished(itemInfo: ItemInfo<T>, result: R) {
        delete this.processing[itemInfo.index];
        this.results[itemInfo.index] = result;
        this._tryProcess();
    }

    private _handleItemFailed(itemInfo: ItemInfo<T>, reason: any) {
        delete this.processing[itemInfo.index];
        itemInfo.errors++;
        itemInfo.lastError = reason;

        if (this.options.unlimitedRetries || (itemInfo.errors <= this.options.retryCount))
        {
            if (itemInfo.delay === null) {
                itemInfo.delay = this.options.initRetryDelay;
            } else {
                itemInfo.delay = Math.min(this.options.maxRetryDelay, itemInfo.delay * this.options.retryDelayCoeff);
            }

            itemInfo.lastFailureMoment = new Date();
            this.items.push(itemInfo);
            if (this.options.coolDownOnFailure) {
                this.waitingCoolDown = true;
            }
        }
        else
        {
            this.isProcessingFailed = true;
        }

        this._tryProcess();
    }

    private _finishSuccess() {
        if (!this.rootResolve) {
            return;
        }

        const rootResolve = this.rootResolve!;
        this._finish();
        rootResolve(this.results);
    }

    private _finishFailure(error?: any) {
        if (!this.rootReject) {
            return;
        }
        const rootReject = this.rootReject!;
        this._finish();
        const errors = this.origItems.map((x) => x.lastError).filter((x) => x);
        rootReject(errors);
    }

    private _finish() {
        this.rootResolve = undefined;
        this.rootReject = undefined;
    }
}
