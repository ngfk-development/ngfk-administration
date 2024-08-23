import { Customer, Prisma, Project, Service } from '@prisma/client';

import { MoneybirdContact } from '~/types/moneybird/moneybird-contact';
import { MoneybirdContactPerson } from '~/types/moneybird/moneybird-contact-person';
import { MoneybirdProject } from '~/types/moneybird/moneybird-project';
import { MoneybirdSync } from '~/types/moneybird/moneybird-sync';

export function withMoneybird() {
  return Prisma.defineExtension((database) =>
    database.$extends({
      name: 'moneybird',
      model: {
        contact: {
          moneybirdDelete<T>(this: T, person: MoneybirdContactPerson) {
            const delegate = this as Prisma.ContactDelegate;
            return delegate.delete({ where: { moneybird_id: person.id } });
          },

          moneybirdUpsert<T>(this: T, person: MoneybirdContactPerson) {
            const delegate = this as Prisma.ContactDelegate;

            const data: Omit<Prisma.ContactCreateInput, 'created_origin'> = {
              moneybird_id: person.id,
              moneybird_version: person.version,

              first_name: person.firstname,
              last_name: person.lastname,
              phone: person.phone,
              email: person.email,
              title: person.department,

              updated_origin: Service.MONEYBIRD,
              customer: { connect: { moneybird_id: person.contact_id } },
            };

            return delegate.upsert({
              where: { moneybird_id: person.id },
              create: { ...data, created_origin: Service.MONEYBIRD },
              update: data,
            });
          },
        },
        customer: {
          moneybirdFindUpdated<T>(this: T, sync: MoneybirdSync[]) {
            const values = Prisma.join(
              sync.map((item) =>
                Prisma.join([item.id, item.version], ',', '(', ')'),
              ),
            );

            return database.$queryRaw<Customer[]>`
              SELECT c.*
              FROM customers c
              JOIN (VALUES ${values}) AS s(id, version) ON c.moneybird_id = s.id
              WHERE c.moneybird_version >= s.version
            `;
          },

          moneybirdDelete<T>(this: T, contact: MoneybirdContact) {
            const delegate = this as Prisma.CustomerDelegate;
            return delegate.delete({ where: { moneybird_id: contact.id } });
          },

          moneybirdUpsert<T>(this: T, contact: MoneybirdContact) {
            const delegate = this as Prisma.CustomerDelegate;

            const data: Omit<Prisma.CustomerCreateInput, 'created_origin'> = {
              moneybird_id: contact.id,
              moneybird_version: contact.version,
              moneybird_customer_number: contact.customer_id,
              company_name: contact.company_name,
              address: contact.address1,
              zipcode: contact.zipcode,
              city: contact.city,
              country: contact.country,
              chamber_of_commerce_number: contact.chamber_of_commerce,
              tax_number: contact.tax_number,
              updated_origin: Service.MONEYBIRD,
            };

            return delegate.upsert({
              where: { moneybird_id: contact.id },
              create: { ...data, created_origin: Service.MONEYBIRD },
              update: data,
            });
          },
        },
        project: {
          moneybirdUpdate<T>(
            this: T,
            data: Project,
            project: MoneybirdProject,
          ) {
            const delegate = this as Prisma.ProjectDelegate;

            return delegate.update({
              where: { id: data.id },
              data: {
                moneybird_id: project.id,
                updated_origin: Service.MONEYBIRD,
              },
            });
          },
        },
      },
    }),
  );
}
