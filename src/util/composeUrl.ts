export const composeUrl = (base: string = "", _: string = "", path: string = ""): string => {
  const composedPath = path;
  /* If the base is empty, preceding slash will be trimmed during composition */
  if (base === "" && composedPath.startsWith("/")) {
    return composedPath;
  }

  /* If the base contains a trailing slash, it will be trimmed during composition */
  return base!.endsWith("/") ? `${base!.slice(0, -1)}${composedPath}` : `${base}${composedPath}`;
};
