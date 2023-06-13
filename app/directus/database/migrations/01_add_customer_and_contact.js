/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .createTable('app_customer', (table) => {
      table.uuid('id', { primaryKey: true });
      table.string('id_harvest');
      table.string('id_moneybird');

      table.string('name');
      table.string('street');
      table.string('postal_code', 6);
      table.string('city');

      table.string('kvk_number');
      table.string('vat_number');
    })
    .createTable('app_contact', (table) => {
      table.uuid('id', { primaryKey: true });
      table.string('id_harvest');
      table.string('id_moneybird');

      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone');
      table.string('email');

      table.uuid('customer');
      table
        .foreign('customer')
        .references('app_customer.id')
        .onDelete('SET NULL');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('app_contact').dropTable('app_customer');
}
