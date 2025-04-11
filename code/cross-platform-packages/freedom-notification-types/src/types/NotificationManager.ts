import { DoubleLinkedList } from 'doublell';

import type { Notifiable } from './Notifiable.ts';

export class NotificationManager<NotifT extends Record<string, object>> implements Notifiable<NotifT> {
  private listenersByType_: Partial<{ [K in keyof NotifT]: DoubleLinkedList<(args: NotifT[K]) => void> }> = {};

  private hookType_: ((type: keyof NotifT) => void) | undefined;
  private unhookType_: ((type: keyof NotifT) => void) | undefined;

  constructor({
    hookType,
    unhookType
  }: {
    /** Called before transitioning from 0 to 1 listeners of a type */
    hookType?: (type: keyof NotifT) => void;
    /** Called after transitioning from 1 to 0 listeners of a type */
    unhookType?: (type: keyof NotifT) => void;
  } = {}) {
    this.hookType_ = hookType;
    this.unhookType_ = unhookType;
  }

  // Notifiable Methods

  public readonly addListener = <TypeT extends keyof NotifT>(type: TypeT, callback: (args: NotifT[TypeT]) => void): (() => void) => {
    let listeners = this.listenersByType_[type];
    if (listeners === undefined) {
      listeners = new DoubleLinkedList();
      this.listenersByType_[type] = listeners;

      this.hookType_?.(type);
    }

    const node = listeners.append(callback);

    let alreadyRemoved = false;
    return () => {
      if (alreadyRemoved) {
        return; // Nothing to do
      }
      alreadyRemoved = true;

      listeners.remove(node);

      if (listeners.getLength() === 0) {
        delete this.listenersByType_[type];
        this.unhookType_?.(type);
      }
    };
  };

  // Public Methods

  public notify<TypeT extends keyof NotifT>(type: TypeT, args: NotifT[TypeT]) {
    const listeners = this.listenersByType_[type];
    if (listeners === undefined) {
      return;
    }

    const allListeners = listeners.toArray();
    for (const listener of allListeners) {
      listener(args);
    }
  }
}
