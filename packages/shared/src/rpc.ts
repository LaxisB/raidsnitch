import { wrapLog } from './log';

const log = wrapLog('rpc');
let requestCounter = 0;

function generateId() {
  return requestCounter++;
}

/**
 * create a handler function that dispatches incoming RPC requests to it's handlers
 * @param handlers Record of method names to register with their handler functions
 * @param middleware Array of middleware functions to run on each request
 * @param internalCb adapter for the transport layer (e.g. postMessage)
 */
export function setupRpcHandlers(handlers: Record<string, Function>, internalCb: any) {
  return function (request: RpcRequest<unknown>) {
    if (handlers[request.method]) {
      try {
        const res = handlers[request.method](...((request.params as any) ?? []));
        if (request.id == null) {
          // request was 'notification' style, so we don't need to respond
          return;
        }
        if ('then' in res) {
          return res
            .then((result: any) => {
              internalCb(request, { result });
            })
            .catch((error: any) => {
              internalCb(request, { error });
            });
        }
        internalCb(request, { result: res });
      } catch (e) {
        internalCb(request, { error: e });
      }
    } else {
      log.warn('unhandled request', request);
    }
  };
}

type InternalCb<T> = (req: RpcRequest<any>, transferArgs?: number[]) => Promise<T>;

/**
 * wraps a function to be callable via RPC
 */
export function asRpcCall<Fn extends (...args: any) => any>(name: string, internalCb: InternalCb<ReturnType<Fn>>) {
  return async function (...data: Parameters<Fn>): Promise<Awaited<ReturnType<Fn>>> {
    const request = {
      type: 'rpc' as 'rpc',
      method: name,
      params: data,
      id: generateId(),
    };

    return internalCb(request) as any;
  };
}

/**
 * create a RPC client that can be used to call methods on the server
 * it is a naive implementation that assumes that the server will respond to all requests
 */
export function createNaiveClient<T, B extends {}>(baseObject: B, worker: Worker) {
  const pendingRpcCalls = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
  const post: any = (data: any) => {
    return new Promise((resolve, reject) => {
      log.debug('request', data.id, data.method, data.params);
      pendingRpcCalls.set(data.id, { resolve, reject });
      worker.postMessage(data);
    });
  };

  worker.addEventListener('message', (e) => {
    const res = e.data as RpcResponse<any, any>;
    if (res.type !== 'rpc') {
      return;
    }
    if (pendingRpcCalls.has(res.id)) {
      const { resolve, reject } = pendingRpcCalls.get(res.id)!;
      pendingRpcCalls.delete(res.id);
      if ('error' in res) {
        log.warn('error response', res);
        reject(res.error);
      } else {
        log.debug('response', res.id, res.result);
        resolve(res.result);
      }
    }
  });

  let fnCache: Record<string | symbol, any> = {};
  const client = new Proxy(baseObject, {
    get: function (target, prop, _receiver) {
      if (prop in target) {
        return (target as any)[prop];
      }
      if (fnCache[prop]) {
        return fnCache[prop];
      }
      fnCache[prop] = asRpcCall(prop as string, post);
      return fnCache[prop];
    },
  });
  return client as B & AsyncClient<T>;
}

export type AsyncClient<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => AsyncResponse<R> : never;
};

type AsyncResponse<T> = T extends Promise<unknown> ? T : Promise<T>;

export interface RpcRequest<T> {
  type: 'rpc';
  method: string;
  params: T;
  id: number;
}

interface RpcResponseBase {
  type: 'rpc';
  id: number;
}
interface RpcErrorResponse<E> extends RpcResponseBase {
  error: {
    message: string;
    data: E;
  };
}
interface RpcSuccessResponse<T> extends RpcResponseBase {
  result: T;
}
export type RpcResponse<T, E> = RpcErrorResponse<E> | RpcSuccessResponse<T>;

export interface RpcEvent {
  type: 'event';
  event: string;
  data: any;
}
