function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((x) => cloneDeep(x)) as T;
  } else if (typeof value === 'object') {
    const cloned: Record<string, any> = {};

    for (const key in value) {
      cloned[key] = cloneDeep(value[key]);
    }

    return cloned as T;
  }

  return value;
}

export default cloneDeep;
