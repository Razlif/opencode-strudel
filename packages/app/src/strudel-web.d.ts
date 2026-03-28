declare module "@strudel/web" {
  export function initStrudel(input?: {
    prebake?: () => Promise<void> | void
  }): Promise<void>
}
