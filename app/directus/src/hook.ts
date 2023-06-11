import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ filter }) => {
  filter('users.create', async (input: any) => {
    const email = process.env.ADMIN_EMAIL;
    const token = process.env.ADMIN_API_KEY;
    if (!email || !token) return input;
    return input.email === email ? { ...input, token } : input;
  });
});
