export interface Notifiable<NotifT extends Record<string, object>> {
  addListener: <TypeT extends keyof NotifT>(type: TypeT, callback: (args: NotifT[TypeT]) => void) => () => void;
}
