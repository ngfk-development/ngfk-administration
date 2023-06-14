export function camelToSnakeCase<T extends Record<string, any>>(obj: T) {
  return parseObj(obj, (str) => {
    return str.replace(/[A-Z]/g, (v) => `_${v.toLowerCase()}`);
  });
}

export function parseObj<T extends Record<string, any>>(
  obj: T,
  fn: (key: string) => string,
) {
  return Object.keys(obj).reduce<Record<string, any>>((acc, key) => {
    acc[fn(key)] = obj[key];
    return acc;
  }, {});
}
