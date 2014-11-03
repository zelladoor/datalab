// This is for CLIENT-SIDE socket.io defs... FIXME: move this

// The socketio module is itself a function, so you need this odd-looking export= syntax to make the module callable
// See: https://typescript.codeplex.com/discussions/444444
declare module 'socketio' {
  function moduleFunc(): Socket;
  export = moduleFunc;
}
interface Socket {
    on(event: string, callback: (data: any) => void ): void;
    emit(event: string, data: any): void;
}
