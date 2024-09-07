import { Prisma, Service } from '@prisma/client';

export function withService(service: Service) {
  const create = { created_origin: service, updated_origin: service };
  const update = { updated_origin: service };

  return Prisma.defineExtension({
    query: {
      project: {
        create({ args, query }) {
          return query({
            ...args,
            data: { ...create, ...args.data },
          });
        },
        createMany({ args, query }) {
          return query({
            ...args,
            data: Array.isArray(args.data)
              ? args.data.map((data) => ({ ...create, ...data }))
              : { ...create, ...args.data },
          });
        },
        createManyAndReturn({ args, query }) {
          return query({
            ...args,
            data: Array.isArray(args.data)
              ? args.data.map((data) => ({ ...create, ...data }))
              : { ...create, ...args.data },
          });
        },
        update({ args, query }) {
          return query({
            ...args,
            data: { ...update, ...args.data },
          });
        },
        updateMany({ args, query }) {
          return query({
            ...args,
            data: Array.isArray(args.data)
              ? args.data.map((data) => ({ ...update, ...data }))
              : { ...update, ...args.data },
          });
        },
        upsert({ args, query }) {
          return query({
            ...args,
            create: { ...create, ...args.create },
            update: { ...update, ...args.update },
          });
        },
      },
    },
  });
}
