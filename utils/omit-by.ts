import cloneDeep from './clone-deep';

function omitBy<T = unknown>(
  object: Record<any, T>,
  predicate: (value: T) => boolean
) {
  if (!object) return undefined;
  if (!predicate) return object;

  const result = cloneDeep(object);
  const keys = Object.keys(object);

  let currentContext = result;

  for (const key in keys) {
    const value = result[key];

    if (predicate(value)) {
      delete currentContext[key];
    } else if (typeof value === "object" && value !== null) {
      currentContext[key] = omitBy(currentContext, predicate) as T;
    }
  }

  return result;
}

export default omitBy;
