import { Prisma } from '@prisma/client';
import PubSub from 'pubsub-js';

type Operation = 'delete' | 'update' | 'upsert';
type Name<T> = Prisma.Payload<T>['name'];
type Result<T, O extends Operation> = Prisma.Result<T, {}, O>;

export function withPubSub() {
  function publish(model: string, operation: string, data: any) {
    PubSub.publish(`${model}.${operation}`, data);
  }

  function subscribe<T, O extends Operation>(
    model: Name<T>,
    operation: O,
    fn: (data: Result<T, O>) => void,
  ) {
    return PubSub.subscribe(`${model}.${operation}`, (_, data) => fn(data));
  }

  function unsubscribe(token: string) {
    PubSub.unsubscribe(token);
  }

  return Prisma.defineExtension({
    name: 'pubsub',
    query: {
      $allModels: {
        $allOperations({ args, model, operation, query }) {
          const task = query(args);

          if (['delete', 'update', 'upsert'].includes(operation)) {
            task.then((data) => publish(model, operation, data));
          }

          return task;
        },
      },
    },
    model: {
      $allModels: {
        subscribe<T, O extends Operation>(
          this: T,
          operation: O,
          fn: (data: Result<T, O>) => void,
        ) {
          const ctx = Prisma.getExtensionContext(this);
          const token = subscribe<T, O>(ctx.$name!, operation, fn);

          return {
            unsubscribe() {
              unsubscribe(token);
            },
          };
        },
      },
    },
  });
}
