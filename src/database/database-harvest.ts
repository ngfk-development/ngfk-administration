import { Contact, Customer, Epic, Prisma, Service } from '@prisma/client';

import { HarvestClient } from '~/types/harvest/harvest-client';
import { HarvestContact } from '~/types/harvest/harvest-contact';
import { HarvestProject } from '~/types/harvest/harvest-project';
import { HarvestTask } from '~/types/harvest/harvest-task';

export function withHarvest() {
  return Prisma.defineExtension((database) =>
    database.$extends({
      name: 'harvest',
      model: {
        contact: {
          harvestUpdate<T>(
            this: T,
            data: Pick<Contact, 'id'>,
            contact: HarvestContact,
          ) {
            const delegate = this as Prisma.ContactDelegate;

            return delegate.update({
              where: { id: data.id },
              data: {
                harvest_id: contact.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
                phone: contact.phone_mobile,
                email: contact.email,
                title: contact.title,
                updated_origin: Service.HARVEST,
              },
            });
          },
        },
        customer: {
          harvestUpdate<T>(this: T, data: Customer, client: HarvestClient) {
            const delegate = this as Prisma.CustomerDelegate;

            return delegate.update({
              where: { id: data.id },
              data: {
                harvest_id: client.id,
                company_name: client.name,
                updated_origin: Service.HARVEST,
              },
            });
          },
        },
        epic: {
          harvestUpdate<T>(this: T, data: Pick<Epic, 'id'>, task: HarvestTask) {
            const delegate = this as Prisma.EpicDelegate;

            return delegate.update({
              where: { id: data.id },
              data: { harvest_id: task.id },
            });
          },
        },
        project: {
          harvestUpsert<T>(this: T, project: HarvestProject) {
            const delegate = this as Prisma.ProjectDelegate;

            const data: Omit<Prisma.ProjectCreateInput, 'created_origin'> = {
              harvest_id: project.id,
              name: project.name,
              code: project.code,
              active: project.is_active,
              billable: project.is_billable,
              hourly_rate: project.hourly_rate,
              updated_origin: Service.HARVEST,
              customer: { connect: { harvest_id: project.client.id } },
            };

            return delegate.upsert({
              where: { harvest_id: project.id },
              create: { ...data, created_origin: Service.HARVEST },
              update: data,
            });
          },
        },
      },
    }),
  );
}
