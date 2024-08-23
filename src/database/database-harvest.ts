import { Contact, Customer, Prisma, Service } from '@prisma/client';

import { HarvestClient } from '~/types/harvest/harvest-client';
import { HarvestContact } from '~/types/harvest/harvest-contact';

export function withHarvest() {
  return Prisma.defineExtension({
    name: 'harvest',
    model: {
      contact: {
        harvestUpdate<T>(this: T, data: Contact, contact: HarvestContact) {
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
    },
  });
}
